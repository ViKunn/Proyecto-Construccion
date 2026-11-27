/**
 * Archivo: trabajadorService.js
 * Propósito: Conectar la gestión de cuentas de trabajadores (rol Administrador)
 * con los endpoints reales de TrabajadorControlador:
 * - GET  /api/trabajadores
 * - POST /api/trabajadores
 */

import { request } from "../api/httpClient.js";

/**
 * Obtiene la lista de todos los trabajadores registrados, ordenados por apellido y nombre.
 *
 * @returns {Promise<Array<Object>>} Lista de trabajadores.
 */
export async function listarTrabajadores() {
  return request("/trabajadores");
}

/**
 * Registra una nueva cuenta de trabajador (Usuario + Trabajador en una transacción).
 *
 * @param {Object} datos - { nombre, apellido, cedula, correo, contrasena }.
 * @returns {Promise<Object>} Trabajador creado.
 */
export async function crearTrabajador(datos) {
  return request("/trabajadores", {
    method: "POST",
    body: {
      nombre: String(datos.nombre).trim(),
      apellido: String(datos.apellido).trim(),
      cedula: String(datos.cedula).trim(),
      correo: String(datos.correo).trim().toLowerCase(),
      contrasena: datos.contrasena
    }
  });
}
