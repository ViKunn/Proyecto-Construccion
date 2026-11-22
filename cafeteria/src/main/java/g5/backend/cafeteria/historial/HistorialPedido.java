package g5.backend.cafeteria.historial;

import java.util.List;

/** Línea de tiempo de un pedido: sus cambios de estado, en orden cronológico. */
public record HistorialPedido(long idPedido, List<CambioEstado> cambios) {
}