package g5.backend.cafeteria.producto;

import g5.backend.cafeteria.auth.SesionUsuario;
import g5.backend.cafeteria.auth.TipoUsuario;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controlador REST para el catálogo de productos y la administración del menú.
 * Ofrece rutas para la consulta del menú para clientes (RU-01) y rutas protegidas
 * para la creación, actualización y gestión de imágenes por parte del personal (RU-06).
 */
@RestController
@RequestMapping("/api/productos")
public class ProductoControlador {

   private static final TipoUsuario[] PERSONAL = { TipoUsuario.TRABAJADOR };

   public record ProductoDto(long codigoProducto, String nombre, BigDecimal precio,
         TipoProducto tipoProducto, boolean disponible, String imagenUrl) {
      static ProductoDto de(Producto p) {
         String url = p.rutaImagen() == null ? null : "/imagenes/" + p.rutaImagen();
         return new ProductoDto(p.codigoProducto(), p.nombre(), p.precio(),
               p.tipoProducto(), p.disponible(), url);
      }
   }

   /** Campos opcionales: solo se modifican los que vengan en el JSON. */
   public record CambioProductoRequest(String nombre, BigDecimal precio, Boolean disponible) {
   }

   public record MenuRequest(List<Long> codigos) {
   }

   private final ProductoServicio servicio;
   private final SesionUsuario sesion;

   public ProductoControlador(ProductoServicio servicio, SesionUsuario sesion) {
      this.servicio = servicio;
      this.sesion = sesion;
   }

   // ---------------------------- Público (clientes) ----------------------------

   /** RU-01: menú con productos disponibles y sus precios. No requiere sesión. */
   @GetMapping("/menu")
   public List<ProductoDto> menu() {
      return servicio.listarMenu().stream().map(ProductoDto::de).toList();
   }

   // ---------------------------- Personal / administrador ----------------------------

   /**
    * Catálogo completo. Filtros opcionales:
    * ?tipo=bebida|alimento&disponible=true|false
    */
   @GetMapping
   public List<ProductoDto> listar(
         @RequestParam(value = "tipo", required = false) String tipo,
         @RequestParam(value = "disponible", required = false) Boolean disponible,
         HttpServletRequest request) {
      sesion.exigir(request, PERSONAL);
      return servicio.listar(tipo, disponible).stream().map(ProductoDto::de).toList();
   }

   @GetMapping("/{codigo}")
   public ProductoDto obtener(@PathVariable("codigo") long codigo, HttpServletRequest request) {
      sesion.exigir(request, PERSONAL);
      return ProductoDto.de(servicio.obtener(codigo));
   }

   @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
   public ResponseEntity<ProductoDto> crear(
         @RequestParam(value = "nombre", required = false) String nombre,
         @RequestParam(value = "precio", required = false) String precio,
         @RequestParam(value = "tipo", required = false) String tipo,
         @RequestParam(value = "imagen", required = false) MultipartFile imagen,
         HttpServletRequest request) {
      sesion.exigir(request, PERSONAL);
      Producto creado = servicio.crear(nombre, precio, tipo, imagen);
      return ResponseEntity.status(HttpStatus.CREATED).body(ProductoDto.de(creado));
   }

   /** RU-06: cambiar nombre, precio y/o disponibilidad (JSON parcial). */
   @PatchMapping("/{codigo}")
   public ProductoDto actualizar(@PathVariable("codigo") long codigo,
         @RequestBody(required = false) CambioProductoRequest body,
         HttpServletRequest request) {
      sesion.exigir(request, PERSONAL);
      CambioProductoRequest c = body == null ? new CambioProductoRequest(null, null, null) : body;
      return ProductoDto.de(servicio.actualizar(codigo, c.nombre(), c.precio(), c.disponible()));
   }

   /** Reemplaza la imagen del producto (multipart/form-data, campo "imagen"). */
   @PutMapping(value = "/{codigo}/imagen", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
   public ProductoDto reemplazarImagen(@PathVariable("codigo") long codigo,
         @RequestParam(value = "imagen", required = false) MultipartFile imagen,
         HttpServletRequest request) {
      sesion.exigir(request, PERSONAL);
      return ProductoDto.de(servicio.reemplazarImagen(codigo, imagen));
   }

   /**
    * Arma el menú: quedan disponibles solo los productos de la lista; los demás
    * pasan a no disponibles.
    */
   @PutMapping("/menu")
   public List<ProductoDto> armarMenu(@RequestBody(required = false) MenuRequest body,
         HttpServletRequest request) {
      sesion.exigir(request, PERSONAL);
      List<Long> codigos = body == null ? null : body.codigos();
      return servicio.armarMenu(codigos).stream().map(ProductoDto::de).toList();
   }
}