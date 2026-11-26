/**
 * Archivo: menu.js
 * Propósito: Página principal del cliente (cliente/menu.html):
 * - HU-CLI-01 Consultar el menú con productos disponibles y precios.
 * - HU-CLI-02 Seleccionar productos y cantidades (carrito).
 * - HU-CLI-03 Revisar el importe total antes de confirmar.
 * - HU-CLI-04 Validar la selección (al menos un producto, cantidades enteras positivas,
 *             productos aún disponibles).
 * - HU-CLI-05 Confirmar el pedido y obtener el código de retiro.
 */

import { TIPOS_PRODUCTO } from "../config.js";
import { requerirCliente } from "../services/authService.js";
import { confirmarPedido, obtenerLimiteCantidad, obtenerMenu } from "../services/pedidoService.js";
import { Carrito } from "../utils/carrito.js";
import { inicializarEncabezado } from "../utils/encabezado.js";
import {
  abrirDialogo, crearBadgeEstado, escaparHtml, formatearMoneda, mostrarMensajeFormulario, mostrarToast
} from "../utils/ui.js";

const IMAGEN_POR_TIPO = {
  bebida: "../admin/img/placeholder-bebida.svg",
  alimento: "../admin/img/placeholder-alimento.svg"
};

const estado = {
  /** @type {Array<Object>} */
  menu: [],
  /** @type {Carrito|null} */
  carrito: null,
  filtroTipo: "todos",
  busqueda: ""
};

// ------------------------------------------------------------------
// Menú (HU-CLI-01)
// ------------------------------------------------------------------

/**
 * @returns {Array<Object>} Productos del menú que cumplen el filtro y la búsqueda.
 */
function productosFiltrados() {
  const texto = estado.busqueda.trim().toLowerCase();
  return estado.menu.filter((p) =>
    (estado.filtroTipo === "todos" || p.tipoProducto === estado.filtroTipo)
    && (!texto || p.nombre.toLowerCase().includes(texto)));
}

/**
 * @param {Object} producto - Producto del menú.
 * @returns {string} Marcado de la tarjeta del producto.
 */
function tarjetaProducto(producto) {
  const placeholder = IMAGEN_POR_TIPO[producto.tipoProducto] || IMAGEN_POR_TIPO.alimento;
  const imagen = producto.imagenUrl || placeholder;
  const enCarrito = estado.carrito.cantidadDe(producto.codigoProducto);
  return `
    <article class="producto-card">
      <img class="producto-imagen" src="${escaparHtml(imagen)}" data-placeholder="${escaparHtml(placeholder)}"
        alt="${escaparHtml(producto.nombre)}" loading="lazy" />
      <div class="producto-info">
        <span class="producto-tipo">${escaparHtml(TIPOS_PRODUCTO[producto.tipoProducto] || producto.tipoProducto)}</span>
        <h3>${escaparHtml(producto.nombre)}</h3>
        <div class="producto-pie">
          <strong class="producto-precio">${formatearMoneda(producto.precio)}</strong>
          <button type="button" class="btn btn-primario btn-agregar" data-codigo="${producto.codigoProducto}"
            aria-label="Agregar ${escaparHtml(producto.nombre)} al carrito">
            ${enCarrito > 0 ? `Agregar (${enCarrito})` : "Agregar"}
          </button>
        </div>
      </div>
    </article>`;
}

/** Dibuja la grilla del menú según el filtro activo. */
function renderizarMenu() {
  const grilla = document.getElementById("grilla-menu");
  const lista = productosFiltrados();
  if (estado.menu.length === 0) {
    grilla.innerHTML = '<p class="estado-vacio">Por ahora no hay productos disponibles. Vuelve en unos minutos.</p>';
    return;
  }
  if (lista.length === 0) {
    grilla.innerHTML = '<p class="estado-vacio">No encontramos productos con ese criterio.</p>';
    return;
  }
  grilla.innerHTML = lista.map(tarjetaProducto).join("");
}

/**
 * Carga el menú del servidor y sincroniza el carrito con disponibilidad y precios vigentes.
 *
 * @param {boolean} [avisar=true] - Mostrar avisos si el carrito cambió.
 */
async function cargarMenu(avisar = true) {
  const grilla = document.getElementById("grilla-menu");
  try {
    estado.menu = await obtenerMenu();
  } catch (error) {
    grilla.innerHTML = `<p class="estado-vacio estado-error">${escaparHtml(error.message)}</p>`;
    return;
  }
  const avisos = estado.carrito.sincronizarConMenu(estado.menu);
  if (avisar) {
    avisos.forEach((aviso) => mostrarToast(aviso, "aviso"));
  }
  renderizarMenu();
  renderizarCarrito();
}

// ------------------------------------------------------------------
// Carrito (HU-CLI-02, HU-CLI-03)
// ------------------------------------------------------------------

