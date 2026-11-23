/**
 * Archivo: authService.js
 * Propósito: Gestionar la autenticación contra el backend Spring Boot
 * usando la cookie de sesión HttpOnly CAFETERIA_SESION:
 * - POST /api/auth/login
 * - GET  /api/auth/me
 * - POST /api/auth/logout
 */

import { ROLES } from "../config.js";
import { request } from "../api/httpClient.js";

/**
 * Normaliza el objeto de sesión devuelto por el servidor para manejar
 * el tipo de usuario siempre en minúsculas (cliente, trabajador, administrador).
 *
 * @param {Object} dto - { tipo, nombre, apellido, correo }.
 * @returns {Object} Sesión normalizada.
 */
function normalizarSesion(dto) {
  const tipo = String(dto?.tipo || "").toLowerCase();
  const nombreCompleto = [dto?.nombre, dto?.apellido].filter(Boolean).join(" ").trim();
  return {
    tipo,
    nombre: dto?.nombre || null,
    apellido: dto?.apellido || null,
    nombreCompleto: nombreCompleto || (tipo === ROLES.ADMINISTRADOR ? "Administrador" : dto?.correo || "Usuario"),
    correo: dto?.correo || ""
  };
}

/**
 * Inicia sesión contra el backend Spring Boot.
 * Si la cuenta pertenece a un cliente, cierra esa sesión y bloquea el acceso al portal admin.
 *
 * @param {string} correo - Correo registrado.
 * @param {string} contrasena - Contraseña en texto plano (validada con BCrypt en el servidor).
 * @returns {Promise<Object>} Datos de la sesión autenticada.
 */
export async function iniciarSesion(correo, contrasena) {
  const respuesta = await request("/auth/login", {
    method: "POST",
    body: {
      correo: String(correo || "").trim().toLowerCase(),
      contrasena
    }
  });

  const sesion = normalizarSesion(respuesta);

  if (sesion.tipo === ROLES.CLIENTE) {
    await request("/auth/logout", { method: "POST" }).catch(() => { });
    throw new Error("Esta cuenta corresponde a un cliente. Usa el portal de clientes.");
  }

  return sesion;
}

/**
 * Consulta GET /api/auth/me para restaurar la sesión activa en el servidor.
 *
 * @returns {Promise<Object|null>} Sesión actual o null si no hay sesión iniciada (401).
 */
export async function obtenerSesionActual() {
  try {
    const dto = await request("/auth/me");
    return normalizarSesion(dto);
  } catch (error) {
    if (error.status === 401) {
      return null;
    }
    throw error;
  }
}

/**
 * Cierra la sesión en el servidor (invalida la cookie CAFETERIA_SESION) y redirige al login.
 */
export async function cerrarSesion() {
  try {
    await request("/auth/logout", { method: "POST" });
  } finally {
    window.location.href = "index.html";
  }
}

/**
 * Verifica contra el servidor que exista una sesión activa con el rol requerido.
 * Si no hay sesión o el rol no coincide, redirige automáticamente a index.html.
 *
 * @param {string} rolRequerido - ROLES.TRABAJADOR o ROLES.ADMINISTRADOR.
 * @returns {Promise<Object|null>} Sesión válida o null si redirigió.
 */
export async function requerirRol(rolRequerido) {
  const sesion = await obtenerSesionActual();
  if (!sesion || sesion.tipo !== rolRequerido) {
    window.location.href = "index.html";
    return null;
  }
  return sesion;
}
