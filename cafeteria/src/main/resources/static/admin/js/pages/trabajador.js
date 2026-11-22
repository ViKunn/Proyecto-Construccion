/**
 * Archivo: trabajador.js
 * Propósito: Controlar la pantalla panel-trabajador.html cubriendo todas las
 * historias de usuario del personal de cafetería:
 * - HU-PER-01: Registrar producto nuevo en el menú.
 * - HU-PER-02: Actualizar datos y precio de un producto existente.
 * - HU-PER-03: Cambiar disponibilidad (si / no) sin eliminar el producto.
 * - HU-PER-04: Consultar pedidos pendientes y por estado.
 * - HU-PER-05: Cambiar pedido de pendiente -> en preparación.
 * - HU-PER-06: Cambiar pedido de en preparación -> listo.
 * - HU-PER-07: Verificar código de retiro y marcar pedido como entregado.
 */

import { APP_CONFIG, DISPONIBILIDAD, ESTADOS_PEDIDO, ROLES } from "../config.js";
import { cerrarSesion, requerirRol } from "../services/authService.js";
import {
  actualizarProducto,
  cambiarDisponibilidadProducto,
  crearProducto,
  listarProductos
} from "../services/productoService.js";
import {
  buscarPedidoPorCodigo,
  cambiarEstadoPedido,
  confirmarEntregaPorCodigo,
  listarPedidos,
  obtenerDetallePedido
} from "../services/pedidoService.js";
import {
  crearBadgeEstado,
  escaparHtml,
  formatearFecha,
  formatearMoneda,
  mostrarToast
} from "../utils/ui.js";
import { validarProducto } from "../utils/validators.js";

// Estado interno de la vista del trabajador
let sesionActual = null;
let estadoFiltroPedido = ESTADOS_PEDIDO.PENDIENTE;
let pedidosCache = [];
let productosCache = [];
let timerAutoRefresco = null;

/* ============================================================================
   SECCIÓN 1: GESTIÓN DE PESTAÑAS Y MODALES
   ============================================================================ */

/**
 * Configura el cambio entre pestañas (Pedidos, Validar Retiro y Menú).
 */
function inicializarPestanas() {
  const botones = document.querySelectorAll(".tab-btn");
  const paneles = document.querySelectorAll(".tab-panel");

  botones.forEach((btn) => {
    btn.addEventListener("click", () => {
      botones.forEach((b) => b.classList.remove("active"));
      paneles.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const idObjetivo = btn.dataset.tab;
      document.getElementById(idObjetivo)?.classList.add("active");
    });
  });
}

/**
 * Abre un modal por su ID.
 *
 * @param {string} modalId - ID del elemento .modal-backdrop.
 */
function abrirModal(modalId) {
  document.getElementById(modalId)?.classList.add("open");
}

/**
 * Cierra un modal por su ID.
 *
 * @param {string} modalId - ID del elemento .modal-backdrop.
 */
function cerrarModal(modalId) {
  document.getElementById(modalId)?.classList.remove("open");
}

/* ============================================================================
   SECCIÓN 2: PANEL DE PEDIDOS Y CAMBIOS DE ESTADO (HU-PER-04, 05, 06)
   ============================================================================ */

/**
 * Actualiza los contadores numéricos de cada píldora de estado.
 */
function actualizarContadoresPedidos() {
  const contar = (estado) => pedidosCache.filter((p) => p.estado === estado).length;
  document.getElementById("count-pendiente").textContent = contar(ESTADOS_PEDIDO.PENDIENTE);
  document.getElementById("count-preparacion").textContent = contar(ESTADOS_PEDIDO.EN_PREPARACION);
  document.getElementById("count-listo").textContent = contar(ESTADOS_PEDIDO.LISTO);
  document.getElementById("count-entregado").textContent = contar(ESTADOS_PEDIDO.ENTREGADO);
  document.getElementById("count-todos").textContent = pedidosCache.length;
}

