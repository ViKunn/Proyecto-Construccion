/**
 * Archivo: productoService.js
 * Propósito: Conectar la Gestión del Menú del Frontend Administrativo con los
 * endpoints reales de ProductoControlador (Spring Boot):
 * - GET   /api/productos
 * - POST  /api/productos (multipart/form-data con imagen opcional)
 * - PATCH /api/productos/{codigo} (nombre, precio y/o disponible)
 * - PUT   /api/productos/{codigo}/imagen (reemplazar imagen)
 * - PUT   /api/productos/menu (armar el menú en lote)
 */

import { request } from "../api/httpClient.js";

/**
 * Obtiene el catálogo completo de productos (disponibles y no disponibles).
 *
 * @param {Object} [filtros={}] - Opcional: { tipo: "bebida"|"alimento", disponible: true|false }.
 * @returns {Promise<Array<Object>>} Lista de ProductoDto.
 */
export async function listarProductos(filtros = {}) {
  const params = new URLSearchParams();
  if (filtros.tipo) {
    params.set("tipo", filtros.tipo);
  }
  if (filtros.disponible !== undefined && filtros.disponible !== "") {
    params.set("disponible", String(filtros.disponible));
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/productos${query}`);
}

/**
 * Crea un nuevo producto en el menú (HU-PER-01).
 * El servidor genera automáticamente codigoProducto y lo crea como disponible = true.
 *
 * @param {Object} datos - { nombre, precio, tipoProducto, imagen (File opcional) }.
 * @returns {Promise<Object>} ProductoDto creado.
 */
export async function crearProducto(datos) {
  const formData = new FormData();
  formData.append("nombre", String(datos.nombre).trim());
  formData.append("precio", String(datos.precio).trim().replace(",", "."));
  formData.append("tipo", datos.tipoProducto);

  if (datos.imagen instanceof File) {
    formData.append("imagen", datos.imagen);
  }

  return request("/productos", {
    method: "POST",
    body: formData
  });
}

/**
 * Modifica parcialmente nombre, precio y/o disponibilidad de un producto (HU-PER-02 / HU-PER-03).
 *
 * @param {number|string} codigoProducto - Código numérico del producto.
 * @param {Object} cambios - Objeto parcial con al menos uno de: { nombre, precio, disponible }.
 * @returns {Promise<Object>} ProductoDto actualizado.
 */
export async function actualizarProducto(codigoProducto, cambios) {
  const payload = {};
  if (cambios.nombre !== undefined) {
    payload.nombre = String(cambios.nombre).trim();
  }
  if (cambios.precio !== undefined) {
    payload.precio = Number(String(cambios.precio).replace(",", "."));
  }
  if (cambios.disponible !== undefined) {
    payload.disponible = Boolean(cambios.disponible);
  }

  return request(`/productos/${encodeURIComponent(codigoProducto)}`, {
    method: "PATCH",
    body: payload
  });
}

/**
 * Reemplaza la imagen de un producto existente mediante multipart/form-data.
 *
 * @param {number|string} codigoProducto - Código numérico del producto.
 * @param {File} archivoImagen - Imagen JPG, PNG o WEBP de hasta 2 MB.
 * @returns {Promise<Object>} ProductoDto con la nueva imagenUrl.
 */
export async function reemplazarImagenProducto(codigoProducto, archivoImagen) {
  const formData = new FormData();
  formData.append("imagen", archivoImagen);

  return request(`/productos/${encodeURIComponent(codigoProducto)}/imagen`, {
    method: "PUT",
    body: formData
  });
}

/**
 * Arma el menú en lote: deja disponibles únicamente los productos cuyos códigos
 * se envían y marca como no disponibles a todos los demás.
 *
 * @param {Array<number>} codigos - Arreglo no vacío de códigos de producto.
 * @returns {Promise<Array<Object>>} Menú resultante (productos disponibles).
 */
export async function armarMenu(codigos) {
  return request("/productos/menu", {
    method: "PUT",
    body: { codigos }
  });
}
