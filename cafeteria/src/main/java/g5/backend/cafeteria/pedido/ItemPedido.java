package g5.backend.cafeteria.pedido;

/**
 * Estructura de datos que representa una línea de producto solicitada en la
 * creación de un pedido.
 * Solo recibe el identificador del producto y la cantidad; los precios son
 * fijados por el servidor (RN-NEG-03/04).
 */
public record ItemPedido(Long codigoProducto, Integer cantidad) {
}