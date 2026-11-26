/**
 * Archivo: authService.js
 * Propósito: Sesión del cliente contra el backend (cookie HttpOnly CAFETERIA_SESION):
 * - POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
 * - POST /api/clientes/registro (HU-CLI-07)
 * - PUT  /api/auth/contrasena (HU-USU-01)
 */

import { ROLES } from "../config.js";
import { request } from "../api/httpClient.js";

/**
 * @param {Object} dto - { tipo, nombre, apellido, correo } devuelto por el servidor.
 * @returns {Object} Sesión con el tipo en minúsculas y nombre completo.
 */
function normalizarSesion(dto) {
  const tipo = String(dto?.tipo || "").toLowerCase();
  const nombreCompleto = [dto?.nombre, dto?.apellido].filter(Boolean).join(" ").trim();
  return {
    tipo,
    nombre: dto?.nombre || "",
    nombreCompleto: nombreCompleto || dto?.correo || "Cliente",
    correo: dto?.correo || ""
  };
}

/**
 * Inicia sesión. Solo se aceptan cuentas de cliente en este portal;
 * el personal se redirige a su propio portal.
 *
 * @param {string} correo - Correo registrado.
 * @param {string} contrasena - Contraseña.
 * @returns {Promise<Object>} Sesión del cliente.
 */
export async function iniciarSesion(correo, contrasena) {
  const dto = await request("/auth/login", {
    method: "POST",
    body: { correo: String(correo || "").trim().toLowerCase(), contrasena }
  });
  const sesion = normalizarSesion(dto);
  if (sesion.tipo !== ROLES.CLIENTE) {
    await request("/auth/logout", { method: "POST" }).catch(() => { });
    const error = new Error("Esta cuenta pertenece al personal de la cafetería. Usa el portal del personal.");
    error.esPersonal = true;
    throw error;
  }
  return sesion;
}

/**
 * Registra un cliente nuevo (POST /api/clientes/registro).
 *
 * @param {Object} datos - { nombre, apellido, cedula, celular, correo, contrasena }.
 * @returns {Promise<Object>} { nombre, apellido, correo } del cliente creado.
 */
export function registrarCliente(datos) {
  return request("/clientes/registro", {
    method: "POST",
    body: {
      nombre: datos.nombre.trim(),
      apellido: datos.apellido.trim(),
      cedula: datos.cedula.trim(),
      celular: datos.celular.trim(),
      correo: datos.correo.trim().toLowerCase(),
      contrasena: datos.contrasena
    }
  });
}

/**
 * @returns {Promise<Object|null>} Sesión activa o null si no hay sesión (401).
 */
export async function obtenerSesionActual() {
  try {
    return normalizarSesion(await request("/auth/me"));
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

/**
 * Exige una sesión de cliente; si no existe, redirige a la pantalla de acceso.
 *
 * @returns {Promise<Object|null>} Sesión del cliente o null si redirigió.
 */
export async function requerirCliente() {
  const sesion = await obtenerSesionActual();
  if (!sesion || sesion.tipo !== ROLES.CLIENTE) {
    window.location.href = "index.html";
    return null;
  }
  return sesion;
}

/** Cierra la sesión y vuelve a la pantalla de acceso. */
export async function cerrarSesion() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "index.html";
  }
}

/**
 * Cambia la contraseña del cliente autenticado (204 si se cambió).
 *
 * @param {string} contrasenaActual - Contraseña vigente.
 * @param {string} contrasenaNueva - Nueva contraseña.
 * @returns {Promise<null>} null cuando el servidor responde 204.
 */
export function cambiarContrasena(contrasenaActual, contrasenaNueva) {
  return request("/auth/contrasena", {
    method: "PUT",
    body: { contrasenaActual, contrasenaNueva }
  });
}
