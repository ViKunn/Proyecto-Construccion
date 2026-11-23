/**
 * Archivo: login.js
 * Propósito: Controlar la pantalla de inicio de sesión (index.html) contra
 * POST /api/auth/login y restaurar sesión existente con GET /api/auth/me.
 */

import { ROLES } from "../config.js";
import { iniciarSesion, obtenerSesionActual } from "../services/authService.js";
import { esCorreoValido } from "../utils/validators.js";

/**
 * Redirige automáticamente según el tipo de usuario autenticado en el servidor.
 *
 * @param {Object} sesion - Objeto de sesión normalizado.
 */
function redirigirPorRol(sesion) {
  if (sesion.tipo === ROLES.TRABAJADOR) {
    window.location.href = "panel-trabajador.html";
  } else if (sesion.tipo === ROLES.ADMINISTRADOR) {
    window.location.href = "panel-administrador.html";
  }
}

/**
 * Inicializa la verificación de sesión activa y los eventos del formulario de login.
 */
async function inicializarLogin() {
  // Si el navegador ya tiene una cookie CAFETERIA_SESION válida, se redirige directo
  try {
    const sesionActiva = await obtenerSesionActual();
    if (sesionActiva && (sesionActiva.tipo === ROLES.TRABAJADOR || sesionActiva.tipo === ROLES.ADMINISTRADOR)) {
      redirigirPorRol(sesionActiva);
      return;
    }
  } catch {
    // Si el servidor aún no responde o no hay sesión, se mantiene en el formulario
  }

  const formulario = document.getElementById("form-login");
  const cajaError = document.getElementById("login-error");
  const botonIngresar = document.getElementById("btn-ingresar");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    cajaError.classList.add("hidden");
    cajaError.textContent = "";

    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value;

    if (!esCorreoValido(correo)) {
      cajaError.textContent = "Por favor, ingresa un correo electrónico válido.";
      cajaError.classList.remove("hidden");
      return;
    }

    if (!contrasena) {
      cajaError.textContent = "Por favor, ingresa tu contraseña.";
      cajaError.classList.remove("hidden");
      return;
    }

    botonIngresar.disabled = true;
    botonIngresar.textContent = "Verificando...";

    try {
      const sesion = await iniciarSesion(correo, contrasena);
      redirigirPorRol(sesion);
    } catch (error) {
      cajaError.textContent = error.message || "No se pudo iniciar sesión.";
      cajaError.classList.remove("hidden");
    } finally {
      botonIngresar.disabled = false;
      botonIngresar.textContent = "Iniciar sesión";
    }
  });
}

document.addEventListener("DOMContentLoaded", inicializarLogin);