/**
 * @param {Object} linea - Línea del carrito con subtotal.
 * @returns {string} Marcado de la línea.
 */
function lineaCarrito(linea) {
  return `
    <li class="carrito-linea">
      <div class="carrito-linea-info">
        <span class="carrito-linea-nombre">${escaparHtml(linea.nombre)}</span>
        <span class="carrito-linea-precio">${formatearMoneda(linea.precio)} c/u</span>
      </div>
      <div class="cantidad-control" role="group" aria-label="Cantidad de ${escaparHtml(linea.nombre)}">
        <button type="button" class="btn-cantidad" data-accion="restar" data-codigo="${linea.codigoProducto}"
          aria-label="Quitar una unidad">−</button>
        <input type="number" class="input-cantidad" min="1" step="1" inputmode="numeric"
          value="${linea.cantidad}" data-codigo="${linea.codigoProducto}" aria-label="Cantidad" />
        <button type="button" class="btn-cantidad" data-accion="sumar" data-codigo="${linea.codigoProducto}"
          aria-label="Agregar una unidad">+</button>
      </div>
      <span class="carrito-linea-subtotal">${formatearMoneda(linea.subtotal)}</span>
      <button type="button" class="btn-quitar" data-accion="quitar" data-codigo="${linea.codigoProducto}"
        aria-label="Quitar ${escaparHtml(linea.nombre)} del carrito">✕</button>
    </li>`;
}

/** Dibuja el carrito, el total referencial y el contador del encabezado. */
function renderizarCarrito() {
  const lista = document.getElementById("lista-carrito");
  const lineas = estado.carrito.obtenerLineas();
  const vacio = lineas.length === 0;

  lista.innerHTML = vacio
    ? '<li class="estado-vacio">Tu carrito está vacío. Agrega productos del menú.</li>'
    : lineas.map(lineaCarrito).join("");

  document.getElementById("total-carrito").textContent = formatearMoneda(estado.carrito.importeTotal());
  document.getElementById("contador-carrito").textContent = String(estado.carrito.totalUnidades());
  document.getElementById("btn-revisar").disabled = vacio;
  document.getElementById("btn-vaciar").disabled = vacio;
}

/** Re-dibuja el menú (contadores de "Agregar") y el carrito. */
function refrescarVista() {
  renderizarMenu();
  renderizarCarrito();
}

/** Eventos de la grilla del menú y del carrito (delegación de eventos). */
function configurarEventosCarrito() {
  // Si la imagen del producto no existe en el servidor, se muestra la ilustración de su tipo
  document.getElementById("grilla-menu").addEventListener("error", (evento) => {
    const img = evento.target;
    if (img.tagName === "IMG" && !img.dataset.respaldo) {
      img.dataset.respaldo = "1";
      img.src = img.dataset.placeholder;
    }
  }, true);

  document.getElementById("grilla-menu").addEventListener("click", (evento) => {
    const boton = evento.target.closest(".btn-agregar");
    if (!boton) {
      return;
    }
    const producto = estado.menu.find((p) => p.codigoProducto === Number(boton.dataset.codigo));
    if (!producto) {
      return;
    }
    const error = estado.carrito.agregar(producto);
    if (error) {
      mostrarToast(error, "aviso");
    } else {
      mostrarToast(`${producto.nombre} agregado al carrito.`, "exito");
    }
    refrescarVista();
  });

  const lista = document.getElementById("lista-carrito");
  lista.addEventListener("click", (evento) => {
    const boton = evento.target.closest("[data-accion]");
    if (!boton) {
      return;
    }
    const codigo = Number(boton.dataset.codigo);
    const actual = estado.carrito.cantidadDe(codigo);
    let aviso = null;
    if (boton.dataset.accion === "sumar") {
      aviso = estado.carrito.cambiarCantidad(codigo, actual + 1);
    } else if (boton.dataset.accion === "restar") {
      aviso = estado.carrito.cambiarCantidad(codigo, actual - 1);
    } else {
      estado.carrito.quitar(codigo);
    }
    if (aviso) {
      mostrarToast(aviso, "aviso");
    }
    refrescarVista();
  });

  lista.addEventListener("change", (evento) => {
    if (!evento.target.classList.contains("input-cantidad")) {
      return;
    }
    const aviso = estado.carrito.cambiarCantidad(Number(evento.target.dataset.codigo), evento.target.value);
    if (aviso) {
      mostrarToast(aviso, "aviso");
    }
    refrescarVista();
  });

  document.getElementById("btn-vaciar").addEventListener("click", () => {
    estado.carrito.vaciar();
    refrescarVista();
  });
}

// ------------------------------------------------------------------
// Revisión y confirmación (HU-CLI-04, HU-CLI-05)
// ------------------------------------------------------------------

