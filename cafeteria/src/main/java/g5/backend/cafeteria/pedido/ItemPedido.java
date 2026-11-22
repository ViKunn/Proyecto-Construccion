package g5.backend.cafeteria.pedido;

/**
 * Línea solicitada por el cliente. Solo se reciben código y cantidad:
 * el precio y el total los calcula siempre el servidor (RN-NEG-03/04).
 */
public record ItemPedido(Long codigoProducto, Integer cantidad) {
}