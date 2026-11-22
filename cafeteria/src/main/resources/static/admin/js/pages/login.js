/**
 * Archivo: login.js
 * Propósito: Controlar la pantalla de inicio de sesión (index.html).
 * Valida las credenciales ingresadas, llama a authService.iniciarSesion()
 * y redirige al panel correspondiente según el rol (trabajador o administrador).
 */

import { APP_CONFIG, ROLES } from "../config.js";
import { iniciarSesion, obtenerSesion } from "../services/authService.js";
import { esCorreoValido } from "../utils/validators.js";

/**
 * Redirige automáticamente si ya existe una sesión activa válida.
 *
 * @param {Object} sesion - Sesión almacenada en sessionStorage.
 */
function redirigirPorRol(sesion) {
  if (sesion.tipoUsuario === ROLES.TRABAJADOR) {
    window.location.href = "panel-trabajador.html";
  } else if (sesion.tipoUsuario === ROLES.ADMINISTRADOR) {
    window.location.href = "panel-administrador.html";
  }
}

/**
 * Inicializa eventos de la pantalla de login cuando el DOM está listo.
 */
function inicializarLogin() {
  // Si el usuario ya inició sesión previamente, se le envía directo a su panel
  const sesionActiva = obtenerSesion();
  if (sesionActiva) {
    redirigirPorRol(sesionActiva);
    return;
  }

  // Muestra credenciales de prueba solo cuando USE_MOCK está activado en config.js
  const cajaMock = document.getElementById("mock-credentials");
  if (APP_CONFIG.USE_MOCK && cajaMock) {
    cajaMock.classList.remove("hidden");
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

    // Validación básica en el navegador antes de enviar la solicitud
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
