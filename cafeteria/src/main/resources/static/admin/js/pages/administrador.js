/**
 * Archivo: administrador.js
 * Propósito: Controlar la pantalla panel-administrador.html integrada con el backend:
 * 1. Gestión de trabajadores (GET /api/trabajadores y POST /api/trabajadores).
 * 2. Historial paginado y detalle completo de pedidos
 *    (GET /api/historial-pedidos y GET /api/historial-pedidos/{idPedido}).
 */

import { ROLES } from "../config.js";
import { cerrarSesion, requerirRol } from "../services/authService.js";
import { crearTrabajador, listarTrabajadores } from "../services/trabajadorService.js";
import {
  listarHistorialPedidos,
  obtenerDetalleHistorialPedido
} from "../services/historialService.js";
import {
  crearBadgeEstado,
  escaparHtml,
  formatearFecha,
  formatearMoneda,
  mostrarToast
} from "../utils/ui.js";
import { validarNuevoTrabajador } from "../utils/validators.js";
import { inicializarModalCambioContrasena } from "../utils/cambioContrasenaModal.js";

// Estado en memoria del panel de administrador
let trabajadoresCache = [];
let paginaHistorial = 0;
const LIMITE_HISTORIAL = 20;
let filtroIdPedido = "";

/**
 * Configura el cambio entre pestañas del panel del administrador.
 */
function inicializarPestanas() {
  const botones = document.querySelectorAll(".tab-btn");
  const paneles = document.querySelectorAll(".tab-panel");

  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      botones.forEach((b) => b.classList.remove("active"));
      paneles.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(btn.dataset.tab)?.classList.add("active");
    });
  });
}

/* ============================================================================
   SECCIÓN 1: GESTIÓN DE TRABAJADORES
   ============================================================================ */

/**
 * Renderiza la tabla de trabajadores aplicando el filtro local por texto.
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
 * Consulta GET /api/trabajadores y actualiza la tabla.
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
 * Valida y envía POST /api/trabajadores para registrar un nuevo trabajador.
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

  const boton = document.getElementById("btn-guardar-trabajador");
  boton.disabled = true;

  try {
    await crearTrabajador(datos);
    mostrarToast("Cuenta de trabajador registrada correctamente.", "exito");
    evento.target.reset();
    await cargarTrabajadores();
  } catch (error) {
    mostrarToast(error.message || "No se pudo crear el trabajador.", "error");
  } finally {
    boton.disabled = false;
  }
}

/* ============================================================================
   SECCIÓN 2: HISTORIAL DE PEDIDOS Y DETALLE COMPLETO
   ============================================================================ */

/**
 * Consulta GET /api/historial-pedidos con paginación y filtro opcional por ID.
 */
