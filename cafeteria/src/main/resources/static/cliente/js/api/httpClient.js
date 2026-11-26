/**
 * Archivo: httpClient.js
 * Propósito: Cliente HTTP centralizado basado en fetch() para comunicarse con
 * los controladores REST de Spring Boot.
 * - Incluye siempre credentials: "include" para enviar la cookie CAFETERIA_SESION.
 * - Soporta tanto peticiones JSON como FormData (multipart/form-data para imágenes).
 * - Interpreta el formato unificado de errores del backend ({ mensaje, errores }).
 */

import { APP_CONFIG } from "../config.js";

/**
 * Construye un mensaje legible a partir de una respuesta de error del backend.
 *
 * @param {any} datos - Cuerpo parseado de la respuesta de error.
 * @param {number} status - Código HTTP recibido.
 * @returns {string} Mensaje claro para mostrar al usuario.
 */
function construirMensajeError(datos, status) {
  if (datos && typeof datos === "object") {
    // Si el backend devuelve mapa de errores por campo (400 / 409), se detallan todos
    if (datos.errores && typeof datos.errores === "object") {
      const detalles = Object.values(datos.errores).filter(Boolean);
      if (detalles.length > 0) {
        return detalles.join(" | ");
      }
    }
    if (datos.mensaje) {
      return datos.mensaje;
    }
    if (datos.message) {
      return datos.message;
    }
  }

  if (typeof datos === "string" && datos.trim()) {
    return datos.trim();
  }

  if (status === 401) {
    return "Tu sesión ha expirado o no has iniciado sesión.";
  }
  if (status === 403) {
    return "No tienes permisos para realizar esta acción.";
  }
  if (status === 413) {
    return "La imagen supera el tamaño máximo permitido de 2 MB.";
  }

  return `Error HTTP ${status}`;
}

/**
 * Ejecuta una petición HTTP hacia el backend Spring Boot.
 *
 * @param {string} endpoint - Ruta relativa bajo /api (ej. "/productos").
 * @param {Object} [opciones={}] - Configuración opcional (method, body, headers).
 * @returns {Promise<any>} Datos JSON devueltos por el servidor o null si 204.
 * @throws {Error} Error enriquecido con .status y .errores si la respuesta no es 2xx.
 */
export async function request(endpoint, opciones = {}) {
  const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;
  const esFormData = opciones.body instanceof FormData;

  const headers = {
    ...(opciones.headers || {})
  };

  // En FormData el navegador genera automáticamente el Content-Type con boundary
  if (!esFormData && opciones.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const configFetch = {
    method: opciones.method || "GET",
    credentials: "include",
    headers
  };

  if (opciones.body !== undefined) {
    configFetch.body = esFormData ? opciones.body : JSON.stringify(opciones.body);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, configFetch);
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verifica que Spring Boot esté ejecutándose.");
  }

  if (respuesta.status === 204) {
    return null;
  }

  const tipoContenido = respuesta.headers.get("content-type") || "";
  const datos = tipoContenido.includes("application/json")
    ? await respuesta.json()
    : await respuesta.text();

  if (!respuesta.ok) {
    const error = new Error(construirMensajeError(datos, respuesta.status));
    error.status = respuesta.status;
    error.errores = datos && typeof datos === "object" ? datos.errores : null;
    throw error;
  }

  return datos;
}
