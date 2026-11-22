package g5.backend.cafeteria.producto;

import g5.backend.cafeteria.core.AlmacenImagenes;
import g5.backend.cafeteria.core.ConflictoException;
import g5.backend.cafeteria.core.NoEncontradoException;
import g5.backend.cafeteria.core.ValidacionException;
import g5.backend.cafeteria.core.ValidadorProducto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProductoServicio {

   private static final String MSG_NOMBRE_DUPLICADO = "Ya existe un producto con ese nombre";

   private final ProductoRepositorio repositorio;
   private final ValidadorProducto validador;
   private final AlmacenImagenes almacen;

   public ProductoServicio(ProductoRepositorio repositorio, ValidadorProducto validador,
                           AlmacenImagenes almacen) {
      this.repositorio = repositorio;
      this.validador = validador;
      this.almacen = almacen;
   }

   // ------------------------------------------------------------------
   // Consultas
   // ------------------------------------------------------------------

   /** Menú que ven los clientes: solo productos disponibles (RN-NEG-02). */
   public List<Producto> listarMenu() {
      return repositorio.listar(null, true);
   }

   /** Catálogo completo para el personal, con filtros opcionales. */
   public List<Producto> listar(String tipoTexto, Boolean disponible) {
      TipoProducto tipo = null;
      if (tipoTexto != null && !tipoTexto.isBlank()) {
         tipo = validador.convertirTipo(tipoTexto);
         if (tipo == null) {
            throw new ValidacionException(Map.of("tipo", validador.errorTipo(null)));
         }
      }
      return repositorio.listar(tipo, disponible);
   }

   public Producto obtener(long codigo) {
      return repositorio.buscarPorCodigo(codigo)
            .orElseThrow(() -> new NoEncontradoException("Producto no encontrado"));
   }

   // ------------------------------------------------------------------
   // Alta
   // ------------------------------------------------------------------

   public Producto crear(String nombre, String precioTexto, String tipoTexto, MultipartFile imagen) {
      String n = validador.normalizarNombre(nombre);
      BigDecimal precio = validador.convertirPrecio(precioTexto);
      TipoProducto tipo = validador.convertirTipo(tipoTexto);
      boolean hayImagen = imagen != null && !imagen.isEmpty();

      Map<String, String> errores = new LinkedHashMap<>();
      agregar(errores, "nombre", validador.errorNombre(n));
      agregar(errores, "precio", validador.errorPrecio(precio));
      agregar(errores, "tipo", validador.errorTipo(tipo));
      if (hayImagen) {
         agregar(errores, "imagen", almacen.errorImagen(imagen));
      }
      if (!errores.isEmpty()) {
         throw new ValidacionException(errores);
      }

      if (repositorio.existePorNombre(n, null)) {
         throw new ConflictoException("nombre", MSG_NOMBRE_DUPLICADO);
      }

      // Se guarda el archivo primero; si la BD falla, se borra para no dejar huérfanos
      String ruta = null;
      try {
         if (hayImagen) {
            ruta = almacen.guardar(imagen, tipo.valorBd(), n);
         }
         return repositorio.insertar(n, precio.setScale(2, RoundingMode.UNNECESSARY), tipo, ruta);
      } catch (RuntimeException e) {
         almacen.eliminar(ruta);
         if (e instanceof DuplicateKeyException) {
            throw new ConflictoException("nombre", MSG_NOMBRE_DUPLICADO);
         }
         throw e;
      }
   }

   // ------------------------------------------------------------------
   // Modificación
   // ------------------------------------------------------------------

   /**
    * Cambia nombre, precio y/o disponibilidad (los null no se tocan).
    * Un cambio de precio NO afecta a pedidos existentes: detalle_pedido conserva su precio_unitario (RN-NEG-04).
    */
   public Producto actualizar(long codigo, String nombre, BigDecimal precio, Boolean disponible) {
      obtener(codigo);

      if (nombre == null && precio == null && disponible == null) {
         throw new ValidacionException(Map.of("cuerpo",
               "Debe indicar al menos un campo: nombre, precio o disponible"));
      }

      Map<String, String> errores = new LinkedHashMap<>();
      String n = null;
      if (nombre != null) {
         n = validador.normalizarNombre(nombre);
         agregar(errores, "nombre", validador.errorNombre(n));
      }
      if (precio != null) {
         agregar(errores, "precio", validador.errorPrecio(precio));
      }
      if (!errores.isEmpty()) {
         throw new ValidacionException(errores);
      }

      if (n != null && repositorio.existePorNombre(n, codigo)) {
         throw new ConflictoException("nombre", MSG_NOMBRE_DUPLICADO);
      }

      BigDecimal p = precio == null ? null : precio.setScale(2, RoundingMode.UNNECESSARY);
      try {
         return repositorio.actualizar(codigo, n, p, disponible)
               .orElseThrow(() -> new NoEncontradoException("Producto no encontrado"));
      } catch (DuplicateKeyException e) {
         throw new ConflictoException("nombre", MSG_NOMBRE_DUPLICADO);
      }
   }

   public Producto reemplazarImagen(long codigo, MultipartFile imagen) {
      Producto actual = obtener(codigo);
      if (imagen == null || imagen.isEmpty()) {
         throw new ValidacionException(Map.of("imagen", "Debe adjuntar una imagen"));
      }
      String error = almacen.errorImagen(imagen);
      if (error != null) {
         throw new ValidacionException(Map.of("imagen", error));
      }

      String nueva = almacen.guardar(imagen, actual.tipoProducto().valorBd(), actual.nombre());
      try {
         repositorio.actualizarRutaImagen(codigo, nueva);
      } catch (RuntimeException e) {
         almacen.eliminar(nueva);
         throw e;
      }
      almacen.eliminar(actual.rutaImagen());   // la imagen anterior ya no se usa
      return obtener(codigo);
   }

   /**
    * Arma el menú: quedan disponibles exactamente los productos indicados y no disponibles los demás.
    * No existe borrado de productos: retirar del menú = disponible=false (los pedidos históricos
    * siguen referenciando al producto).
    */
   public List<Producto> armarMenu(List<Long> codigos) {
      if (codigos == null || codigos.isEmpty()) {
         throw new ValidacionException(Map.of("codigos", "Debe indicar al menos un producto para el menú"));
      }
      if (codigos.stream().anyMatch(Objects::isNull)) {
         throw new ValidacionException(Map.of("codigos", "La lista contiene códigos vacíos"));
      }

      Set<Long> solicitados = new LinkedHashSet<>(codigos);
      Set<Long> existentes = repositorio.buscarExistentes(solicitados);
      List<Long> faltantes = solicitados.stream().filter(c -> !existentes.contains(c)).toList();
      if (!faltantes.isEmpty()) {
         throw new ValidacionException(Map.of("codigos", "No existen los productos: " + faltantes));
      }

      repositorio.fijarMenu(solicitados);
      return repositorio.listar(null, true);
   }

   private static void agregar(Map<String, String> errores, String campo, String error) {
      if (error != null) {
         errores.put(campo, error);
      }
   }
}