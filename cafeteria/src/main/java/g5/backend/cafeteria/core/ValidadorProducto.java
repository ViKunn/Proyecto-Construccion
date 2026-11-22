package g5.backend.cafeteria.core;

import g5.backend.cafeteria.producto.TipoProducto;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

/**
 * Validaciones de los datos de un producto (null = válido, igual que
 * ValidadorDatos).
 */
@Component
public class ValidadorProducto {

   // Los productos pueden llevar números y signos comunes: "Jugo de naranja 500
   // ml", "Té (frío)"
   private static final Pattern NOMBRE = Pattern.compile("^[\\p{L}\\p{N}][\\p{L}\\p{N} .,'()&%+/-]*$");
   private static final int MIN_NOMBRE = 2;
   private static final int MAX_NOMBRE = 60;
   private static final BigDecimal PRECIO_MAXIMO = new BigDecimal("999.99");

   public String normalizarNombre(String s) {
      if (s == null) {
         return "";
      }
      return Normalizer.normalize(s, Normalizer.Form.NFC).trim().replaceAll("\\s+", " ");
   }

   public String errorNombre(String nombre) {
      if (nombre.isEmpty()) {
         return "El nombre es obligatorio";
      }
      if (nombre.length() < MIN_NOMBRE || nombre.length() > MAX_NOMBRE) {
         return "El nombre debe tener entre " + MIN_NOMBRE + " y " + MAX_NOMBRE + " caracteres";
      }
      if (!NOMBRE.matcher(nombre).matches()) {
         return "El nombre contiene caracteres no permitidos";
      }
      return null;
   }

   /**
    * Convierte texto (formularios) a precio; acepta coma o punto. Devuelve null si
    * no es numérico.
    */
   public BigDecimal convertirPrecio(String texto) {
      if (texto == null || texto.isBlank()) {
         return null;
      }
      try {
         return new BigDecimal(texto.trim().replace(',', '.'));
      } catch (NumberFormatException e) {
         return null;
      }
   }

   public String errorPrecio(BigDecimal precio) {
      if (precio == null) {
         return "El precio es obligatorio y debe ser un número válido";
      }
      if (precio.signum() <= 0) {
         return "El precio debe ser mayor a 0";
      }
      if (precio.stripTrailingZeros().scale() > 2) {
         return "El precio admite como máximo 2 decimales";
      }
      if (precio.compareTo(PRECIO_MAXIMO) > 0) {
         return "El precio no puede superar " + PRECIO_MAXIMO;
      }
      return null;
   }

   public TipoProducto convertirTipo(String texto) {
      return TipoProducto.desdeTexto(texto);
   }

   public String errorTipo(TipoProducto tipo) {
      return tipo == null ? "El tipo debe ser 'bebida' o 'alimento'" : null;
   }
}