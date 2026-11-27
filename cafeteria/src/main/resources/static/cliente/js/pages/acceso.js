/**
 * Archivo: acceso.js
 * Propósito: Pantalla de acceso del cliente (cliente/index.html):
 * inicio de sesión (HU-USU-02) y registro de cuenta (HU-CLI-07).
 */

import { ROLES } from "../config.js";
import { iniciarSesion, obtenerSesionActual, registrarCliente } from "../services/authService.js";
import { mostrarMensajeFormulario } from "../utils/ui.js";
import { esCorreoValido, validarRegistro } from "../utils/validators.js";

const CAMPOS_REGISTRO = ["nombre", "apellido", "cedula", "celular", "correo", "contrasena", "confirmar"];

/**
 * Muestra la pestaña elegida (ingresar o registrarse).
 *
 * @param {"ingresar"|"registro"} pestana - Pestaña a mostrar.
 */
function mostrarPestana(pestana) {
  ["ingresar", "registro"].forEach((nombre) => {
    const activa = nombre === pestana;
    document.getElementById(`tab-${nombre}`).setAttribute("aria-selected", String(activa));
    document.getElementById(`panel-${nombre}`).classList.toggle("oculto", !activa);
  });
}

/**
 * Pinta los errores por campo debajo de cada input del registro.
 *
 * @param {Object<string,string>} errores - Mapa campo -> mensaje.
 */
function pintarErroresRegistro(errores) {
  CAMPOS_REGISTRO.forEach((campo) => {
    const input = document.getElementById(`reg-${campo}`);
    const caja = document.getElementById(`reg-${campo}-error`);
    const mensaje = errores[campo] || "";
    caja.textContent = mensaje;
    input.setAttribute("aria-invalid", String(Boolean(mensaje)));
  });
}

/** Lógica del formulario de inicio de sesión. */
function configurarLogin() {
  const formulario = document.getElementById("form-login");
  const cajaError = document.getElementById("login-error");
  const boton = document.getElementById("btn-ingresar");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const correo = document.getElementById("login-correo").value.trim();
    const contrasena = document.getElementById("login-contrasena").value;

    if (!esCorreoValido(correo)) {
      mostrarMensajeFormulario(cajaError, "Ingresa un correo electrónico válido.");
      return;
    }
    if (!contrasena) {
      mostrarMensajeFormulario(cajaError, "Ingresa tu contraseña.");
      return;
    }

    mostrarMensajeFormulario(cajaError, "");
    boton.disabled = true;
    boton.textContent = "Ingresando...";
    try {
      await iniciarSesion(correo, contrasena);
      window.location.href = "menu.html";
    } catch (error) {
      mostrarMensajeFormulario(cajaError, error.status === 401
        ? "Correo o contraseña incorrectos."
        : error.message);
    } finally {
      boton.disabled = false;
      boton.textContent = "Ingresar";
    }
  });
}

/** Lógica del formulario de registro de cliente. */
function configurarRegistro() {
  const formulario = document.getElementById("form-registro");
  const cajaError = document.getElementById("registro-error");
  const boton = document.getElementById("btn-registrar");

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const datos = {};
    CAMPOS_REGISTRO.forEach((campo) => {
      datos[campo] = document.getElementById(`reg-${campo}`).value;
    });

    const errores = validarRegistro(datos);
    pintarErroresRegistro(errores);
    mostrarMensajeFormulario(cajaError, "");
    if (Object.keys(errores).length > 0) {
      return;
    }

    boton.disabled = true;
    boton.textContent = "Creando cuenta...";
    try {
      await registrarCliente(datos);
      // Con la cuenta creada, se inicia sesión directamente
      await iniciarSesion(datos.correo, datos.contrasena);
      sessionStorage.setItem("cafeteria.bienvenida", "¡Cuenta creada! Ya puedes hacer tu primer pedido.");
      window.location.href = "menu.html";
    } catch (error) {
      if (error.errores) {
        pintarErroresRegistro(error.errores);
      }
      mostrarMensajeFormulario(cajaError, error.message);
    } finally {
      boton.disabled = false;
      boton.textContent = "Crear cuenta";
    }
  });
}

/** Punto de entrada: si ya hay sesión de cliente, va directo al menú. */
async function inicializar() {
  try {
    const sesion = await obtenerSesionActual();
    if (sesion && sesion.tipo === ROLES.CLIENTE) {
      window.location.href = "menu.html";
      return;
    }
  } catch {
    // Sin servidor o sin sesión: se queda en el formulario
  }

  document.getElementById("tab-ingresar").addEventListener("click", () => mostrarPestana("ingresar"));
  document.getElementById("tab-registro").addEventListener("click", () => mostrarPestana("registro"));
  document.getElementById("link-registro").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarPestana("registro");
  });
  configurarLogin();
  configurarRegistro();
}

document.addEventListener("DOMContentLoaded", inicializar);
