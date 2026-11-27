package g5.backend.cafeteria.pedido;

import java.math.BigDecimal;
/**
 * Entidad de dominio que representa una línea de detalle dentro de un pedido registrado
 * Almacena el precio unitario histórico congelado al momento de la compra (RN-NEG-04).
 */
public record DetallePedido(
      long codigoProducto,
      String nombreProducto,
      BigDecimal precioUnitario,
      int cantidad) {

   public BigDecimal subtotal() {
      return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
   }
}