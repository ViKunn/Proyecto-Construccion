/**
 * Archivo: authService.js
 * Propósito: Gestionar el inicio y cierre de sesión para los roles
 * Trabajador y Administrador, así como el almacenamiento de la sesión
 * en sessionStorage y la protección de acceso a cada pantalla.
 */

import { APP_CONFIG, ROLES } from "../config.js";
import { request } from "../api/httpClient.js";
import { cargarMockDB } from "../api/mockData.js";

/**
 * Autentica un usuario administrativo (trabajador o administrador).
 * Rechaza cuentas con tipo_usuario = "cliente" porque tienen su propio portal.
 *
 * @param {string} correo - Correo electrónico registrado en Usuario.
 * @param {string} contrasena - Contraseña de la cuenta.
 * @returns {Promise<Object>} Datos de la sesión autenticada.
 */
export async function iniciarSesion(correo, contrasena) {
  const correoLimpio = String(correo || "").trim().toLowerCase();

  let sesion;
  if (APP_CONFIG.USE_MOCK) {
    // Modo simulado: consulta la lista de usuarios y trabajadores en localStorage
    const db = cargarMockDB();
    const usuario = db.usuarios.find(
      (u) => u.correo.toLowerCase() === correoLimpio && u.contrasena === contrasena
    );

    if (!usuario) {
      throw new Error("Correo o contraseña incorrectos.");
    }

    if (usuario.tipoUsuario === ROLES.CLIENTE) {
      throw new Error("Esta cuenta corresponde a un cliente. Usa el portal de clientes.");
    }

    // Si es trabajador, se recupera su idTrabajador para auditar cambios de estado
    const trabajador = db.trabajadores.find((t) => t.idUsuario === usuario.idUsuario);

    sesion = {
      idUsuario: usuario.idUsuario,
      correo: usuario.correo,
      tipoUsuario: usuario.tipoUsuario,
      idTrabajador: trabajador ? trabajador.idTrabajador : null,
      nombre: trabajador ? `${trabajador.nombre} ${trabajador.apellido}` : "Administrador"
    };
  } else {
    // Modo backend real: llama al controlador AuthControlador de Spring Boot
    sesion = await request("/auth/login", {
      method: "POST",
      body: { correo: correoLimpio, contrasena }
    });

    if (sesion.tipoUsuario === ROLES.CLIENTE) {
      throw new Error("Acceso denegado: esta sección es exclusiva para personal y administradores.");
    }
  }

  sessionStorage.setItem(APP_CONFIG.SESSION_STORAGE_KEY, JSON.stringify(sesion));
  return sesion;
}

/**
 * Obtiene la sesión actualmente activa desde sessionStorage.
 *
 * @returns {Object|null} Objeto de sesión o null si no existe.
 */
export function obtenerSesion() {
  const raw = sessionStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Cierra la sesión actual y redirige a la pantalla de inicio de sesión.
 */
export function cerrarSesion() {
  sessionStorage.removeItem(APP_CONFIG.SESSION_STORAGE_KEY);
  window.location.href = "index.html";
}

/**
 * Verifica que el usuario autenticado tenga el rol requerido para ver la página actual.
 * Si no cumple, redirige automáticamente a index.html.
 *
 * @param {string} rolRequerido - Rol esperado (ROLES.TRABAJADOR o ROLES.ADMINISTRADOR).
 * @returns {Object|null} Sesión válida o null si se redirigió.
 */
export function requerirRol(rolRequerido) {
  const sesion = obtenerSesion();
  if (!sesion || sesion.tipoUsuario !== rolRequerido) {
    window.location.href = "index.html";
    return null;
  }
  return sesion;
}
