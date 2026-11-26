/**
 * Archivo: pedidoService.js
 * Propósito: Operaciones del cliente sobre el menú y sus pedidos:
 * - GET  /api/productos/menu            (HU-CLI-01)
 * - GET  /api/pedidos/configuracion     (límite de cantidad por producto)
 * - POST /api/pedidos                   (HU-CLI-05)
 * - GET  /api/pedidos/mis-pedidos       (HU-CLI-06)
 * - GET  /api/pedidos/{id}              (HU-CLI-06)
 */

import { request } from "../api/httpClient.js";

/**
 * @returns {Promise<Array<Object>>} Productos disponibles con precio e imagen.
 */
export function obtenerMenu() {
  return request("/productos/menu");
}

/**
 * @returns {Promise<number>} Unidades máximas por producto; -1 si no hay límite.
 */
export async function obtenerLimiteCantidad() {
  try {
    const datos = await request("/pedidos/configuracion");
    const limite = Number(datos?.cantidadMaximaPorProducto);
    return Number.isInteger(limite) ? limite : -1;
  } catch {
    return -1;
  }
}

/**
 * Confirma el pedido. Solo se envían códigos y cantidades: el precio y el importe
 * los calcula el servidor con los precios vigentes (RN-NEG-03/04).
 *
 * @param {Array<{codigoProducto:number, cantidad:number}>} items - Líneas del carrito.
 * @returns {Promise<Object>} Pedido creado con código de retiro e importe total.
 */
export function confirmarPedido(items) {
  return request("/pedidos", {
    method: "POST",
    body: {
      items: items.map((i) => ({ codigoProducto: i.codigoProducto, cantidad: i.cantidad }))
    }
  });
}

/**
 * @param {number} [limite=50] - Máximo de pedidos a traer.
 * @returns {Promise<Array<Object>>} Pedidos del cliente, más recientes primero.
 */
export function obtenerMisPedidos(limite = 50) {
  return request(`/pedidos/mis-pedidos?limite=${encodeURIComponent(limite)}`);
}

/**
 * @param {number} idPedido - Número del pedido.
 * @returns {Promise<Object>} Pedido con detalle, estado y código de retiro.
 */
export function obtenerPedido(idPedido) {
  return request(`/pedidos/${encodeURIComponent(idPedido)}`);
}
