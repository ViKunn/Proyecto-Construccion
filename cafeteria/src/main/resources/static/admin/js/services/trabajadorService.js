/**
 * Archivo: trabajadorService.js
 * Propósito: Proveer las operaciones exclusivas del rol Administrador del sistema:
 * - Consultar la lista de trabajadores registrados.
 * - Crear nuevas cuentas de trabajadores (entidades Usuario + Trabajador).
 * - Actualizar la contraseña de la cuenta del administrador.
 */

import { APP_CONFIG, ROLES } from "../config.js";
import { request } from "../api/httpClient.js";
import { cargarMockDB, guardarMockDB } from "../api/mockData.js";

/**
 * Obtiene el listado completo de trabajadores registrados.
 *
 * @returns {Promise<Array<Object>>} Arreglo de trabajadores.
 */
export async function listarTrabajadores() {
  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    return [...db.trabajadores];
  }

  return request("/trabajadores");
}

/**
 * Crea una nueva cuenta de trabajador (Usuario con tipo_usuario='trabajador' + Trabajador).
 *
 * @param {Object} datos - { nombre, apellido, cedula, correo, contrasena }.
 * @returns {Promise<Object>} Trabajador creado.
 */
export async function crearTrabajador(datos) {
  const payload = {
    nombre: String(datos.nombre).trim(),
    apellido: String(datos.apellido).trim(),
    cedula: String(datos.cedula).trim(),
    correo: String(datos.correo).trim().toLowerCase(),
    contrasena: datos.contrasena
  };

  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();

    const correoExiste = db.usuarios.some(
      (u) => u.correo.toLowerCase() === payload.correo
    );
    if (correoExiste) {
      throw new Error("Ya existe una cuenta registrada con ese correo electrónico.");
    }

    const cedulaExiste = db.trabajadores.some((t) => t.cedula === payload.cedula);
    if (cedulaExiste) {
      throw new Error("Ya existe un trabajador registrado con esa cédula.");
    }

    // Se generan identificadores incrementales simulando las secuencias de PostgreSQL
    const nuevoIdUsuario =
      db.usuarios.reduce((max, u) => Math.max(max, u.idUsuario), 0) + 1;
    const nuevoIdTrabajador =
      db.trabajadores.reduce((max, t) => Math.max(max, t.idTrabajador), 0) + 1;

    db.usuarios.push({
      idUsuario: nuevoIdUsuario,
      correo: payload.correo,
      contrasena: payload.contrasena,
      tipoUsuario: ROLES.TRABAJADOR
    });

    const nuevoTrabajador = {
      idTrabajador: nuevoIdTrabajador,
      idUsuario: nuevoIdUsuario,
      nombre: payload.nombre,
      apellido: payload.apellido,
      cedula: payload.cedula,
      correo: payload.correo
    };

    db.trabajadores.push(nuevoTrabajador);
    guardarMockDB(db);
    return nuevoTrabajador;
  }

  return request("/trabajadores", {
    method: "POST",
    body: payload
  });
}

/**
 * Actualiza la contraseña de la cuenta del administrador autenticado.
 *
 * @param {number} idUsuario - ID de Usuario del administrador.
 * @param {string} contrasenaActual - Contraseña actual para verificación.
 * @param {string} nuevaContrasena - Nueva contraseña deseada.
 * @returns {Promise<Object>} Mensaje de confirmación.
 */
export async function actualizarContrasenaAdmin(idUsuario, contrasenaActual, nuevaContrasena) {
  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const admin = db.usuarios.find(
      (u) => Number(u.idUsuario) === Number(idUsuario) && u.tipoUsuario === ROLES.ADMINISTRADOR
    );

    if (!admin) {
      throw new Error("No se encontró la cuenta del administrador.");
    }

    if (admin.contrasena !== contrasenaActual) {
      throw new Error("La contraseña actual ingresada es incorrecta.");
    }

    admin.contrasena = nuevaContrasena;
    guardarMockDB(db);
    return { mensaje: "Contraseña actualizada correctamente." };
  }

  return request("/admin/password", {
    method: "PATCH",
    body: { idUsuario, contrasenaActual, nuevaContrasena }
  });
}
