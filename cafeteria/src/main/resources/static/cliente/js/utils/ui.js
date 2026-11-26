/**
 * Archivo: ui.js
 * Propósito: Utilidades de interfaz del portal del cliente: escape contra XSS,
 * formato de moneda y fecha, badge de estado, notificaciones y diálogos.
 */

import { ETIQUETAS_ESTADO } from "../config.js";

/**
 * Escapa caracteres HTML especiales antes de insertarlos en una plantilla.
 *
 * @param {string|number|null|undefined} valor - Texto a escapar.
 * @returns {string} Texto seguro.
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
 * Formatea un importe en dólares con 2 decimales.
 *
 * @param {number|string} monto - Importe.
 * @returns {string} Ejemplo: "$4.75".
 */
export function formatearMoneda(monto) {
  const numero = Number(monto);
  return Number.isNaN(numero) ? "$0.00" : `$${numero.toFixed(2)}`;
}

/**
 * Convierte una fecha ISO del backend a fecha y hora local.
 *
 * @param {string} fechaIso - Fecha ISO 8601.
 * @returns {string} Fecha legible.
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
 * Genera el badge de un estado de pedido.
 *
 * @param {string} estado - pendiente, en_preparacion, listo o entregado.
 * @returns {string} Marcado HTML.
 */
export function crearBadgeEstado(estado) {
  const etiqueta = ETIQUETAS_ESTADO[estado] || estado;
  return `<span class="badge badge-${escaparHtml(estado)}">${escaparHtml(etiqueta)}</span>`;
}

/**
 * Muestra una notificación temporal.
 *
 * @param {string} mensaje - Texto a mostrar.
 * @param {"exito"|"error"|"aviso"|"info"} [tipo="info"] - Estilo visual.
 */
export function mostrarToast(mensaje, tipo = "info") {
  let contenedor = document.getElementById("toast-container");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "toast-container";
    contenedor.className = "toast-container";
    contenedor.setAttribute("role", "status");
    contenedor.setAttribute("aria-live", "polite");
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

/**
 * Muestra un mensaje en una caja de alerta del formulario.
 *
 * @param {HTMLElement} caja - Elemento contenedor del mensaje.
 * @param {string} mensaje - Texto; vacío para ocultar la caja.
 */
export function mostrarMensajeFormulario(caja, mensaje) {
  caja.textContent = mensaje || "";
  caja.classList.toggle("oculto", !mensaje);
}

/**
 * Abre un diálogo modal (<dialog>) y enfoca su primer campo.
 *
 * @param {HTMLDialogElement} dialogo - Diálogo a abrir.
 */
export function abrirDialogo(dialogo) {
  if (!dialogo.open) {
    dialogo.showModal();
  }
  const primerCampo = dialogo.querySelector("input, button");
  if (primerCampo) {
    primerCampo.focus();
  }
}
