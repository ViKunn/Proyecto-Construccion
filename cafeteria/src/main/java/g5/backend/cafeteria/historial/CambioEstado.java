package g5.backend.cafeteria.historial;

import g5.backend.cafeteria.pedido.EstadoPedido;
import java.time.OffsetDateTime;

/**
 * Una fila de v_historial_pedidos. trabajadorNombre/Apellido son null en el estado inicial (pendiente).
 * Modela un evento o transición de estado en la línea de tiempo de un pedido.
*/
public record CambioEstado(
      long idHistorial,
      EstadoPedido estado,
      OffsetDateTime fechaCambio,
      String trabajadorNombre,
      String trabajadorApellido) {
}