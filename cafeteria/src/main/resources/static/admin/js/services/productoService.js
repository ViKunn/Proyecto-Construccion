/**
 * Archivo: productoService.js
 * Propósito: Gestionar las operaciones del menú de la cafetería
 * (HU-PER-01: registrar, HU-PER-02: actualizar, HU-PER-03: cambiar disponibilidad).
 * Respeta RN-NEG-02 y RN-NEG-04 (los cambios no alteran pedidos anteriores).
 */

import { APP_CONFIG } from "../config.js";
import { request } from "../api/httpClient.js";
import { cargarMockDB, guardarMockDB } from "../api/mockData.js";

/**
 * Obtiene el catálogo completo de productos del menú (disponibles y no disponibles).
 *
 * @returns {Promise<Array<Object>>} Lista de productos.
 */
export async function listarProductos() {
  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    return [...db.productos];
  }
  return request("/productos");
}

/**
 * Registra un nuevo producto en el menú (HU-PER-01).
 *
 * @param {Object} nuevoProducto - { codigoProducto, nombre, precio, disponible, tipoProducto }.
 * @returns {Promise<Object>} Producto registrado.
 */
export async function crearProducto(nuevoProducto) {
  const payload = {
    codigoProducto: String(nuevoProducto.codigoProducto).trim().toUpperCase(),
    nombre: String(nuevoProducto.nombre).trim(),
    precio: Number(nuevoProducto.precio),
    disponible: nuevoProducto.disponible,
    tipoProducto: nuevoProducto.tipoProducto
  };

  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const existe = db.productos.some(
      (p) => p.codigoProducto.toLowerCase() === payload.codigoProducto.toLowerCase()
    );
    if (existe) {
      throw new Error(`Ya existe un producto con el código ${payload.codigoProducto}.`);
    }

    db.productos.push(payload);
    guardarMockDB(db);
    return payload;
  }

  return request("/productos", {
    method: "POST",
    body: payload
  });
}

/**
 * Actualiza nombre, precio, tipo o disponibilidad de un producto existente (HU-PER-02).
 * Importante (RN-NEG-04): modificar el precio aquí no altera el precioUnitario
 * guardado en los detalles de pedidos ya confirmados.
 *
 * @param {string} codigoProducto - Clave primaria del producto a actualizar.
 * @param {Object} datosActualizados - { nombre, precio, tipoProducto, disponible }.
 * @returns {Promise<Object>} Producto actualizado.
 */
export async function actualizarProducto(codigoProducto, datosActualizados) {
  const payload = {
    nombre: String(datosActualizados.nombre).trim(),
    precio: Number(datosActualizados.precio),
    tipoProducto: datosActualizados.tipoProducto,
    disponible: datosActualizados.disponible
  };

  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const indice = db.productos.findIndex((p) => p.codigoProducto === codigoProducto);
    if (indice === -1) {
      throw new Error("El producto que intentas actualizar no existe.");
    }

    db.productos[indice] = {
      ...db.productos[indice],
      ...payload
    };
    guardarMockDB(db);
    return db.productos[indice];
  }

  return request(`/productos/${encodeURIComponent(codigoProducto)}`, {
    method: "PUT",
    body: payload
  });
}

/**
 * Cambia exclusivamente la disponibilidad de un producto ('si' o 'no') sin eliminarlo (HU-PER-03).
 *
 * @param {string} codigoProducto - Código del producto.
 * @param {"si"|"no"} nuevaDisponibilidad - Nuevo estado de disponibilidad.
 * @returns {Promise<Object>} Producto actualizado.
 */
export async function cambiarDisponibilidadProducto(codigoProducto, nuevaDisponibilidad) {
  if (APP_CONFIG.USE_MOCK) {
    const db = cargarMockDB();
    const producto = db.productos.find((p) => p.codigoProducto === codigoProducto);
    if (!producto) {
      throw new Error("No se encontró el producto seleccionado.");
    }

    producto.disponible = nuevaDisponibilidad;
    guardarMockDB(db);
    return producto;
  }

  return request(`/productos/${encodeURIComponent(codigoProducto)}/disponibilidad`, {
    method: "PATCH",
    body: { disponible: nuevaDisponibilidad }
  });
}
