package g5.backend.cafeteria.pedido;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * Modelo interno (incluye el código de retiro). Los controladores deciden qué
 * parte se expone.
 */
public record Pedido(
      long idPedido,
      long codigoCliente,
      String codigoRetiro,
      EstadoPedido estado,
      OffsetDateTime fechaRegistro,
      BigDecimal importeTotal,
      String clienteNombre,
      String clienteApellido,
      List<DetallePedido> detalles) {

   public Pedido conDetalles(List<DetallePedido> nuevos) {
      return new Pedido(idPedido, codigoCliente, codigoRetiro, estado, fechaRegistro,
            importeTotal, clienteNombre, clienteApellido, nuevos);
   }
}