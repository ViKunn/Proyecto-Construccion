package g5.backend.cafeteria.historial;

import g5.backend.cafeteria.pedido.EstadoPedido;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/** 
 * Detalle completo de un pedido para el administrador. 
 * Tiene en cuenta las vistas v_detalle_pedidos y v_historial_pedidos
*/

public record PedidoDetalleAdmin(
      long idPedido,
      OffsetDateTime fechaRegistro,
      EstadoPedido estadoActual,
      BigDecimal importeTotal,
      String clienteNombre,
      String clienteApellido,
      String clienteCelular,
      List<Linea> items,
      List<CambioEstado> cambios) {

   /** Una fila de la vista v_detalle_pedidos (un producto del pedido). */
   public record Linea(
         long idDetalle,
         String productoNombre,
         int cantidad,
         BigDecimal precioUnitario,
         BigDecimal subtotal) {
   }

   public PedidoDetalleAdmin con(List<Linea> nuevosItems, List<CambioEstado> nuevosCambios) {
      return new PedidoDetalleAdmin(idPedido, fechaRegistro, estadoActual, importeTotal,
            clienteNombre, clienteApellido, clienteCelular, nuevosItems, nuevosCambios);
   }
}