/**
 * Genera el botón de acción permitido según el estado actual del pedido (RN-NEG-06).
 *
 * @param {Object} pedido - Objeto pedido.
 * @returns {string} HTML del botón correspondiente.
 */
function construirBotonAccionEstado(pedido) {
  if (pedido.estado === ESTADOS_PEDIDO.PENDIENTE) {
    return `
      <button
        type="button"
        class="btn btn-warning btn-sm"
        data-accion-pedido="avanzar"
        data-id="${escaparHtml(pedido.idPedido)}"
        data-siguiente="${ESTADOS_PEDIDO.EN_PREPARACION}"
      >
        Iniciar preparación
      </button>
    `;
  }

  if (pedido.estado === ESTADOS_PEDIDO.EN_PREPARACION) {
    return `
      <button
        type="button"
        class="btn btn-success btn-sm"
        data-accion-pedido="avanzar"
        data-id="${escaparHtml(pedido.idPedido)}"
        data-siguiente="${ESTADOS_PEDIDO.LISTO}"
      >
        Marcar listo
      </button>
    `;
  }

  if (pedido.estado === ESTADOS_PEDIDO.LISTO) {
    return `
      <button
        type="button"
        class="btn btn-primary btn-sm"
        data-accion-pedido="ir-retiro"
        data-codigo="${escaparHtml(pedido.codigoRetiro)}"
      >
        Validar retiro
      </button>
    `;
  }

  return `<span class="text-muted">Completado</span>`;
}

/**
 * Renderiza la tabla de pedidos aplicando el filtro de estado activo.
 */
