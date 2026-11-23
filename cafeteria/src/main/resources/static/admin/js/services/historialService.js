/**
 * Archivo: historialService.js
 * Propósito: Conectar el módulo de auditoría e historial de pedidos del Administrador
 * con los endpoints reales de HistorialControlador:
 * - GET /api/historial-pedidos?pagina=0&limite=20&idPedido=...
 * - GET /api/historial-pedidos/{idPedido}
 */

import { request } from "../api/httpClient.js";

/**
 * Consulta el historial paginado de pedidos agrupado por pedido.
 *
 * @param {Object} [opciones={}] - { pagina (desde 0), limite (máx. 200), idPedido (opcional) }.
 * @returns {Promise<{ total: number, pagina: number, limite: number, pedidos: Array<Object> }>}
 */
export async function listarHistorialPedidos(opciones = {}) {
  const params = new URLSearchParams();
  if (opciones.pagina !== undefined && opciones.pagina !== null) {
    params.set("pagina", String(opciones.pagina));
  }
  if (opciones.limite !== undefined && opciones.limite !== null) {
    params.set("limite", String(opciones.limite));
  }
  if (opciones.idPedido) {
    params.set("idPedido", String(opciones.idPedido).trim());
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/historial-pedidos${query}`);
}

/**
 * Consulta el detalle completo de un pedido para el administrador:
 * datos del pedido, código de retiro, cliente (con celular), ítems y cambios de estado.
 *
 * @param {number|string} idPedido - ID del pedido a inspeccionar.
 * @returns {Promise<Object>} PedidoDetalleAdmin.
 */
export async function obtenerDetalleHistorialPedido(idPedido) {
  return request(`/historial-pedidos/${encodeURIComponent(idPedido)}`);
}
