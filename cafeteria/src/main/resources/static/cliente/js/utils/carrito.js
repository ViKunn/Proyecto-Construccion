/**
 * Archivo: carrito.js
 * Propósito: Carrito de compras del cliente (HU-CLI-02 y HU-CLI-03).
 * Se guarda en localStorage por cuenta de cliente, así no se pierde al recargar
 * la página. Los totales mostrados son referenciales: el importe oficial lo
 * calcula el servidor al confirmar (RN-NEG-03).
 */

import { APP_CONFIG } from "../config.js";

/**
 * Redondea a centavos evitando errores de punto flotante.
 *
 * @param {number} valor - Importe.
 * @returns {number} Importe redondeado a 2 decimales.
 */
function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

export class Carrito {
  /**
   * @param {string} correoCliente - Identifica el carrito de cada cuenta en el navegador.
   * @param {number} [limitePorProducto=-1] - Límite del servidor; -1 = sin límite.
   */
  constructor(correoCliente, limitePorProducto = -1) {
    this.clave = `${APP_CONFIG.CLAVE_CARRITO}.${String(correoCliente || "anonimo").toLowerCase()}`;
    this.limitePorProducto = limitePorProducto > 0 ? limitePorProducto : APP_CONFIG.MAX_CANTIDAD_TECNICA;
    /** @type {Map<number, {codigoProducto:number, nombre:string, precio:number, cantidad:number}>} */
    this.lineas = new Map();
    this.cargar();
  }

  /** Lee el carrito guardado, descartando datos corruptos. */
  cargar() {
    this.lineas.clear();
    try {
      const guardado = JSON.parse(localStorage.getItem(this.clave) || "[]");
      if (Array.isArray(guardado)) {
        guardado.forEach((l) => {
          const cantidad = Number(l.cantidad);
          if (Number.isInteger(l.codigoProducto) && Number.isInteger(cantidad) && cantidad > 0) {
            this.lineas.set(l.codigoProducto, {
              codigoProducto: l.codigoProducto,
              nombre: String(l.nombre || ""),
              precio: Number(l.precio) || 0,
              cantidad: Math.min(cantidad, this.limitePorProducto)
            });
          }
        });
      }
    } catch {
      this.lineas.clear();
    }
  }

  /** Persiste el carrito en localStorage. */
  guardar() {
    try {
      localStorage.setItem(this.clave, JSON.stringify([...this.lineas.values()]));
    } catch {
      // Si el navegador bloquea el almacenamiento, el carrito sigue funcionando en memoria
    }
  }

  /**
   * Agrega una unidad de un producto (o la cantidad indicada).
   *
   * @param {Object} producto - { codigoProducto, nombre, precio }.
   * @param {number} [cantidad=1] - Unidades a sumar.
   * @returns {string|null} Mensaje si no se pudo agregar; null si se agregó.
   */
  agregar(producto, cantidad = 1) {
    const actual = this.lineas.get(producto.codigoProducto);
    if (!actual && this.lineas.size >= APP_CONFIG.MAX_LINEAS) {
      return `Un pedido puede tener como máximo ${APP_CONFIG.MAX_LINEAS} productos distintos.`;
    }
    const nueva = (actual?.cantidad || 0) + cantidad;
    if (nueva > this.limitePorProducto) {
      return `Puedes pedir hasta ${this.limitePorProducto} unidades de "${producto.nombre}".`;
    }
    this.lineas.set(producto.codigoProducto, {
      codigoProducto: producto.codigoProducto,
      nombre: producto.nombre,
      precio: Number(producto.precio),
      cantidad: nueva
    });
    this.guardar();
    return null;
  }

  /**
   * Fija la cantidad de una línea; 0 o menos la elimina (RN-NEG-01: solo enteros positivos).
   *
   * @param {number} codigoProducto - Producto a modificar.
   * @param {number} cantidad - Nueva cantidad.
   * @returns {string|null} Mensaje si se ajustó al límite; null en caso contrario.
   */
  cambiarCantidad(codigoProducto, cantidad) {
    const linea = this.lineas.get(codigoProducto);
    if (!linea) {
      return null;
    }
    const entero = Math.floor(Number(cantidad));
    if (!Number.isFinite(entero) || entero <= 0) {
      this.lineas.delete(codigoProducto);
      this.guardar();
      return null;
    }
    let aviso = null;
    linea.cantidad = entero;
    if (entero > this.limitePorProducto) {
      linea.cantidad = this.limitePorProducto;
      aviso = `Puedes pedir hasta ${this.limitePorProducto} unidades de "${linea.nombre}".`;
    }
    this.guardar();
    return aviso;
  }

  /** @param {number} codigoProducto - Producto a quitar del carrito. */
  quitar(codigoProducto) {
    this.lineas.delete(codigoProducto);
    this.guardar();
  }

  /** Vacía el carrito (después de confirmar el pedido). */
  vaciar() {
    this.lineas.clear();
    this.guardar();
  }

  /**
   * Sincroniza el carrito con el menú vigente (RN-NEG-02 y precios actuales):
   * quita productos que ya no están disponibles y actualiza nombres y precios.
   *
   * @param {Array<Object>} menu - Productos de GET /api/productos/menu.
   * @returns {string[]} Avisos para el cliente sobre los cambios realizados.
   */
  sincronizarConMenu(menu) {
    const porCodigo = new Map(menu.map((p) => [p.codigoProducto, p]));
    const avisos = [];
    [...this.lineas.values()].forEach((linea) => {
      const producto = porCodigo.get(linea.codigoProducto);
      if (!producto) {
        this.lineas.delete(linea.codigoProducto);
        avisos.push(`"${linea.nombre}" ya no está disponible y se quitó de tu carrito.`);
        return;
      }
      if (Number(producto.precio) !== linea.precio) {
        avisos.push(`El precio de "${producto.nombre}" cambió a $${Number(producto.precio).toFixed(2)}.`);
      }
      linea.nombre = producto.nombre;
      linea.precio = Number(producto.precio);
    });
    this.guardar();
    return avisos;
  }

  /** @returns {Array<Object>} Líneas con su subtotal (precio × cantidad). */
  obtenerLineas() {
    return [...this.lineas.values()].map((l) => ({ ...l, subtotal: redondear(l.precio * l.cantidad) }));
  }

  /** @param {number} codigoProducto - Producto. @returns {number} Unidades en el carrito. */
  cantidadDe(codigoProducto) {
    return this.lineas.get(codigoProducto)?.cantidad || 0;
  }

  /** @returns {number} Total de unidades en el carrito. */
  totalUnidades() {
    return [...this.lineas.values()].reduce((suma, l) => suma + l.cantidad, 0);
  }

  /** @returns {number} Importe total referencial (HU-CLI-03). */
  importeTotal() {
    return redondear(this.obtenerLineas().reduce((suma, l) => suma + l.subtotal, 0));
  }

  /** @returns {boolean} true si no tiene productos. */
  estaVacio() {
    return this.lineas.size === 0;
  }
}
