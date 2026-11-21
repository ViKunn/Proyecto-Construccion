/**
 * Archivo: ui.js
 * Propósito: Utilidades reutilizables para la interfaz de usuario:
 * formateo de moneda y fechas, escape seguro de texto (prevención de XSS)
 * y renderizado de mensajes/alertas visuales.
 */

import { ESTADOS_PEDIDO, ETIQUETAS_ESTADO } from "../config.js";

/**
 * Escapa caracteres HTML especiales para insertar texto de forma segura en plantillas.
 *
 * @param {string|number|null|undefined} valor - Texto a escapar.
 * @returns {string} Cadena segura para mostrar en HTML.
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
 * Formatea un número como importe monetario en dólares estadounidenses (USD).
 *
 * @param {number|string} monto - Valor numérico del precio o total.
 * @returns {string} Importe formateado (ej. "$2.50").
 */
export function formatearMoneda(monto) {
  const numero = Number(monto);
  if (Number.isNaN(numero)) {
    return "$0.00";
  }
  return `$${numero.toFixed(2)}`;
}

/**
 * Convierte una fecha ISO a un formato legible en español.
 *
 * @param {string} fechaIso - Cadena de fecha ISO (ej. "2026-11-21T09:15:00").
 * @returns {string} Fecha y hora formateadas para el usuario.
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
 * Devuelve la clase CSS y etiqueta correspondiente a un estado de pedido.
 *
 * @param {string} estado - Estado del pedido (pendiente, en preparación, listo, entregado).
 * @returns {string} HTML del badge visual de estado.
 */
export function crearBadgeEstado(estado) {
  const clases = {
    [ESTADOS_PEDIDO.PENDIENTE]: "badge-pendiente",
    [ESTADOS_PEDIDO.EN_PREPARACION]: "badge-preparacion",
    [ESTADOS_PEDIDO.LISTO]: "badge-listo",
    [ESTADOS_PEDIDO.ENTREGADO]: "badge-entregado"
  };

  const clase = clases[estado] || "badge-neutral";
  const etiqueta = ETIQUETAS_ESTADO[estado] || estado;
  return `<span class="badge ${clase}">${escaparHtml(etiqueta)}</span>`;
}

/**
 * Muestra una alerta temporal dentro del contenedor de notificaciones (#toast-container).
 *
 * @param {string} mensaje - Texto informativo a mostrar al usuario.
 * @param {"exito"|"error"|"aviso"|"info"} [tipo="info"] - Estilo visual de la alerta.
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

  // Se elimina automáticamente después de 4 segundos para no saturar la pantalla
  setTimeout(() => {
    toast.classList.add("toast-oculto");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