/**
 * Validaciones previas a confirmar (HU-CLI-04). El servidor vuelve a validar todo.
 *
 * @returns {string|null} Mensaje de error o null si la selección es válida.
 */
function validarSeleccion() {
  const lineas = estado.carrito.obtenerLineas();
  if (lineas.length === 0) {
    return "Debes seleccionar al menos un producto.";
  }
  if (lineas.some((l) => !Number.isInteger(l.cantidad) || l.cantidad <= 0)) {
    return "Las cantidades deben ser números enteros positivos.";
  }
  return null;
}

/** Abre el diálogo de revisión con el resumen y el total (HU-CLI-03). */
async function abrirRevision() {
  // Se refresca el menú para no confirmar productos que dejaron de estar disponibles
  await cargarMenu(true);
  const error = validarSeleccion();
  if (error) {
    mostrarToast(error, "aviso");
    return;
  }

  const lineas = estado.carrito.obtenerLineas();
  document.getElementById("resumen-revision").innerHTML = lineas.map((l) => `
    <tr>
      <td>${escaparHtml(l.nombre)}</td>
      <td class="num">${l.cantidad}</td>
      <td class="num">${formatearMoneda(l.precio)}</td>
      <td class="num">${formatearMoneda(l.subtotal)}</td>
    </tr>`).join("");
  document.getElementById("total-revision").textContent = formatearMoneda(estado.carrito.importeTotal());
  mostrarMensajeFormulario(document.getElementById("revision-error"), "");
  abrirDialogo(document.getElementById("dialogo-revision"));
}

/**
 * Muestra el pedido confirmado con su código de retiro (HU-CLI-05).
 *
 * @param {Object} pedido - PedidoDto devuelto por POST /api/pedidos.
 */
function mostrarConfirmacion(pedido) {
  document.getElementById("conf-codigo").textContent = pedido.codigoRetiro || "—";
  document.getElementById("conf-numero").textContent = `#${pedido.idPedido}`;
  document.getElementById("conf-estado").innerHTML = crearBadgeEstado(pedido.estado);
  document.getElementById("conf-total").textContent = formatearMoneda(pedido.importeTotal);
  document.getElementById("conf-items").innerHTML = (pedido.items || []).map((i) => `
    <li><span>${i.cantidad} × ${escaparHtml(i.nombre)}</span><span>${formatearMoneda(i.subtotal)}</span></li>`)
    .join("");
  abrirDialogo(document.getElementById("dialogo-confirmacion"));
}

/** Envía el pedido al servidor. */
async function confirmar() {
  const boton = document.getElementById("btn-confirmar");
  const cajaError = document.getElementById("revision-error");
  boton.disabled = true;
  boton.textContent = "Enviando...";
  try {
    const pedido = await confirmarPedido(estado.carrito.obtenerLineas());
    document.getElementById("dialogo-revision").close();
    estado.carrito.vaciar();
    refrescarVista();
    mostrarConfirmacion(pedido);
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      window.location.href = "index.html";
      return;
    }
    mostrarMensajeFormulario(cajaError, error.message);
    // Si algún producto dejó de estar disponible (400/409), se actualiza el carrito
    if (error.status === 400 || error.status === 409) {
      await cargarMenu(true);
    }
  } finally {
    boton.disabled = false;
    boton.textContent = "Confirmar pedido";
  }
}

function configurarEventosPedido() {
  document.getElementById("btn-revisar").addEventListener("click", abrirRevision);
  document.getElementById("btn-confirmar").addEventListener("click", confirmar);
  document.getElementById("btn-seguir").addEventListener("click", () => {
    document.getElementById("dialogo-revision").close();
  });
  document.getElementById("btn-nuevo-pedido").addEventListener("click", () => {
    document.getElementById("dialogo-confirmacion").close();
  });
}

function configurarFiltros() {
  document.querySelectorAll(".filtro-tipo").forEach((boton) => {
    boton.addEventListener("click", () => {
      estado.filtroTipo = boton.dataset.tipo;
      document.querySelectorAll(".filtro-tipo").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === boton));
      });
      renderizarMenu();
    });
  });
  document.getElementById("buscar-producto").addEventListener("input", (evento) => {
    estado.busqueda = evento.target.value;
    renderizarMenu();
  });
}

async function inicializar() {
  const sesion = await requerirCliente();
  if (!sesion) {
    return;
  }
  inicializarEncabezado(sesion);

  const bienvenida = sessionStorage.getItem("cafeteria.bienvenida");
  if (bienvenida) {
    sessionStorage.removeItem("cafeteria.bienvenida");
    mostrarToast(bienvenida, "exito");
  }

  const limite = await obtenerLimiteCantidad();
  estado.carrito = new Carrito(sesion.correo, limite);
  configurarFiltros();
  configurarEventosCarrito();
  configurarEventosPedido();
  await cargarMenu(true);
}

document.addEventListener("DOMContentLoaded", inicializar);
