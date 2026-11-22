/**
 * Archivo: administrador.js
 * Propósito: Controlar la pantalla panel-administrador.html.
 * Implementa las funciones exclusivas del Administrador del sistema:
 * 1. Ver lista de trabajadores (con búsqueda).
 * 2. Crear cuentas de trabajadores (Usuario + Trabajador).
 * 3. Actualizar la contraseña de su propia cuenta.
 */

import { ROLES } from "../config.js";
import { cerrarSesion, requerirRol } from "../services/authService.js";
import {
  actualizarContrasenaAdmin,
  crearTrabajador,
  listarTrabajadores
} from "../services/trabajadorService.js";
import { escaparHtml, mostrarToast } from "../utils/ui.js";
import { validarCambioContrasena, validarNuevoTrabajador } from "../utils/validators.js";

// Estado en memoria para filtrar sin consultar repetidamente al servidor
let trabajadoresCache = [];
let sesionActual = null;

/**
 * Renderiza la tabla de trabajadores aplicando el texto de búsqueda actual.
 */
function renderizarTablaTrabajadores() {
  const tbody = document.getElementById("tabla-trabajadores-body");
  const filtro = document.getElementById("buscar-trabajador").value.trim().toLowerCase();

  const filtrados = trabajadoresCache.filter((t) => {
    const texto = `${t.nombre} ${t.apellido} ${t.cedula} ${t.correo}`.toLowerCase();
    return texto.includes(filtro);
  });

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">No se encontraron trabajadores registrados.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtrados
    .map(
      (t) => `
        <tr>
          <td>#${escaparHtml(t.idTrabajador)}</td>
          <td>${escaparHtml(t.nombre)} ${escaparHtml(t.apellido)}</td>
          <td>${escaparHtml(t.cedula)}</td>
          <td>${escaparHtml(t.correo)}</td>
        </tr>
      `
    )
    .join("");
}

/**
 * Carga la lista actualizada de trabajadores desde el servicio/backend.
 */
async function cargarTrabajadores() {
  try {
    trabajadoresCache = await listarTrabajadores();
    renderizarTablaTrabajadores();
  } catch (error) {
    mostrarToast(error.message || "Error al cargar la lista de trabajadores.", "error");
  }
}

/**
 * Maneja el envío del formulario de creación de un nuevo trabajador.
 *
 * @param {SubmitEvent} evento - Evento submit del formulario.
 */
async function manejarCrearTrabajador(evento) {
  evento.preventDefault();

  const datos = {
    nombre: document.getElementById("trab-nombre").value.trim(),
    apellido: document.getElementById("trab-apellido").value.trim(),
    cedula: document.getElementById("trab-cedula").value.trim(),
    correo: document.getElementById("trab-correo").value.trim(),
    contrasena: document.getElementById("trab-contrasena").value,
    confirmarContrasena: document.getElementById("trab-confirmar").value
  };

  const errorValidacion = validarNuevoTrabajador(datos);
  if (errorValidacion) {
    mostrarToast(errorValidacion, "aviso");
    return;
  }

  try {
    await crearTrabajador(datos);
    mostrarToast("Cuenta de trabajador creada correctamente.", "exito");
    evento.target.reset();
    await cargarTrabajadores();
  } catch (error) {
    mostrarToast(error.message || "No se pudo crear el trabajador.", "error");
  }
}

/**
 * Maneja el envío del formulario de actualización de contraseña del administrador.
 *
 * @param {SubmitEvent} evento - Evento submit del formulario.
 */
async function manejarCambioContrasena(evento) {
  evento.preventDefault();

  const datos = {
    contrasenaActual: document.getElementById("clave-actual").value,
    nuevaContrasena: document.getElementById("clave-nueva").value,
    confirmarContrasena: document.getElementById("clave-confirmar").value
  };

  const errorValidacion = validarCambioContrasena(datos);
  if (errorValidacion) {
    mostrarToast(errorValidacion, "aviso");
    return;
  }

  try {
    const respuesta = await actualizarContrasenaAdmin(
      sesionActual.idUsuario,
      datos.contrasenaActual,
      datos.nuevaContrasena
    );
    mostrarToast(respuesta.mensaje || "Contraseña actualizada.", "exito");
    evento.target.reset();
  } catch (error) {
    mostrarToast(error.message || "No se pudo actualizar la contraseña.", "error");
  }
}

/**
 * Punto de entrada de la pantalla panel-administrador.html.
 */
function inicializarPanelAdministrador() {
  // Protege la página: solo permite acceso a usuarios con rol 'administrador'
  sesionActual = requerirRol(ROLES.ADMINISTRADOR);
  if (!sesionActual) {
    return;
  }

  document.getElementById("admin-info").textContent = `Sesión: ${sesionActual.correo}`;
  document.getElementById("btn-cerrar-sesion").addEventListener("click", cerrarSesion);
  document.getElementById("form-crear-trabajador").addEventListener("submit", manejarCrearTrabajador);
  document.getElementById("form-cambiar-clave").addEventListener("submit", manejarCambioContrasena);
  document.getElementById("buscar-trabajador").addEventListener("input", renderizarTablaTrabajadores);
  document.getElementById("btn-recargar-trabajadores").addEventListener("click", cargarTrabajadores);

  cargarTrabajadores();
}

document.addEventListener("DOMContentLoaded", inicializarPanelAdministrador);
