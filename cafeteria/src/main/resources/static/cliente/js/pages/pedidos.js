/**
 * Archivo: pedidos.js
 * Propósito: "Mis pedidos" (cliente/pedidos.html) — HU-CLI-06 Consultar el estado del pedido.
 * Lista los pedidos del cliente con su estado, código de retiro y detalle, y se
 * actualiza sola cada 15 segundos para que el cliente sepa cuándo está listo.
 */

import { APP_CONFIG, DESCRIPCION_ESTADO, ESTADOS_PEDIDO, ETIQUETAS_ESTADO } from "../config.js";
import { requerirCliente } from "../services/authService.js";
import { obtenerMisPedidos } from "../services/pedidoService.js";
import { inicializarEncabezado } from "../utils/encabezado.js";
import { crearBadgeEstado, escaparHtml, formatearFecha, formatearMoneda, mostrarToast } from "../utils/ui.js";

/** Estados de los pedidos en la carga anterior, para avisar cuando cambian. */
const estadosPrevios = new Map();
let filtroActivo = "activos";

/**
 * Línea de progreso pendiente → en preparación → listo → entregado (RN-NEG-06).
 *
 * @param {string} estadoActual - Estado del pedido.
 * @returns {string} Marcado de la línea de progreso.
 */
function lineaDeProgreso(estadoActual) {
  const indice = ESTADOS_PEDIDO.indexOf(estadoActual);
  return `<ol class="progreso" aria-label="Avance del pedido">${ESTADOS_PEDIDO.map((e, i) => {
    let clase = "";
    if (i < indice) {
      clase = "completo";
    } else if (i === indice) {
      clase = "actual";
    }
    const aria = i === indice ? ' aria-current="step"' : "";
    return `<li class="${clase}"${aria}>${escaparHtml(ETIQUETAS_ESTADO[e])}</li>`;
  }).join("")}</ol>`;
}

/**
 * @param {Object} pedido - PedidoDto del cliente.
 * @returns {string} Tarjeta del pedido.
 */
function tarjetaPedido(pedido) {
  const destacado = pedido.estado === "listo" ? " pedido-listo" : "";
  const items = (pedido.items || []).map((i) => `
    <tr>
      <td>${escaparHtml(i.nombre)}</td>
      <td class="num">${i.cantidad}</td>
      <td class="num">${formatearMoneda(i.precioUnitario)}</td>
      <td class="num">${formatearMoneda(i.subtotal)}</td>
    </tr>`).join("");

  return `
    <article class="pedido-card${destacado}">
      <header class="pedido-cabecera">
        <div>
          <h3>Pedido #${pedido.idPedido}</h3>
          <span class="texto-suave">${escaparHtml(formatearFecha(pedido.fechaRegistro))}</span>
        </div>
        ${crearBadgeEstado(pedido.estado)}
      </header>
      <p class="pedido-mensaje">${escaparHtml(DESCRIPCION_ESTADO[pedido.estado] || "")}</p>
      ${lineaDeProgreso(pedido.estado)}
      <div class="pedido-codigo">
        <span>Código de retiro</span>
        <strong>${escaparHtml(pedido.codigoRetiro || "—")}</strong>
      </div>
      <details class="pedido-detalle">
        <summary>Ver detalle (${(pedido.items || []).length} productos)</summary>
        <table class="tabla">
          <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Subtotal</th></tr></thead>
          <tbody>${items}</tbody>
        </table>
      </details>
      <footer class="pedido-total">Total <strong>${formatearMoneda(pedido.importeTotal)}</strong></footer>
    </article>`;
}

/**
 * Avisa al cliente cuando un pedido pasó a "listo" desde la última actualización.
 *
 * @param {Array<Object>} pedidos - Pedidos recién cargados.
 */
function avisarCambios(pedidos) {
  pedidos.forEach((p) => {
    const previo = estadosPrevios.get(p.idPedido);
    if (previo && previo !== p.estado && p.estado === "listo") {
      mostrarToast(`¡Tu pedido #${p.idPedido} está listo para retirar!`, "exito");
    }
    estadosPrevios.set(p.idPedido, p.estado);
  });
}

/** Carga y dibuja los pedidos según el filtro (en curso / todos). */
async function cargarPedidos() {
  const contenedor = document.getElementById("lista-pedidos");
  try {
    const pedidos = await obtenerMisPedidos(50);
    avisarCambios(pedidos);
    const visibles = filtroActivo === "activos"
      ? pedidos.filter((p) => p.estado !== "entregado")
      : pedidos;

    if (visibles.length === 0) {
      contenedor.innerHTML = filtroActivo === "activos"
        ? '<p class="estado-vacio">No tienes pedidos en curso. <a href="menu.html">Haz un pedido</a>.</p>'
        : '<p class="estado-vacio">Aún no has realizado pedidos. <a href="menu.html">Ver el menú</a>.</p>';
    } else {
      contenedor.innerHTML = visibles.map(tarjetaPedido).join("");
    }
    document.getElementById("ultima-actualizacion").textContent =
      `Actualizado: ${new Date().toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      window.location.href = "index.html";
      return;
    }
    contenedor.innerHTML = `<p class="estado-vacio estado-error">${escaparHtml(error.message)}</p>`;
  }
}

async function inicializar() {
  const sesion = await requerirCliente();
  if (!sesion) {
    return;
  }
  inicializarEncabezado(sesion);

  document.querySelectorAll(".filtro-pedidos").forEach((boton) => {
    boton.addEventListener("click", () => {
      filtroActivo = boton.dataset.filtro;
      document.querySelectorAll(".filtro-pedidos").forEach((b) => {
        b.setAttribute("aria-pressed", String(b === boton));
      });
      cargarPedidos();
    });
  });
  document.getElementById("btn-actualizar").addEventListener("click", cargarPedidos);

  await cargarPedidos();
  setInterval(() => {
    if (!document.hidden) {
      cargarPedidos();
    }
  }, APP_CONFIG.AUTO_REFRESH_MS);
}

document.addEventListener("DOMContentLoaded", inicializar);
