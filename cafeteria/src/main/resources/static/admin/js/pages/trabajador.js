/**
 * Archivo: trabajador.js
 * Propósito: Controlar panel-trabajador.html integrado 100% con los endpoints REST
 * reales de Spring Boot + Supabase:
 * - HU-PER-01: POST /api/productos (multipart/form-data)
 * - HU-PER-02: PATCH /api/productos/{codigo} y PUT /api/productos/{codigo}/imagen
 * - HU-PER-03: PATCH /api/productos/{codigo} (disponible) y PUT /api/productos/menu
 * - HU-PER-04: GET /api/pedidos y GET /api/pedidos/{id}
 * - HU-PER-05: POST /api/pedidos/{id}/iniciar-preparacion
 * - HU-PER-06: POST /api/pedidos/{id}/marcar-listo
 * - HU-PER-07: POST /api/pedidos/{id}/verificar-codigo y POST /api/pedidos/{id}/entregar
 */

import { APP_CONFIG, ESTADOS_PEDIDO, ROLES } from "../config.js";
import { cerrarSesion, requerirRol } from "../services/authService.js";
import {
  actualizarProducto,
  armarMenu,
  crearProducto,
  listarProductos,
  reemplazarImagenProducto
} from "../services/productoService.js";
import {
  entregarPedido,
  iniciarPreparacion,
  listarTodosLosPedidos,
  marcarPedidoListo,
  obtenerDetallePedido,
  verificarCodigoRetiro
} from "../services/pedidoService.js";
import {
  crearBadgeEstado,
  escaparHtml,
  formatearFecha,
  formatearMoneda,
  mostrarToast
} from "../utils/ui.js";
import {
  validarFormatoCodigoRetiro,
  validarImagenProducto,
  validarProducto
} from "../utils/validators.js";

// Estado interno del panel del trabajador
let estadoFiltroPedido = ESTADOS_PEDIDO.PENDIENTE;
let pedidosCache = [];
let productosCache = [];
let timerAutoRefresco = null;

/* ============================================================================
   SECCIÓN 1: PESTAÑAS Y MODALES
   ============================================================================ */

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

function abrirModal(modalId) {
  document.getElementById(modalId)?.classList.add("open");
}

function cerrarModal(modalId) {
  document.getElementById(modalId)?.classList.remove("open");
}

/* ============================================================================
   SECCIÓN 2: COLA DE PEDIDOS Y CAMBIOS DE ESTADO (HU-PER-04, 05, 06)
   ============================================================================ */

/**
 * Formatea el nombre del cliente desde pedido.cliente ({ nombre, apellido }).
 *
 * @param {Object} pedido - PedidoDto recibido del servidor.
 * @returns {string} Nombre completo del cliente.
 */
function obtenerNombreCliente(pedido) {
  if (!pedido?.cliente) {
    return "Cliente";
  }
  return `${pedido.cliente.nombre || ""} ${pedido.cliente.apellido || ""}`.trim() || "Cliente";
}

function actualizarContadoresPedidos() {
  const contar = (estado) => pedidosCache.filter((p) => p.estado === estado).length;
  document.getElementById("count-pendiente").textContent = contar(ESTADOS_PEDIDO.PENDIENTE);
  document.getElementById("count-preparacion").textContent = contar(ESTADOS_PEDIDO.EN_PREPARACION);
  document.getElementById("count-listo").textContent = contar(ESTADOS_PEDIDO.LISTO);
  document.getElementById("count-entregado").textContent = contar(ESTADOS_PEDIDO.ENTREGADO);
  document.getElementById("count-todos").textContent = pedidosCache.length;
}

/**
 * Actualiza el desplegable de pedidos en estado "listo" en la pestaña de retiro.
 */
function actualizarSelectorPedidosListos() {
  const select = document.getElementById("select-pedido-listo");
  const valorPrevio = select.value;
  const listos = pedidosCache.filter((p) => p.estado === ESTADOS_PEDIDO.LISTO);

  if (listos.length === 0) {
    select.innerHTML = '<option value="">No hay pedidos listos para retirar</option>';
    return;
  }

  select.innerHTML = [
    '<option value="">Selecciona un pedido listo...</option>',
    ...listos.map(
      (p) =>
        `<option value="${escaparHtml(p.idPedido)}">Pedido #${escaparHtml(p.idPedido)} — ${escaparHtml(obtenerNombreCliente(p))} (${formatearMoneda(p.importeTotal)})</option>`
    )
  ].join("");

  if (listos.some((p) => String(p.idPedido) === String(valorPrevio))) {
    select.value = valorPrevio;
  }
}

