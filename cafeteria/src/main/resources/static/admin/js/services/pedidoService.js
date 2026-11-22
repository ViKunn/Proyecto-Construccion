/**
 * Archivo: pedidoService.js
 * Propósito: Gestionar las consultas de pedidos, transiciones de estado y
 * validación del código de retiro (HU-PER-04 a HU-PER-07).
 * Respeta RN-NEG-06 (flujo lineal), RN-NEG-07 (entrega solo si está 'listo'
 * con código válido) y el registro de id_trabajador en HistorialEstadoPedido.
 */

import { APP_CONFIG, ESTADOS_PEDIDO } from "../config.js";
import { request } from "../api/httpClient.js";
import { cargarMockDB, guardarMockDB } from "../api/mockData.js";
import { esTransicionEstadoValida } from "../utils/validators.js";

/**
 * Lista todos los pedidos o los filtra por estado (HU-PER-04).
 *
 * @param {string} [estado=""] - Estado opcional (pendiente, en preparación, listo, entregado).
 * @returns {Promise<Array<Object>>} Lista de pedidos ordenados del más reciente al más antiguo.
 */
export async function listarPedidos(estado = "") {
  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const filtrados = estado
      ? db.pedidos.filter((p) => p.estado === estado)
      : [...db.pedidos];
    return filtrados.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
  }

  const query = estado ? `?estado=${encodeURIComponent(estado)}` : "";
  return request(`/pedidos${query}`);
}

/**
 * Obtiene un pedido completo junto con sus DetallePedido e HistorialEstadoPedido.
 *
 * @param {number|string} idPedido - Identificador del pedido.
 * @returns {Promise<Object>} Pedido con sus detalles e historial.
 */
export async function obtenerDetallePedido(idPedido) {
  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const pedido = db.pedidos.find((p) => Number(p.idPedido) === Number(idPedido));
    if (!pedido) {
      throw new Error("No se encontró el pedido solicitado.");
    }
    return pedido;
  }

  return request(`/pedidos/${encodeURIComponent(idPedido)}`);
}

/**
 * Busca un pedido a partir del código único de retiro presentado por el cliente (HU-PER-07).
 *
 * @param {string} codigoRetiro - Código de retiro (ej. "CAF-103C").
 * @returns {Promise<Object>} Pedido encontrado.
 */
export async function buscarPedidoPorCodigo(codigoRetiro) {
  const codigoLimpio = String(codigoRetiro || "").trim().toUpperCase();
  if (!codigoLimpio) {
    throw new Error("Debes ingresar un código de retiro.");
  }

  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const pedido = db.pedidos.find(
      (p) => p.codigoRetiro.toUpperCase() === codigoLimpio
    );
    if (!pedido) {
      throw new Error(`No existe ningún pedido con el código de retiro "${codigoLimpio}".`);
    }
    return pedido;
  }

  return request(`/pedidos/codigo/${encodeURIComponent(codigoLimpio)}`);
}

/**
 * Cambia el estado de un pedido validando el orden estricto de RN-NEG-06
 * (HU-PER-05: pendiente -> en preparación; HU-PER-06: en preparación -> listo).
 * Registra el evento en HistorialEstadoPedido con el idTrabajador responsable.
 *
 * @param {number|string} idPedido - ID del pedido.
 * @param {string} nuevoEstado - Estado destino.
 * @param {number} idTrabajador - ID del trabajador autenticado que ejecuta el cambio.
 * @param {string} [nombreTrabajador="Trabajador"] - Nombre visible (usado en modo mock).
 * @returns {Promise<Object>} Pedido actualizado.
 */
export async function cambiarEstadoPedido(idPedido, nuevoEstado, idTrabajador, nombreTrabajador = "Trabajador") {
  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const pedido = db.pedidos.find((p) => Number(p.idPedido) === Number(idPedido));
    if (!pedido) {
      throw new Error("El pedido no existe.");
    }

    if (!esTransicionEstadoValida(pedido.estado, nuevoEstado)) {
      throw new Error(
        `Transición no permitida: no se puede pasar de "${pedido.estado}" a "${nuevoEstado}".`
      );
    }

    pedido.estado = nuevoEstado;
    const siguienteIdHistorial =
      pedido.historial.reduce((max, item) => Math.max(max, item.idHistorial || 0), 0) + 1;

    // Registro obligatorio en HistorialEstadoPedido con idTrabajador NOT NULL
    pedido.historial.push({
      idHistorial: siguienteIdHistorial,
      idPedido: pedido.idPedido,
      idTrabajador,
      nombreTrabajador,
      estado: nuevoEstado,
      fechaCambio: new Date().toISOString()
    });

    guardarMockDB(db);
    return pedido;
  }

  return request(`/pedidos/${encodeURIComponent(idPedido)}/estado`, {
    method: "PATCH",
    body: { estado: nuevoEstado, idTrabajador }
  });
}

/**
 * Valida el código de retiro y marca el pedido como Entregado (HU-PER-07, RN-NEG-07).
 * Solo procede si el pedido existe y su estado actual es "listo".
 *
 * @param {string} codigoRetiro - Código presentado por el cliente.
 * @param {number} idTrabajador - ID del trabajador que realiza la entrega.
 * @param {string} [nombreTrabajador="Trabajador"] - Nombre visible (usado en modo mock).
 * @returns {Promise<Object>} Pedido marcado como entregado.
 */
export async function confirmarEntregaPorCodigo(codigoRetiro, idTrabajador, nombreTrabajador = "Trabajador") {
  const codigoLimpio = String(codigoRetiro || "").trim().toUpperCase();

  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const pedido = db.pedidos.find(
      (p) => p.codigoRetiro.toUpperCase() === codigoLimpio
    );

    if (!pedido) {
      throw new Error("El código de retiro ingresado no corresponde a ningún pedido.");
    }

    if (pedido.estado !== ESTADOS_PEDIDO.LISTO) {
      throw new Error(
        `No se puede entregar el pedido: su estado actual es "${pedido.estado}" y debe estar en "listo".`
      );
    }

    return cambiarEstadoPedido(
      pedido.idPedido,
      ESTADOS_PEDIDO.ENTREGADO,
      idTrabajador,
      nombreTrabajador
    );
  }

  return request("/pedidos/entregar", {
    method: "POST",
    body: { codigoRetiro: codigoLimpio, idTrabajador }
  });
}
