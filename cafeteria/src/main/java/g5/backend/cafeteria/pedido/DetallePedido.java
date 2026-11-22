package g5.backend.cafeteria.pedido;

import java.math.BigDecimal;

public record DetallePedido(
      long codigoProducto,
      String nombreProducto,
      BigDecimal precioUnitario,
      int cantidad) {

   public BigDecimal subtotal() {
      return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
   }
}