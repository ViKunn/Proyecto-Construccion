package g5.backend.cafeteria.producto;

import java.math.BigDecimal;
/**
 * Entidad de dominio que modela un producto del catálogo de la cafetería.
 */
public record Producto(
      long codigoProducto,
      String nombre,
      BigDecimal precio,
      boolean disponible,
      TipoProducto tipoProducto,
      String rutaImagen) {
}