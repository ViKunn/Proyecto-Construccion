/**
 * Archivo: ui.js
 * Propósito: Utilidades reutilizables para renderizado seguro (escape contra XSS),
 * formato de moneda/fechas, badges de estado y notificaciones toast.
 */

import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO } from "../config.js";

/**
 * Escapa caracteres HTML especiales para prevenir inyección de HTML/XSS.
 *
 * @param {string|number|null|undefined} valor - Texto a escapar.
 * @returns {string} Texto seguro para insertar en plantillas HTML.
 */
export function escaparHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Formatea un valor numérico como importe monetario USD con 2 decimales.
 *
 * @param {number|string} monto - Importe numérico.
 * @returns {string} Ejemplo: "$7.25".
 */
export function formatearMoneda(monto) {
  const numero = Number(monto);
  if (Number.isNaN(numero)) {
    return "$0.00";
  }
  return `$${numero.toFixed(2)}`;
}

/**
 * Formatea una fecha ISO 8601 UTC a hora local legible en español.
 *
 * @param {string} fechaIso - Fecha ISO devuelta por el backend.
 * @returns {string} Fecha y hora formateadas.
 */
export function formatearFecha(fechaIso) {
  if (!fechaIso) {
    return "—";
  }
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) {
    return fechaIso;
  }
  return fecha.toLocaleString("es-EC", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Genera el badge HTML correspondiente a un estado de pedido del backend.
 *
 * @param {string} estado - pendiente, en_preparacion, listo o entregado.
 * @returns {string} Marcado HTML del badge.
 */
export function crearBadgeEstado(estado) {
  const clases = {
    [ESTADOS_PEDIDO.PENDIENTE]: "badge-pendiente",
    [ESTADOS_PEDIDO.EN_PREPARACION]: "badge-preparacion",
    [ESTADOS_PEDIDO.LISTO]: "badge-listo",
    [ESTADOS_PEDIDO.ENTREGADO]: "badge-entregado"
  };

  const clase = clases[estado] || "badge-entregado";
  const etiqueta = ETIQUETAS_ESTADO[estado] || estado;
  return `<span class="badge ${clase}">${escaparHtml(etiqueta)}</span>`;
}

/**
 * Muestra una notificación temporal (toast) en la esquina inferior derecha.
 *
 * @param {string} mensaje - Mensaje a mostrar.
 * @param {"exito"|"error"|"aviso"|"info"} [tipo="info"] - Tipo visual.
 */
export function mostrarToast(mensaje, tipo = "info") {
  let contenedor = document.getElementById("toast-container");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "toast-container";
    contenedor.className = "toast-container";
    document.body.appendChild(contenedor);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  contenedor.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-oculto");
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