/**
 * Construye el botón de transición permitido según RN-NEG-06.
 *
 * @param {Object} pedido - PedidoDto.
 * @returns {string} HTML del botón de acción.
 */
function construirBotonAccionEstado(pedido) {
  if (pedido.estado === ESTADOS_PEDIDO.PENDIENTE) {
    return `
      <button
        type="button"
        class="btn btn-warning btn-sm"
        data-accion-pedido="iniciar"
        data-id="${escaparHtml(pedido.idPedido)}"
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
        data-accion-pedido="listo"
        data-id="${escaparHtml(pedido.idPedido)}"
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
        data-id="${escaparHtml(pedido.idPedido)}"
      >
        Validar retiro
      </button>
    `;
  }

  return '<span class="text-muted">Completado</span>';
}

function renderizarTablaPedidos() {
  const tbody = document.getElementById("tabla-pedidos-body");
  const visibles = estadoFiltroPedido
    ? pedidosCache.filter((p) => p.estado === estadoFiltroPedido)
    : pedidosCache;

  if (visibles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">No hay pedidos en este estado.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visibles
    .map(
      (pedido) => `
        <tr>
          <td><strong>#${escaparHtml(pedido.idPedido)}</strong></td>
          <td>${escaparHtml(obtenerNombreCliente(pedido))}</td>
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

async function cargarPedidos() {
  try {
    pedidosCache = await listarTodosLosPedidos();
    actualizarContadoresPedidos();
    actualizarSelectorPedidosListos();
    renderizarTablaPedidos();
  } catch (error) {
    mostrarToast(error.message || "Error al consultar los pedidos.", "error");
  }
}

async function mostrarModalDetallePedido(idPedido) {
  try {
    const pedido = await obtenerDetallePedido(idPedido);
    document.getElementById("modal-pedido-titulo").textContent = `Pedido #${pedido.idPedido}`;

    const filasItems = (pedido.items || [])
      .map(
        (d) => `
          <tr>
            <td>${escaparHtml(d.nombre)}</td>
            <td>${escaparHtml(d.cantidad)}</td>
            <td>${formatearMoneda(d.precioUnitario)}</td>
            <td>${formatearMoneda(d.subtotal)}</td>
          </tr>
        `
      )
      .join("");

    document.getElementById("modal-pedido-contenido").innerHTML = `
      <p><strong>Cliente:</strong> ${escaparHtml(obtenerNombreCliente(pedido))}</p>
      <p><strong>Fecha de registro:</strong> ${escaparHtml(formatearFecha(pedido.fechaRegistro))}</p>
      <p><strong>Estado actual:</strong> ${crearBadgeEstado(pedido.estado)}</p>
      <p><strong>Importe total:</strong> <strong>${formatearMoneda(pedido.importeTotal)}</strong></p>

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
          <tbody>${filasItems || '<tr><td colspan="4">Sin detalles.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    abrirModal("modal-detalle-pedido");
  } catch (error) {
    mostrarToast(error.message || "No se pudo cargar el detalle del pedido.", "error");
  }
}

async function manejarAccionesTablaPedidos(evento) {
  const boton = evento.target.closest("[data-accion-pedido]");
  if (!boton) {
    return;
  }

  const accion = boton.dataset.accionPedido;
  const idPedido = boton.dataset.id;

  if (accion === "detalle") {
    await mostrarModalDetallePedido(idPedido);
    return;
  }

  if (accion === "iniciar") {
    boton.disabled = true;
    try {
      await iniciarPreparacion(idPedido);
      mostrarToast(`Pedido #${idPedido} pasó a En preparación.`, "exito");
      await cargarPedidos();
    } catch (error) {
      mostrarToast(error.message || "No se pudo iniciar la preparación.", "error");
      boton.disabled = false;
    }
    return;
  }

  if (accion === "listo") {
    boton.disabled = true;
    try {
      await marcarPedidoListo(idPedido);
      mostrarToast(`Pedido #${idPedido} marcado como Listo para retirar.`, "exito");
      await cargarPedidos();
    } catch (error) {
      mostrarToast(error.message || "No se pudo marcar como listo.", "error");
      boton.disabled = false;
    }
    return;
  }

  if (accion === "ir-retiro") {
    // Lleva directo a la pestaña de retiro con el pedido seleccionado
    document.querySelector('[data-tab="tab-retiro"]')?.click();
    const select = document.getElementById("select-pedido-listo");
    select.value = idPedido;
    mostrarResumenPedidoRetiro(idPedido);
    document.getElementById("input-codigo-retiro").focus();
  }
}