function renderizarTablaPedidos() {
  const tbody = document.getElementById("tabla-pedidos-body");
  const visibles = estadoFiltroPedido
    ? pedidosCache.filter((p) => p.estado === estadoFiltroPedido)
    : pedidosCache;

  if (visibles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No hay pedidos en este estado.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visibles
    .map(
      (pedido) => `
        <tr>
          <td>#${escaparHtml(pedido.idPedido)}</td>
          <td><strong>${escaparHtml(pedido.codigoRetiro)}</strong></td>
          <td>${escaparHtml(pedido.nombreCliente || pedido.codigoCliente)}</td>
          <td>${escaparHtml(formatearFecha(pedido.fechaRegistro))}</td>
          <td><strong>${formatearMoneda(pedido.importeTotal)}</strong></td>
          <td>${crearBadgeEstado(pedido.estado)}</td>
          <td class="actions-cell">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-accion-pedido="detalle"
              data-id="${escaparHtml(pedido.idPedido)}"
            >
              Ver detalle
            </button>
            ${construirBotonAccionEstado(pedido)}
          </td>
        </tr>
      `
    )
    .join("");
}

/**
 * Consulta todos los pedidos del servicio/backend y refresca contadores y tabla.
 */
async function cargarPedidos() {
  try {
    pedidosCache = await listarPedidos();
    actualizarContadoresPedidos();
    renderizarTablaPedidos();
  } catch (error) {
    mostrarToast(error.message || "Error al consultar los pedidos.", "error");
  }
}

/**
 * Muestra en un modal los productos (DetallePedido) y la trazabilidad (HistorialEstadoPedido).
 *
 * @param {string|number} idPedido - ID del pedido seleccionado.
 */
async function mostrarModalDetallePedido(idPedido) {
  try {
    const pedido = await obtenerDetallePedido(idPedido);
    document.getElementById("modal-pedido-titulo").textContent =
      `Pedido #${pedido.idPedido} — Código ${pedido.codigoRetiro}`;

    const filasDetalles = (pedido.detalles || [])
      .map(
        (d) => `
          <tr>
            <td>${escaparHtml(d.nombreProducto || d.codigoProducto)}</td>
            <td>${escaparHtml(d.cantidad)}</td>
            <td>${formatearMoneda(d.precioUnitario)}</td>
            <td>${formatearMoneda(Number(d.precioUnitario) * Number(d.cantidad))}</td>
          </tr>
        `
      )
      .join("");

    const filasHistorial = (pedido.historial || [])
      .map(
        (h) => `
          <tr>
            <td>${crearBadgeEstado(h.estado)}</td>
            <td>${escaparHtml(formatearFecha(h.fechaCambio))}</td>
            <td>${escaparHtml(h.nombreTrabajador || (h.idTrabajador ? `Trabajador #${h.idTrabajador}` : "Sistema (inicial)"))}</td>
          </tr>
        `
      )
      .join("");

    document.getElementById("modal-pedido-contenido").innerHTML = `
      <p><strong>Cliente:</strong> ${escaparHtml(pedido.nombreCliente || pedido.codigoCliente)}</p>
      <p><strong>Estado actual:</strong> ${crearBadgeEstado(pedido.estado)}</p>
      <p><strong>Importe total:</strong> ${formatearMoneda(pedido.importeTotal)}</p>

      <h4 class="mt-1">Productos solicitados</h4>
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
          <tbody>${filasDetalles || '<tr><td colspan="4">Sin detalles.</td></tr>'}</tbody>
        </table>
      </div>

      <h4 class="mt-1">Historial de estados</h4>
      <div class="table-responsive mt-1">
        <table>
          <thead>
            <tr>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Responsable</th>
            </tr>
          </thead>
          <tbody>${filasHistorial || '<tr><td colspan="3">Sin historial.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    abrirModal("modal-detalle-pedido");
  } catch (error) {
    mostrarToast(error.message || "No se pudo cargar el detalle del pedido.", "error");
  }
}

/**
 * Delegación de eventos para acciones sobre la tabla de pedidos
 * (Ver detalle, Iniciar preparación, Marcar listo, Ir a validar retiro).
 */
async function manejarAccionesTablaPedidos(evento) {
  const boton = evento.target.closest("[data-accion-pedido]");
  if (!boton) {
    return;
  }

  const accion = boton.dataset.accionPedido;

  if (accion === "detalle") {
    await mostrarModalDetallePedido(boton.dataset.id);
    return;
  }

  if (accion === "avanzar") {
    const idPedido = boton.dataset.id;
    const siguienteEstado = boton.dataset.siguiente;

    try {
      await cambiarEstadoPedido(
        idPedido,
        siguienteEstado,
        sesionActual.idTrabajador,
        sesionActual.nombre
      );
      mostrarToast(`Pedido #${idPedido} actualizado a "${siguienteEstado}".`, "exito");
      await cargarPedidos();
    } catch (error) {
      mostrarToast(error.message || "No se pudo cambiar el estado del pedido.", "error");
    }
    return;
  }

  if (accion === "ir-retiro") {
    // Cambia a la pestaña de retiro y precarga el código para agilizar la entrega
    document.querySelector('[data-tab="tab-retiro"]')?.click();
    const inputCodigo = document.getElementById("input-codigo-retiro");
    inputCodigo.value = boton.dataset.codigo;
    document.getElementById("form-buscar-retiro").requestSubmit();
  }
}

/* ============================================================================
   SECCIÓN 3: VALIDACIÓN DE CÓDIGO DE RETIRO (HU-PER-07, RN-NEG-07)
   ============================================================================ */

/**
 * Busca el pedido asociado al código ingresado y valida si es elegible para entrega.
 *
 * @param {SubmitEvent} evento - Evento submit del buscador de retiro.
 */
async function manejarBusquedaRetiro(evento) {
  evento.preventDefault();
  const contenedor = document.getElementById("resultado-retiro");
  const codigo = document.getElementById("input-codigo-retiro").value.trim().toUpperCase();

  if (!codigo) {
    mostrarToast("Ingresa un código de retiro para verificar.", "aviso");
    return;
  }

  try {
    const pedido = await buscarPedidoPorCodigo(codigo);
    const puedeEntregar = pedido.estado === ESTADOS_PEDIDO.LISTO;

    let alertaEstado = "";
    if (puedeEntregar) {
      alertaEstado = `<div class="alert alert-exito">Código válido y pedido <strong>Listo para retirar</strong>. Puedes confirmar la entrega.</div>`;
    } else if (pedido.estado === ESTADOS_PEDIDO.ENTREGADO) {
      alertaEstado = `<div class="alert alert-info">Este pedido ya fue marcado como <strong>Entregado</strong> anteriormente.</div>`;
    } else {
      alertaEstado = `<div class="alert alert-aviso">Entrega bloqueada (RN-NEG-07): el pedido está en estado <strong>${escaparHtml(pedido.estado)}</strong> y debe estar <strong>Listo para retirar</strong>.</div>`;
    }

    const itemsResumen = (pedido.detalles || [])
      .map(
        (d) =>
          `<li>${escaparHtml(d.cantidad)}x ${escaparHtml(d.nombreProducto || d.codigoProducto)} (${formatearMoneda(d.precioUnitario)})</li>`
      )
      .join("");

    contenedor.innerHTML = `
      ${alertaEstado}
      <div class="card" style="box-shadow: none; background: #faf7f2;">
        <p><strong>Pedido:</strong> #${escaparHtml(pedido.idPedido)} | <strong>Código:</strong> ${escaparHtml(pedido.codigoRetiro)}</p>
        <p><strong>Cliente:</strong> ${escaparHtml(pedido.nombreCliente || pedido.codigoCliente)}</p>
        <p><strong>Estado actual:</strong> ${crearBadgeEstado(pedido.estado)}</p>
        <p><strong>Total:</strong> ${formatearMoneda(pedido.importeTotal)}</p>
        <ul class="mt-1" style="padding-left: 1.25rem;">${itemsResumen}</ul>

        <div class="mt-1">
          <button
            type="button"
            id="btn-confirmar-entrega"
            class="btn btn-success"
            ${puedeEntregar ? "" : "disabled"}
          >
            Confirmar entrega del pedido
          </button>
        </div>
      </div>
    `;

    // Si el pedido está listo, se enlaza el botón de confirmación final
    if (puedeEntregar) {
      document.getElementById("btn-confirmar-entrega").addEventListener("click", async () => {
        try {
          await confirmarEntregaPorCodigo(
            pedido.codigoRetiro,
            sesionActual.idTrabajador,
            sesionActual.nombre
          );
          mostrarToast(`Pedido ${pedido.codigoRetiro} entregado correctamente.`, "exito");
          await cargarPedidos();
          // Se vuelve a consultar para reflejar el nuevo estado 'entregado' en pantalla
          document.getElementById("form-buscar-retiro").requestSubmit();
        } catch (error) {
          mostrarToast(error.message || "Error al confirmar la entrega.", "error");
        }
      });
    }
  } catch (error) {
    contenedor.innerHTML = `
      <div class="alert alert-error">${escaparHtml(error.message)}</div>
    `;
  }
}

/* ============================================================================
   SECCIÓN 4: GESTIÓN DEL MENÚ (HU-PER-01, HU-PER-02, HU-PER-03)
   ============================================================================ */

/**
 * Renderiza la tabla de productos aplicando los filtros de texto, tipo y disponibilidad.
 */
function renderizarTablaMenu() {
  const tbody = document.getElementById("tabla-menu-body");
  const texto = document.getElementById("filtro-menu-texto").value.trim().toLowerCase();
  const tipo = document.getElementById("filtro-menu-tipo").value;
  const disp = document.getElementById("filtro-menu-disp").value;

  const filtrados = productosCache.filter((p) => {
    const coincideTexto =
      p.codigoProducto.toLowerCase().includes(texto) ||
      p.nombre.toLowerCase().includes(texto);
    const coincideTipo = !tipo || p.tipoProducto === tipo;
    const coincideDisp = !disp || p.disponible === disp;
    return coincideTexto && coincideTipo && coincideDisp;
  });

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No hay productos que coincidan con el filtro.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtrados
    .map((p) => {
      const esDisponible = p.disponible === DISPONIBILIDAD.SI;
      const badgeDisp = esDisponible
        ? '<span class="badge badge-disponible">Disponible</span>'
        : '<span class="badge badge-no-disponible">No disponible</span>';

      return `
        <tr>
          <td><strong>${escaparHtml(p.codigoProducto)}</strong></td>
          <td>${escaparHtml(p.nombre)}</td>
          <td>${escaparHtml(p.tipoProducto)}</td>
          <td>${formatearMoneda(p.precio)}</td>
          <td>${badgeDisp}</td>
          <td class="actions-cell">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              data-accion-menu="editar"
              data-codigo="${escaparHtml(p.codigoProducto)}"
            >
              Editar
            </button>
            <button
              type="button"
              class="btn ${esDisponible ? "btn-danger" : "btn-success"} btn-sm"
              data-accion-menu="disponibilidad"
              data-codigo="${escaparHtml(p.codigoProducto)}"
              data-actual="${escaparHtml(p.disponible)}"
            >
              ${esDisponible ? "Desactivar" : "Activar"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

/**
 * Carga todos los productos del menú desde el servicio/backend.
 */
async function cargarProductos() {
  try {
    productosCache = await listarProductos();
    renderizarTablaMenu();
  } catch (error) {
    mostrarToast(error.message || "No se pudo cargar el menú.", "error");
  }
}

/**
 * Maneja el registro de un nuevo producto en el menú (HU-PER-01).
 */
async function manejarCrearProducto(evento) {
  evento.preventDefault();

  const nuevoProducto = {
    codigoProducto: document.getElementById("prod-codigo").value.trim(),
    nombre: document.getElementById("prod-nombre").value.trim(),
    precio: document.getElementById("prod-precio").value,
    tipoProducto: document.getElementById("prod-tipo").value,
    disponible: document.getElementById("prod-disponible").value
  };

  const errorValidacion = validarProducto(nuevoProducto, true);
  if (errorValidacion) {
    mostrarToast(errorValidacion, "aviso");
    return;
  }

  try {
    await crearProducto(nuevoProducto);
    mostrarToast("Producto registrado en el menú.", "exito");
    evento.target.reset();
    await cargarProductos();
  } catch (error) {
    mostrarToast(error.message || "Error al registrar el producto.", "error");
  }
}

/**
 * Maneja los clics de Editar (HU-PER-02) y Activar/Desactivar (HU-PER-03) en la tabla del menú.
 */
async function manejarAccionesTablaMenu(evento) {
  const boton = evento.target.closest("[data-accion-menu]");
  if (!boton) {
    return;
  }

  const accion = boton.dataset.accionMenu;
  const codigo = boton.dataset.codigo;

  if (accion === "editar") {
    const producto = productosCache.find((p) => p.codigoProducto === codigo);
    if (!producto) {
      return;
    }

    document.getElementById("edit-prod-codigo").value = producto.codigoProducto;
    document.getElementById("edit-prod-nombre").value = producto.nombre;
    document.getElementById("edit-prod-precio").value = producto.precio;
    document.getElementById("edit-prod-tipo").value = producto.tipoProducto;
    document.getElementById("edit-prod-disponible").value = producto.disponible;
    abrirModal("modal-editar-producto");
    return;
  }

  if (accion === "disponibilidad") {
    const nuevaDisponibilidad =
      boton.dataset.actual === DISPONIBILIDAD.SI ? DISPONIBILIDAD.NO : DISPONIBILIDAD.SI;

    try {
      await cambiarDisponibilidadProducto(codigo, nuevaDisponibilidad);
      mostrarToast(`Disponibilidad de ${codigo} actualizada a "${nuevaDisponibilidad}".`, "exito");
      await cargarProductos();
    } catch (error) {
      mostrarToast(error.message || "No se pudo cambiar la disponibilidad.", "error");
    }
  }
}

/**
 * Guarda los cambios realizados en el modal de edición de producto (HU-PER-02).
 */
async function manejarEditarProducto(evento) {
  evento.preventDefault();

  const codigo = document.getElementById("edit-prod-codigo").value;
  const datos = {
    nombre: document.getElementById("edit-prod-nombre").value.trim(),
    precio: document.getElementById("edit-prod-precio").value,
    tipoProducto: document.getElementById("edit-prod-tipo").value,
    disponible: document.getElementById("edit-prod-disponible").value
  };

  const errorValidacion = validarProducto(datos, false);
  if (errorValidacion) {
    mostrarToast(errorValidacion, "aviso");
    return;
  }

  try {
    await actualizarProducto(codigo, datos);
    cerrarModal("modal-editar-producto");
    mostrarToast(`Producto ${codigo} actualizado correctamente.`, "exito");
    await cargarProductos();
  } catch (error) {
    mostrarToast(error.message || "No se pudo actualizar el producto.", "error");
  }
}

/* ============================================================================
   SECCIÓN 5: INICIALIZACIÓN GENERAL DEL PANEL DEL TRABAJADOR
   ============================================================================ */

function inicializarPanelTrabajador() {
  // Verifica que el usuario autenticado tenga rol 'trabajador'
  sesionActual = requerirRol(ROLES.TRABAJADOR);
  if (!sesionActual) {
    return;
  }

  document.getElementById("trabajador-info").textContent =
    `${sesionActual.nombre} (${sesionActual.correo})`;

  document.getElementById("btn-cerrar-sesion").addEventListener("click", cerrarSesion);
  inicializarPestanas();

  // Cierre de modales mediante botones con atributo data-close-modal
  document.querySelectorAll("[data-close-modal]").forEach((btn) => {
    btn.addEventListener("click", () => cerrarModal(btn.dataset.closeModal));
  });

  // Filtros de estado de pedidos
  document.querySelectorAll("#filtros-estado-pedidos .pill-btn").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll("#filtros-estado-pedidos .pill-btn").forEach((p) => {
        p.classList.remove("active");
      });
      pill.classList.add("active");
      estadoFiltroPedido = pill.dataset.estado;
      renderizarTablaPedidos();
    });
  });

  // Eventos de pedidos y retiro
  document.getElementById("btn-actualizar-pedidos").addEventListener("click", cargarPedidos);
  document.getElementById("tabla-pedidos-body").addEventListener("click", manejarAccionesTablaPedidos);
  document.getElementById("form-buscar-retiro").addEventListener("submit", manejarBusquedaRetiro);

  // Eventos de menú
  document.getElementById("form-nuevo-producto").addEventListener("submit", manejarCrearProducto);
  document.getElementById("form-editar-producto").addEventListener("submit", manejarEditarProducto);
  document.getElementById("tabla-menu-body").addEventListener("click", manejarAccionesTablaMenu);
  document.getElementById("filtro-menu-texto").addEventListener("input", renderizarTablaMenu);
  document.getElementById("filtro-menu-tipo").addEventListener("change", renderizarTablaMenu);
  document.getElementById("filtro-menu-disp").addEventListener("change", renderizarTablaMenu);

  // Carga inicial de datos
  cargarPedidos();
  cargarProductos();

  // Refresco automático de pedidos cada 15 segundos mientras no haya un modal abierto
  timerAutoRefresco = setInterval(() => {
    const hayModalAbierto = document.querySelector(".modal-backdrop.open");
    if (!hayModalAbierto) {
      cargarPedidos();
    }
  }, APP_CONFIG.AUTO_REFRESH_MS);

  // Limpieza del temporizador al salir de la página
  window.addEventListener("beforeunload", () => {
    if (timerAutoRefresco) {
      clearInterval(timerAutoRefresco);
    }
  });
}

document.addEventListener("DOMContentLoaded", inicializarPanelTrabajador);
