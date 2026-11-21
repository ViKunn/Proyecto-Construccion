/**
 * Archivo: httpClient.js
 * Propósito: Proveer un cliente HTTP centralizado basado en fetch() para
 * comunicarse con los endpoints REST del backend Spring Boot.
 * Maneja automáticamente encabezados JSON, lectura de respuestas y errores HTTP.
 */

import { APP_CONFIG } from "../config.js";

/**
 * Ejecuta una petición HTTP hacia el backend Spring Boot.
 *
 * @param {string} endpoint - Ruta relativa del recurso (ej. "/productos").
 * @param {Object} [opciones={}] - Configuración opcional (method, body, headers).
 * @returns {Promise<any>} Datos JSON devueltos por el servidor (o null si 204 No Content).
 * @throws {Error} Lanza un error con el mensaje del servidor si la respuesta no es 2xx.
 */
export async function request(endpoint, opciones = {}) {
  const url = `${APP_CONFIG.API_BASE_URL}${endpoint}`;

  // Se preparan las cabeceras estándar para comunicación JSON
  const headers = {
    "Content-Type": "application/json",
    ...(opciones.headers || {})
  };

  // Si existe un token en sesión, se adjunta automáticamente en Authorization
  const sesionRaw = sessionStorage.getItem(APP_CONFIG.SESSION_STORAGE_KEY);
  if (sesionRaw) {
    try {
      const sesion = JSON.parse(sesionRaw);
      if (sesion?.token) {
        headers.Authorization = `Bearer ${sesion.token}`;
      }
    } catch {
      // Si la sesión está corrupta, se ignora el encabezado de autorización
    }
  }

  const configFetch = {
    method: opciones.method || "GET",
    headers
  };

  // Solo se serializa el cuerpo cuando se envía información (POST, PUT, PATCH)
  if (opciones.body !== undefined) {
    configFetch.body = JSON.stringify(opciones.body);
  }

  let respuesta;
  try {
    respuesta = await fetch(url, configFetch);
  } catch {
    throw new Error("No se pudo conectar con el servidor backend. Verifica que Spring Boot esté en ejecución.");
  }

  // Si el servidor responde 204 (sin contenido), se retorna null
  if (respuesta.status === 204) {
    return null;
  }

  // Se intenta interpretar el cuerpo como JSON; si no es JSON, se lee como texto
  const tipoContenido = respuesta.headers.get("content-type") || "";
  const datos = tipoContenido.includes("application/json")
    ? await respuesta.json()
    : await respuesta.text();

  // Si el código HTTP indica error (4xx o 5xx), se propaga el mensaje claro
  if (!respuesta.ok) {
    const mensajeError =
      (typeof datos === "object" && (datos.mensaje || datos.message || datos.error)) ||
      (typeof datos === "string" && datos) ||
      `Error HTTP ${respuesta.status}`;
    throw new Error(mensajeError);
  }

  return datos;
}