/* ============================================================================
   SECCIÓN 3: VALIDACIÓN DE CÓDIGO DE RETIRO (HU-PER-07, RN-NEG-07)
   ============================================================================ */

/**
 * Muestra el resumen de ítems del pedido seleccionado en la pestaña de retiro.
 *
 * @param {string|number} idPedido - ID del pedido seleccionado.
 * @param {string} [alertaHtml=""] - Alerta opcional sobre el resultado de la validación.
 */
function mostrarResumenPedidoRetiro(idPedido, alertaHtml = "") {
  const contenedor = document.getElementById("resultado-retiro");
  const pedido = pedidosCache.find((p) => String(p.idPedido) === String(idPedido));

  if (!pedido) {
    contenedor.innerHTML = alertaHtml;
    return;
  }

  const itemsHtml = (pedido.items || [])
    .map(
      (i) =>
        `<li>${escaparHtml(i.cantidad)}x ${escaparHtml(i.nombre)} (${formatearMoneda(i.subtotal)})</li>`
    )
    .join("");

  contenedor.innerHTML = `
    ${alertaHtml}
    <div class="card" style="box-shadow: none; background: #faf7f2;">
      <p><strong>Pedido:</strong> #${escaparHtml(pedido.idPedido)} | <strong>Cliente:</strong> ${escaparHtml(obtenerNombreCliente(pedido))}</p>
      <p><strong>Estado actual:</strong> ${crearBadgeEstado(pedido.estado)} | <strong>Total:</strong> ${formatearMoneda(pedido.importeTotal)}</p>
      <ul class="mt-1" style="padding-left: 1.25rem;">${itemsHtml}</ul>
    </div>
  `;
}

/**
 * Ejecuta POST /api/pedidos/{id}/verificar-codigo sin cambiar todavía el estado.
 */
async function manejarComprobarCodigo() {
  const idPedido = document.getElementById("select-pedido-listo").value;
  const codigo = document.getElementById("input-codigo-retiro").value.trim().toUpperCase();

  if (!idPedido) {
    mostrarToast("Selecciona primero un pedido listo para retirar.", "aviso");
    return;
  }

  const errorFormato = validarFormatoCodigoRetiro(codigo);
  if (errorFormato) {
    mostrarToast(errorFormato, "aviso");
    return;
  }

  try {
    const resultado = await verificarCodigoRetiro(idPedido, codigo);
    if (resultado.valido) {
      mostrarResumenPedidoRetiro(
        idPedido,
        '<div class="alert alert-exito">Código válido. Puedes pulsar <strong>Confirmar entrega</strong>.</div>'
      );
    } else {
      mostrarResumenPedidoRetiro(
        idPedido,
        '<div class="alert alert-error">El código ingresado NO coincide con este pedido.</div>'
      );
    }
  } catch (error) {
    mostrarToast(error.message || "Error al verificar el código.", "error");
  }
}

/**
 * Ejecuta POST /api/pedidos/{id}/entregar para validar estado "listo", código y entregar.
 */
async function manejarConfirmarEntrega() {
  const idPedido = document.getElementById("select-pedido-listo").value;
  const codigo = document.getElementById("input-codigo-retiro").value.trim().toUpperCase();

  if (!idPedido) {
    mostrarToast("Selecciona primero un pedido listo para retirar.", "aviso");
    return;
  }

  const errorFormato = validarFormatoCodigoRetiro(codigo);
  if (errorFormato) {
    mostrarToast(errorFormato, "aviso");
    return;
  }

  const boton = document.getElementById("btn-confirmar-entrega");
  boton.disabled = true;

  try {
    await entregarPedido(idPedido, codigo);
    mostrarToast(`Pedido #${idPedido} entregado correctamente.`, "exito");
    document.getElementById("input-codigo-retiro").value = "";
    document.getElementById("resultado-retiro").innerHTML =
      `<div class="alert alert-exito">Pedido #${escaparHtml(idPedido)} marcado como <strong>Entregado</strong>.</div>`;
    await cargarPedidos();
  } catch (error) {
    mostrarResumenPedidoRetiro(
      idPedido,
      `<div class="alert alert-error">${escaparHtml(error.message || "No se pudo confirmar la entrega.")}</div>`
    );
  } finally {
    boton.disabled = false;
  }
}

/* ============================================================================
   SECCIÓN 4: GESTIÓN DEL MENÚ (HU-PER-01, HU-PER-02, HU-PER-03)
   ============================================================================ */