async function cargarHistorial() {
  const tbody = document.getElementById("tabla-historial-body");
  try {
    const respuesta = await listarHistorialPedidos({
      pagina: paginaHistorial,
      limite: LIMITE_HISTORIAL,
      idPedido: filtroIdPedido
    });

    const pedidos = respuesta.pedidos || [];
    const total = Number(respuesta.total || 0);
    const totalPaginas = Math.max(1, Math.ceil(total / LIMITE_HISTORIAL));

    document.getElementById("historial-resumen").textContent = `Total: ${total} pedido(s)`;
    document.getElementById("historial-pagina").textContent =
      `Página ${paginaHistorial + 1} de ${totalPaginas}`;
    document.getElementById("btn-hist-anterior").disabled = paginaHistorial <= 0;
    document.getElementById("btn-hist-siguiente").disabled =
      (paginaHistorial + 1) * LIMITE_HISTORIAL >= total;

    if (pedidos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">No hay registros de historial para mostrar.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = pedidos
      .map((item) => {
        const cambios = item.cambios || [];
        const ultimoCambio = cambios[cambios.length - 1];
        const estadoActual = ultimoCambio ? ultimoCambio.estado : "pendiente";

        const lineaTiempo = cambios
          .map((c) => {
            const responsable = c.trabajadorNombre
              ? `${c.trabajadorNombre} ${c.trabajadorApellido || ""}`.trim()
              : "Sistema (registro inicial)";
            return `
              <li>
                ${crearBadgeEstado(c.estado)}
                <span>${escaparHtml(formatearFecha(c.fechaCambio))}</span> —
                <span class="text-muted">${escaparHtml(responsable)}</span>
              </li>
            `;
          })
          .join("");

        return `
          <tr>
            <td><strong>#${escaparHtml(item.idPedido)}</strong></td>
            <td>${crearBadgeEstado(estadoActual)}</td>
            <td><ul class="timeline-list">${lineaTiempo}</ul></td>
            <td>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                data-ver-historial="${escaparHtml(item.idPedido)}"
              >
                Ver detalle
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (error) {
    mostrarToast(error.message || "Error al cargar el historial de pedidos.", "error");
  }
}

/**
 * Abre el modal con GET /api/historial-pedidos/{idPedido} mostrando cliente,
 * código de retiro, ítems con subtotal y todos los cambios de estado.
 *
 * @param {string|number} idPedido - ID del pedido a inspeccionar.
 */
async function mostrarDetalleHistorial(idPedido) {
  try {
    const detalle = await obtenerDetalleHistorialPedido(idPedido);
    document.getElementById("modal-hist-titulo").textContent =
      `Detalle del pedido #${detalle.idPedido}`;

    const filasItems = (detalle.items || [])
      .map(
        (i) => `
          <tr>
            <td>${escaparHtml(i.productoNombre)}</td>
            <td>${escaparHtml(i.cantidad)}</td>
            <td>${formatearMoneda(i.precioUnitario)}</td>
            <td>${formatearMoneda(i.subtotal)}</td>
          </tr>
        `
      )
      .join("");

    const filasCambios = (detalle.cambios || [])
      .map((c) => {
        const responsable = c.trabajadorNombre
          ? `${c.trabajadorNombre} ${c.trabajadorApellido || ""}`.trim()
          : "Sistema (registro inicial)";
        return `
          <tr>
            <td>${crearBadgeEstado(c.estado)}</td>
            <td>${escaparHtml(formatearFecha(c.fechaCambio))}</td>
            <td>${escaparHtml(responsable)}</td>
          </tr>
        `;
      })
      .join("");

    document.getElementById("modal-hist-contenido").innerHTML = `
      <p><strong>Cliente:</strong> ${escaparHtml(detalle.clienteNombre)} ${escaparHtml(detalle.clienteApellido)} (${escaparHtml(detalle.clienteCelular)})</p>
      <p><strong>Código de retiro:</strong> <code>${escaparHtml(detalle.codigoRetiro)}</code></p>
      <p><strong>Fecha de registro:</strong> ${escaparHtml(formatearFecha(detalle.fechaRegistro))}</p>
      <p><strong>Estado actual:</strong> ${crearBadgeEstado(detalle.estadoActual)}</p>
      <p><strong>Importe total:</strong> <strong>${formatearMoneda(detalle.importeTotal)}</strong></p>

      <h4 class="mt-1">Productos del pedido</h4>
      <div class="table-responsive mt-1">
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cant.</th>
              <th>Precio unit.</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>${filasItems}</tbody>
        </table>
      </div>

      <h4 class="mt-1">Auditoría de estados</h4>
      <div class="table-responsive mt-1">
        <table>
          <thead>
            <tr>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>${filasCambios}</tbody>
        </table>
      </div>
    `;

    document.getElementById("modal-detalle-historial").classList.add("open");
  } catch (error) {
    mostrarToast(error.message || "No se pudo cargar el detalle del pedido.", "error");
  }
}

/**
 * Punto de entrada de la pantalla panel-administrador.html.
 */
async function inicializarPanelAdministrador() {
  const sesionActual = await requerirRol(ROLES.ADMINISTRADOR);
  if (!sesionActual) {
    return;
  }

  document.getElementById("admin-info").textContent = `Sesión: ${sesionActual.correo}`;
  document.getElementById("btn-cerrar-sesion").addEventListener("click", cerrarSesion);
  inicializarModalCambioContrasena();
  inicializarPestanas();

  // Cierre de modal
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById(btn.dataset.closeModal)?.classList.remove("open");
    });
  });

  // Eventos de trabajadores
  document.getElementById("form-crear-trabajador").addEventListener("submit", manejarCrearTrabajador);
  document.getElementById("buscar-trabajador").addEventListener("input", renderizarTablaTrabajadores);
  document.getElementById("btn-recargar-trabajadores").addEventListener("click", cargarTrabajadores);

  // Eventos de historial
  document.getElementById("form-filtrar-historial").addEventListener("submit", (evento) => {
    evento.preventDefault();
    filtroIdPedido = document.getElementById("filtro-historial-id").value.trim();
    paginaHistorial = 0;
    cargarHistorial();
  });

  document.getElementById("btn-limpiar-historial").addEventListener("click", () => {
    document.getElementById("filtro-historial-id").value = "";
    filtroIdPedido = "";
    paginaHistorial = 0;
    cargarHistorial();
  });

  document.getElementById("btn-hist-anterior").addEventListener("click", () => {
    if (paginaHistorial > 0) {
      paginaHistorial -= 1;
      cargarHistorial();
    }
  });

  document.getElementById("btn-hist-siguiente").addEventListener("click", () => {
    paginaHistorial += 1;
    cargarHistorial();
  });

  document.getElementById("tabla-historial-body").addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-ver-historial]");
    if (boton) {
      mostrarDetalleHistorial(boton.dataset.verHistorial);
    }
  });

  await Promise.all([cargarTrabajadores(), cargarHistorial()]);
}

document.addEventListener("DOMContentLoaded", inicializarPanelAdministrador);
