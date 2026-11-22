/**
 * Archivo: validators.js
 * Propósito: Centralizar validaciones de formularios y reglas de negocio
 * del lado del cliente antes de enviar datos a los servicios/backend.
 */

import { DISPONIBILIDAD, ESTADOS_PEDIDO, TIPOS_PRODUCTO } from "../config.js";

/**
 * Valida que una cadena tenga formato básico de correo electrónico.
 *
 * @param {string} correo - Correo ingresado.
 * @returns {boolean} true si el formato es válido.
 */
export function esCorreoValido(correo) {
  const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return patron.test(String(correo || "").trim());
}

/**
 * Valida los datos de un producto antes de crearlo o actualizarlo (HU-PER-01, HU-PER-02).
 *
 * @param {Object} producto - Datos del producto a validar.
 * @param {boolean} [requerirCodigo=true] - Indica si codigoProducto es obligatorio.
 * @returns {string|null} Mensaje de error si hay fallo, o null si todo es válido.
 */
export function validarProducto(producto, requerirCodigo = true) {
  if (requerirCodigo && !String(producto.codigoProducto || "").trim()) {
    return "El código del producto es obligatorio.";
  }

  if (!String(producto.nombre || "").trim()) {
    return "El nombre del producto es obligatorio.";
  }

  const precio = Number(producto.precio);
  if (Number.isNaN(precio) || precio <= 0) {
    return "El precio debe ser un número mayor que 0.";
  }

  const tiposValidos = Object.values(TIPOS_PRODUCTO);
  if (!tiposValidos.includes(producto.tipoProducto)) {
    return "El tipo de producto debe ser alimento o bebida.";
  }

  const dispValidas = Object.values(DISPONIBILIDAD);
  if (!dispValidas.includes(producto.disponible)) {
    return "La disponibilidad debe ser 'si' o 'no'.";
  }

  return null;
}

/**
 * Verifica si una transición de estado de pedido cumple la regla RN-NEG-06:
 * pendiente -> en preparación -> listo -> entregado (sin saltos ni retrocesos).
 *
 * @param {string} estadoActual - Estado vigente del pedido.
 * @param {string} nuevoEstado - Estado al que se intenta pasar.
 * @returns {boolean} true si la transición es válida.
 */
export function esTransicionEstadoValida(estadoActual, nuevoEstado) {
  const transicionesPermitidas = {
    [ESTADOS_PEDIDO.PENDIENTE]: ESTADOS_PEDIDO.EN_PREPARACION,
    [ESTADOS_PEDIDO.EN_PREPARACION]: ESTADOS_PEDIDO.LISTO,
    [ESTADOS_PEDIDO.LISTO]: ESTADOS_PEDIDO.ENTREGADO
  };
  return transicionesPermitidas[estadoActual] === nuevoEstado;
}

/**
 * Valida los datos del formulario para crear una cuenta de trabajador.
 *
 * @param {Object} datos - Datos del nuevo trabajador.
 * @returns {string|null} Mensaje de error o null si es válido.
 */
export function validarNuevoTrabajador(datos) {
  if (!String(datos.nombre || "").trim() || !String(datos.apellido || "").trim()) {
    return "El nombre y el apellido son obligatorios.";
  }

  const cedula = String(datos.cedula || "").trim();
  if (!/^\d{10}$/.test(cedula)) {
    return "La cédula debe contener exactamente 10 dígitos numéricos.";
  }

  if (!esCorreoValido(datos.correo)) {
    return "Ingresa un correo electrónico válido.";
  }

  if (!datos.contrasena || datos.contrasena.length < 6) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }

  if (datos.contrasena !== datos.confirmarContrasena) {
    return "Las contraseñas no coinciden.";
  }

  return null;
}

/**
 * Valida el formulario de actualización de contraseña del administrador.
 *
 * @param {Object} datos - Objeto con contrasenaActual, nuevaContrasena y confirmarContrasena.
 * @returns {string|null} Mensaje de error o null si es válido.
 */
export function validarCambioContrasena(datos) {
  if (!String(datos.contrasenaActual || "").trim()) {
    return "Debes ingresar tu contraseña actual.";
  }

  if (!datos.nuevaContrasena || datos.nuevaContrasena.length < 6) {
    return "La nueva contraseña debe tener al menos 6 caracteres.";
  }

  if (datos.nuevaContrasena !== datos.confirmarContrasena) {
    return "La confirmación de la nueva contraseña no coincide.";
  }

  if (datos.contrasenaActual === datos.nuevaContrasena) {
    return "La nueva contraseña debe ser diferente a la actual.";
  }

  return null;
}