function renderizarTablaMenu() {
  const tbody = document.getElementById("tabla-menu-body");
  const texto = document.getElementById("filtro-menu-texto").value.trim().toLowerCase();
  const tipo = document.getElementById("filtro-menu-tipo").value;
  const disp = document.getElementById("filtro-menu-disp").value;

  const filtrados = productosCache.filter((p) => {
    const coincideTexto =
      String(p.codigoProducto).includes(texto) ||
      p.nombre.toLowerCase().includes(texto);
    const coincideTipo = !tipo || p.tipoProducto === tipo;
    const coincideDisp = !disp || String(p.disponible) === disp;
    return coincideTexto && coincideTipo && coincideDisp;
  });

  if (filtrados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">No hay productos que coincidan con el filtro.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtrados
    .map((p) => {
      const esDisponible = Boolean(p.disponible);
      const badgeDisp = esDisponible
        ? '<span class="badge badge-disponible">Disponible</span>'
        : '<span class="badge badge-no-disponible">No disponible</span>';

      const miniatura = p.imagenUrl
        ? `<img src="${escaparHtml(p.imagenUrl)}" alt="${escaparHtml(p.nombre)}" class="producto-thumb" />`
        : '<div class="producto-thumb-placeholder">Sin foto</div>';

      return `
        <tr>
          <td class="checkbox-cell">
            <input
              type="checkbox"
              class="chk-menu-item"
              value="${escaparHtml(p.codigoProducto)}"
              ${esDisponible ? "checked" : ""}
              aria-label="Incluir ${escaparHtml(p.nombre)} en el menú"
            />
          </td>
          <td>${miniatura}</td>
          <td><strong>#${escaparHtml(p.codigoProducto)}</strong></td>
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
              data-actual="${esDisponible}"
            >
              ${esDisponible ? "Desactivar" : "Activar"}
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

async function cargarProductos() {
  try {
    productosCache = await listarProductos();
    renderizarTablaMenu();
  } catch (error) {
    mostrarToast(error.message || "No se pudo cargar el catálogo de productos.", "error");
  }
}

async function manejarCrearProducto(evento) {
  evento.preventDefault();

  const inputImagen = document.getElementById("prod-imagen");
  const archivoImagen = inputImagen.files?.[0] || null;

  const datos = {
    nombre: document.getElementById("prod-nombre").value.trim(),
    precio: document.getElementById("prod-precio").value,
    tipoProducto: document.getElementById("prod-tipo").value,
    imagen: archivoImagen
  };

  const errorProd = validarProducto(datos, true);
  if (errorProd) {
    mostrarToast(errorProd, "aviso");
    return;
  }

  const errorImg = validarImagenProducto(archivoImagen, false);
  if (errorImg) {
    mostrarToast(errorImg, "aviso");
    return;
  }

  const boton = document.getElementById("btn-guardar-producto");
  boton.disabled = true;

  try {
    await crearProducto(datos);
    mostrarToast("Producto registrado correctamente en el menú.", "exito");
    evento.target.reset();
    await cargarProductos();
  } catch (error) {
    mostrarToast(error.message || "Error al registrar el producto.", "error");
  } finally {
    boton.disabled = false;
  }
}

async function manejarAccionesTablaMenu(evento) {
  const boton = evento.target.closest("[data-accion-menu]");
  if (!boton) {
    return;
  }

  const accion = boton.dataset.accionMenu;
  const codigo = Number(boton.dataset.codigo);

  if (accion === "editar") {
    const producto = productosCache.find((p) => Number(p.codigoProducto) === codigo);
    if (!producto) {
      return;
    }

    document.getElementById("edit-prod-codigo").value = producto.codigoProducto;
    document.getElementById("edit-prod-nombre").value = producto.nombre;
    document.getElementById("edit-prod-precio").value = producto.precio;
    document.getElementById("edit-prod-disponible").value = String(Boolean(producto.disponible));
    document.getElementById("edit-prod-imagen").value = "";
    abrirModal("modal-editar-producto");
    return;
  }

  if (accion === "disponibilidad") {
    const nuevoValor = boton.dataset.actual !== "true";
    boton.disabled = true;
    try {
      await actualizarProducto(codigo, { disponible: nuevoValor });
      mostrarToast(
        `Producto #${codigo} marcado como ${nuevoValor ? "disponible" : "no disponible"}.`,
        "exito"
      );
      await cargarProductos();
    } catch (error) {
      mostrarToast(error.message || "No se pudo cambiar la disponibilidad.", "error");
      boton.disabled = false;
    }
  }
}

