package g5.backend.cafeteria.producto;

import java.math.BigDecimal;

public record Producto(
      long codigoProducto,
      String nombre,
      BigDecimal precio,
      boolean disponible,
      TipoProducto tipoProducto,
      String rutaImagen) {
}