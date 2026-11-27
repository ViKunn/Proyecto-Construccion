package g5.backend.cafeteria.core;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

/**
 * Componente encargado del almacenamiento, validación y gestión de imágenes de productos en disco.
 * Implementa medidas de seguridad como nombres generados aleatoriamente por el servidor mediante slugs y UUID,
 * detección de formatos reales a través de números mágicos (magic bytes) en lugar de extensiones arbitrarias,
 * y restricción de rutas para evitar ataques de salto de directorio (directory traversal).
 */

@Component
public class AlmacenImagenes {

   private static final Logger log = LoggerFactory.getLogger(AlmacenImagenes.class);

   private final Path base;
   private final long maxBytes;

   public AlmacenImagenes(
         @Value("${app.imagenes.directorio:uploads/productos}") String directorio,
         @Value("${app.imagenes.max-bytes:2097152}") long maxBytes) {
      this.base = Path.of(directorio).toAbsolutePath().normalize();
      this.maxBytes = maxBytes;
      try {
         Files.createDirectories(base);
      } catch (IOException e) {
         throw new UncheckedIOException("No se pudo crear el directorio de imágenes: " + base, e);
      }
   }

   public Path directorioBase() {
      return base;
   }

   /** Devuelve el mensaje de error, o null si la imagen es aceptable. */
   public String errorImagen(MultipartFile archivo) {
      if (archivo == null || archivo.isEmpty()) {
         return "La imagen está vacía";
      }
      if (archivo.getSize() > maxBytes) {
         return "La imagen no puede superar " + (maxBytes / (1024 * 1024)) + " MB";
      }
      if (detectarExtension(archivo) == null) {
         return "Formato de imagen no permitido (solo JPG, PNG o WEBP)";
      }
      return null;
   }

   /** Guarda la imagen y devuelve la ruta relativa (con "/"). */
   public String guardar(MultipartFile archivo, String subcarpeta, String nombreBase) {
      String extension = detectarExtension(archivo);
      if (extension == null) {
         throw new ValidacionException(
               Map.of("imagen", "Formato de imagen no permitido (solo JPG, PNG o WEBP)"));
      }
      String nombreArchivo = slug(nombreBase) + "-"
            + UUID.randomUUID().toString().substring(0, 8) + "." + extension;

      Path destino = base.resolve(subcarpeta).resolve(nombreArchivo).normalize();
      if (!destino.startsWith(base)) {
         throw new IllegalStateException("Ruta de imagen fuera del directorio permitido");
      }
      try {
         Files.createDirectories(destino.getParent());
         try (InputStream in = archivo.getInputStream()) {
            Files.copy(in, destino);
         }
      } catch (IOException e) {
         throw new UncheckedIOException("No se pudo guardar la imagen", e);
      }
      return subcarpeta + "/" + nombreArchivo;
   }

   /** Elimina un archivo previamente guardado. No falla si no existe o la ruta es null. */
   public void eliminar(String rutaRelativa) {
      if (rutaRelativa == null || rutaRelativa.isBlank()) {
         return;
      }
      Path archivo = base.resolve(rutaRelativa).normalize();
      if (!archivo.startsWith(base)) {
         return;
      }
      try {
         Files.deleteIfExists(archivo);
      } catch (IOException e) {
         log.warn("No se pudo eliminar la imagen {}: {}", rutaRelativa, e.getMessage());
      }
   }

   private String detectarExtension(MultipartFile archivo) {
      try (InputStream in = archivo.getInputStream()) {
         byte[] h = in.readNBytes(12);
         if (h.length >= 3 && (h[0] & 0xFF) == 0xFF && (h[1] & 0xFF) == 0xD8 && (h[2] & 0xFF) == 0xFF) {
            return "jpg";
         }
         if (h.length >= 8 && (h[0] & 0xFF) == 0x89 && h[1] == 'P' && h[2] == 'N' && h[3] == 'G'
               && h[4] == 0x0D && h[5] == 0x0A && h[6] == 0x1A && h[7] == 0x0A) {
            return "png";
         }
         if (h.length >= 12 && h[0] == 'R' && h[1] == 'I' && h[2] == 'F' && h[3] == 'F'
               && h[8] == 'W' && h[9] == 'E' && h[10] == 'B' && h[11] == 'P') {
            return "webp";
         }
         return null;
      } catch (IOException e) {
         throw new UncheckedIOException("No se pudo leer la imagen", e);
      }
   }

   private static String slug(String texto) {
      String s = Normalizer.normalize(texto == null ? "" : texto, Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("^-+|-+$", "");
      if (s.length() > 40) {
         s = s.substring(0, 40).replaceAll("-+$", "");
      }
      return s.isEmpty() ? "producto" : s;
   }
}