async function manejarEditarProducto(evento) {
  evento.preventDefault();

  const codigo = Number(document.getElementById("edit-prod-codigo").value);
  const nombre = document.getElementById("edit-prod-nombre").value.trim();
  const precio = document.getElementById("edit-prod-precio").value;
  const disponible = document.getElementById("edit-prod-disponible").value === "true";
  const archivoImagen = document.getElementById("edit-prod-imagen").files?.[0] || null;

  const errorProd = validarProducto({ nombre, precio }, false);
  if (errorProd) {
    mostrarToast(errorProd, "aviso");
    return;
  }

  const errorImg = validarImagenProducto(archivoImagen, false);
  if (errorImg) {
    mostrarToast(errorImg, "aviso");
    return;
  }

  const boton = document.getElementById("btn-actualizar-producto");
  boton.disabled = true;

  try {
    await actualizarProducto(codigo, { nombre, precio, disponible });
    if (archivoImagen) {
      await reemplazarImagenProducto(codigo, archivoImagen);
    }
    cerrarModal("modal-editar-producto");
    mostrarToast(`Producto #${codigo} actualizado correctamente.`, "exito");
    await cargarProductos();
  } catch (error) {
    mostrarToast(error.message || "No se pudo actualizar el producto.", "error");
  } finally {
    boton.disabled = false;
  }
}

/**
 * Envía PUT /api/productos/menu con los códigos seleccionados en los checkboxes.
 */
async function manejarArmarMenu() {
  const checkboxes = document.querySelectorAll(".chk-menu-item:checked");
  const codigos = Array.from(checkboxes).map((chk) => Number(chk.value));

  if (codigos.length === 0) {
    mostrarToast("Debes seleccionar al menos un producto para armar el menú.", "aviso");
    return;
  }

  const boton = document.getElementById("btn-armar-menu");
  boton.disabled = true;

  try {
    await armarMenu(codigos);
    mostrarToast(`Menú actualizado con ${codigos.length} producto(s) disponibles.`, "exito");
    await cargarProductos();
  } catch (error) {
    mostrarToast(error.message || "No se pudo actualizar el menú en lote.", "error");
  } finally {
    boton.disabled = false;
  }
}

/* ============================================================================
   SECCIÓN 5: INICIALIZACIÓN GENERAL
   ============================================================================ */

async function inicializarPanelTrabajador() {
  const sesionActual = await requerirRol(ROLES.TRABAJADOR);
  if (!sesionActual) {
    return;
  }

  document.getElementById("trabajador-info").textContent =
    `${sesionActual.nombreCompleto} (${sesionActual.correo})`;

  document.getElementById("btn-cerrar-sesion").addEventListener("click", cerrarSesion);
  inicializarPestanas();

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
  document.getElementById("select-pedido-listo").addEventListener("change", (e) => {
    mostrarResumenPedidoRetiro(e.target.value);
  });
  document.getElementById("btn-comprobar-codigo").addEventListener("click", manejarComprobarCodigo);
  document.getElementById("btn-confirmar-entrega").addEventListener("click", manejarConfirmarEntrega);

  // Eventos de menú
  document.getElementById("form-nuevo-producto").addEventListener("submit", manejarCrearProducto);
  document.getElementById("form-editar-producto").addEventListener("submit", manejarEditarProducto);
  document.getElementById("tabla-menu-body").addEventListener("click", manejarAccionesTablaMenu);
  document.getElementById("btn-armar-menu").addEventListener("click", manejarArmarMenu);
  document.getElementById("filtro-menu-texto").addEventListener("input", renderizarTablaMenu);
  document.getElementById("filtro-menu-tipo").addEventListener("change", renderizarTablaMenu);
  document.getElementById("filtro-menu-disp").addEventListener("change", renderizarTablaMenu);

  // Carga inicial contra el backend real
  await Promise.all([cargarPedidos(), cargarProductos()]);

  // Refresco automático cada 15 segundos mientras no haya un modal abierto
  timerAutoRefresco = setInterval(() => {
    const hayModalAbierto = document.querySelector(".modal-backdrop.open");
    if (!hayModalAbierto) {
      cargarPedidos();
    }
  }, APP_CONFIG.AUTO_REFRESH_MS);

  window.addEventListener("beforeunload", () => {
    if (timerAutoRefresco) {
      clearInterval(timerAutoRefresco);
    }
  });
}

document.addEventListener("DOMContentLoaded", inicializarPanelTrabajador);
