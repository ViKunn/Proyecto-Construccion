/**
 * Archivo: pedidoService.js
 * Propósito: Conectar el Panel de Pedidos y la Validación de Código de Retiro
 * con los endpoints reales de PedidoControlador (Spring Boot):
 * - GET  /api/pedidos (en curso o filtrado por ?estado=)
 * - GET  /api/pedidos/{id}
 * - POST /api/pedidos/{id}/iniciar-preparacion
 * - POST /api/pedidos/{id}/marcar-listo
 * - POST /api/pedidos/{id}/verificar-codigo
 * - POST /api/pedidos/{id}/entregar
 */

import { ESTADOS_PEDIDO } from "../config.js";
import { request } from "../api/httpClient.js";

/**
 * Obtiene la cola de pedidos para el personal (HU-PER-04).
 * - Sin estado: devuelve pedidos en curso (pendiente, en_preparacion, listo).
 * - Con estado: filtra por pendiente, en_preparacion, listo o entregado.
 *
 * @param {string} [estado=""] - Estado opcional.
 * @param {number} [limite=100] - Límite máximo de resultados (hasta 500).
 * @returns {Promise<Array<Object>>} Lista de PedidoDto (versión personal, sin codigoRetiro).
 */
export async function listarPedidos(estado = "", limite = 100) {
  const params = new URLSearchParams();
  if (estado) {
    params.set("estado", estado);
  }
  if (limite) {
    params.set("limite", String(limite));
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/pedidos${query}`);
}

/**
 * Obtiene todos los pedidos relevantes para los contadores del panel:
 * consulta pedidos en curso (pendiente, en_preparacion, listo) y entregados en paralelo.
 *
 * @returns {Promise<Array<Object>>} Lista combinada de pedidos.
 */
export async function listarTodosLosPedidos() {
  const [enCurso, entregados] = await Promise.all([
    listarPedidos("", 200),
    listarPedidos(ESTADOS_PEDIDO.ENTREGADO, 100)
  ]);
  return [...enCurso, ...entregados];
}

/**
 * Consulta el detalle de un pedido específico (cliente e items con subtotal).
 *
 * @param {number|string} idPedido - ID del pedido.
 * @returns {Promise<Object>} PedidoDto.
 */
export async function obtenerDetallePedido(idPedido) {
  return request(`/pedidos/${encodeURIComponent(idPedido)}`);
}

/**
 * Cambia un pedido de estado pendiente a en_preparacion (HU-PER-05).
 * El servidor obtiene id_trabajador desde la sesión HttpOnly.
 *
 * @param {number|string} idPedido - ID del pedido.
 * @returns {Promise<Object>} PedidoDto actualizado.
 */
export async function iniciarPreparacion(idPedido) {
  return request(`/pedidos/${encodeURIComponent(idPedido)}/iniciar-preparacion`, {
    method: "POST"
  });
}

/**
 * Cambia un pedido de estado en_preparacion a listo (HU-PER-06).
 *
 * @param {number|string} idPedido - ID del pedido.
 * @returns {Promise<Object>} PedidoDto actualizado.
 */
export async function marcarPedidoListo(idPedido) {
  return request(`/pedidos/${encodeURIComponent(idPedido)}/marcar-listo`, {
    method: "POST"
  });
}

/**
 * Comprueba si el código presentado por el cliente coincide con el del pedido (sin entregarlo aún).
 *
 * @param {number|string} idPedido - ID del pedido listo.
 * @param {string} codigoRetiro - Código de 6 caracteres presentado por el cliente.
 * @returns {Promise<{ valido: boolean }>} Resultado de la verificación.
 */
export async function verificarCodigoRetiro(idPedido, codigoRetiro) {
  return request(`/pedidos/${encodeURIComponent(idPedido)}/verificar-codigo`, {
    method: "POST",
    body: { codigoRetiro: String(codigoRetiro || "").trim().toUpperCase() }
  });
}

/**
 * Entrega un pedido (HU-PER-07, RN-NEG-07): el servidor exige estado "listo"
 * y vuelve a comprobar que el código de retiro coincida antes de cambiarlo a "entregado".
 *
 * @param {number|string} idPedido - ID del pedido.
 * @param {string} codigoRetiro - Código de retiro presentado por el cliente.
 * @returns {Promise<Object>} PedidoDto en estado entregado.
 */
export async function entregarPedido(idPedido, codigoRetiro) {
  return request(`/pedidos/${encodeURIComponent(idPedido)}/entregar`, {
    method: "POST",
    body: { codigoRetiro: String(codigoRetiro || "").trim().toUpperCase() }
  });
}
