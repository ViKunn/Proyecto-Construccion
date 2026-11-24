/**
 * Archivo: cambioContrasenaModal.js
 * Propósito: Controlador reutilizable para el modal "Cambiar contraseña"
 * (HU-USU-01, PUT /api/auth/contrasena) compartido entre panel-trabajador.html
 * y panel-administrador.html para evitar duplicación de código.
 */

import { cambiarContrasena } from "../services/authService.js";
import { mostrarToast } from "./ui.js";
import { validarCambioContrasena } from "./validators.js";

/**
 * Enlaza los eventos del botón en la barra superior y el formulario del modal
 * #modal-cambio-clave para actualizar la contraseña del usuario autenticado.
 */
export function inicializarModalCambioContrasena() {
  const btnAbrir = document.getElementById("btn-abrir-cambio-clave");
  const modal = document.getElementById("modal-cambio-clave");
  const form = document.getElementById("form-cambio-clave");
  const alertaError = document.getElementById("cambio-clave-error");
  const btnGuardar = document.getElementById("btn-guardar-cambio-clave");

  if (!btnAbrir || !modal || !form) {
    return;
  }

  const limpiarError = () => {
    if (alertaError) {
      alertaError.textContent = "";
      alertaError.classList.add("hidden");
    }
  };

  const mostrarError = (mensaje) => {
    if (alertaError) {
      alertaError.textContent = mensaje;
      alertaError.classList.remove("hidden");
    } else {
      mostrarToast(mensaje, "error");
    }
  };

  // Abre el modal limpio al pulsar "Cambiar contraseña" en la barra superior
  btnAbrir.addEventListener("click", () => {
    form.reset();
    limpiarError();
    modal.classList.add("open");
    document.getElementById("clave-actual")?.focus();
  });

  // Envía la solicitud PUT /api/auth/contrasena validando antes los campos
  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    limpiarError();

    const datos = {
      contrasenaActual: document.getElementById("clave-actual").value,
      contrasenaNueva: document.getElementById("clave-nueva").value,
      confirmarContrasena: document.getElementById("clave-confirmar").value
    };

    const errorValidacion = validarCambioContrasena(datos);
    if (errorValidacion) {
      mostrarError(errorValidacion);
      return;
    }

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Guardando...";

    try {
      await cambiarContrasena(datos.contrasenaActual, datos.contrasenaNueva);
      modal.classList.remove("open");
      form.reset();
      mostrarToast("Contraseña actualizada correctamente.", "exito");
    } catch (error) {
      if (error.status === 401) {
        mostrarToast("Tu sesión ha expirado. Inicia sesión nuevamente.", "error");
        window.location.href = "index.html";
        return;
      }
      mostrarError(error.message || "No se pudo actualizar la contraseña.");
    } finally {
      btnGuardar.disabled = false;
      btnGuardar.textContent = "Actualizar contraseña";
    }
  });
}
