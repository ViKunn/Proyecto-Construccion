/**
 * Archivo: encabezado.js
 * Propósito: Comportamiento común de las páginas internas del cliente (menú y mis pedidos):
 * saludo, cierre de sesión y diálogo de cambio de contraseña (HU-USU-01).
 */

import { cambiarContrasena, cerrarSesion } from "../services/authService.js";
import { abrirDialogo, mostrarMensajeFormulario, mostrarToast } from "./ui.js";
import { validarCambioContrasena } from "./validators.js";

/**
 * Configura el encabezado con los datos de la sesión del cliente.
 *
 * @param {Object} sesion - Sesión normalizada del cliente.
 */
export function inicializarEncabezado(sesion) {
  document.getElementById("saludo-cliente").textContent = `Hola, ${sesion.nombre || sesion.nombreCompleto}`;
  document.getElementById("btn-salir").addEventListener("click", () => cerrarSesion());

  const dialogo = document.getElementById("dialogo-contrasena");
  const formulario = document.getElementById("form-contrasena");
  const cajaError = document.getElementById("contrasena-error");
  const botonGuardar = document.getElementById("btn-guardar-contrasena");

  document.getElementById("btn-cambiar-contrasena").addEventListener("click", () => {
    formulario.reset();
    mostrarMensajeFormulario(cajaError, "");
    abrirDialogo(dialogo);
  });

  document.getElementById("btn-cancelar-contrasena").addEventListener("click", () => dialogo.close());

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const datos = {
      contrasenaActual: document.getElementById("contrasena-actual").value,
      contrasenaNueva: document.getElementById("contrasena-nueva").value,
      confirmar: document.getElementById("contrasena-confirmar").value
    };
    const error = validarCambioContrasena(datos);
    if (error) {
      mostrarMensajeFormulario(cajaError, error);
      return;
    }

    botonGuardar.disabled = true;
    try {
      await cambiarContrasena(datos.contrasenaActual, datos.contrasenaNueva);
      dialogo.close();
      mostrarToast("Tu contraseña se actualizó correctamente.", "exito");
    } catch (err) {
      if (err.status === 401) {
        window.location.href = "index.html";
        return;
      }
      mostrarMensajeFormulario(cajaError, err.message);
    } finally {
      botonGuardar.disabled = false;
    }
  });
}
