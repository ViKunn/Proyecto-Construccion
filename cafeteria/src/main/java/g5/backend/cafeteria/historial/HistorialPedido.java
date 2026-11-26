package g5.backend.cafeteria.historial;

import java.util.List;

/**
 * Agrupa la secuencia cronológica de transiciones de estado asociadas a un pedido específico.
 */
public record HistorialPedido(long idPedido, List<CambioEstado> cambios) {
}