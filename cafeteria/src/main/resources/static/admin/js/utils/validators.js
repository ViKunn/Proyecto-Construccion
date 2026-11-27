/**
 * Archivo: validators.js
 * Propósito: Validaciones del lado del cliente alineadas con el Anexo A de la
 * documentación oficial de la API REST (cédula ecuatoriana módulo 10, nombres,
 * contraseñas, productos, imágenes y códigos de retiro).
 */

import { APP_CONFIG, TIPOS_PRODUCTO } from "../config.js";

/**
 * Valida que una cadena tenga formato básico de correo electrónico (máx. 254 caracteres).
 *
 * @param {string} correo - Correo ingresado.
 * @returns {boolean} true si es válido.
 */
export function esCorreoValido(correo) {
  const limpio = String(correo || "").trim();
  if (limpio.length === 0 || limpio.length > 254) {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio);
}

/**
 * Valida nombre o apellido de persona según Anexo A:
 * solo letras (con tildes, ñ, ü), palabras separadas por espacio, de 2 a 50 caracteres.
 *
 * @param {string} texto - Nombre o apellido.
 * @returns {boolean} true si cumple las reglas.
 */
export function esNombrePersonaValido(texto) {
  const limpio = String(texto || "").trim().replace(/\s+/g, " ");
  if (limpio.length < 2 || limpio.length > 50) {
    return false;
  }
  return /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?: [A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/.test(limpio);
}

/**
 * Valida una cédula ecuatoriana de 10 dígitos:
 * provincia 01-24 o 30, tercer dígito 0-5 y dígito verificador (módulo 10).
 *
 * @param {string} cedula - Número de cédula.
 * @returns {boolean} true si la cédula es válida.
 */
export function esCedulaEcuatorianaValida(cedula) {
  const limpio = String(cedula || "").trim();
  if (!/^\d{10}$/.test(limpio)) {
    return false;
  }

  const provincia = Number(limpio.slice(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) {
    return false;
  }

  const tercerDigito = Number(limpio[2]);
  if (tercerDigito < 0 || tercerDigito > 5) {
    return false;
  }

  // Algoritmo de verificación módulo 10 para personas naturales en Ecuador
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i += 1) {
    let valor = Number(limpio[i]) * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }

  const residuo = suma % 10;
  const digitoEsperado = residuo === 0 ? 0 : 10 - residuo;
  return digitoEsperado === Number(limpio[9]);
}

/**
 * Valida un archivo de imagen opcional u obligatorio (JPG, PNG o WEBP, hasta 2 MB).
 *
 * @param {File|null|undefined} archivo - Archivo seleccionado en input[type="file"].
 * @param {boolean} [obligatorio=false] - Si true, exige que exista archivo.
 * @returns {string|null} Mensaje de error o null si es válido.
 */
export function validarImagenProducto(archivo, obligatorio = false) {
  if (!archivo) {
    return obligatorio ? "Debes seleccionar una imagen (JPG, PNG o WEBP)." : null;
  }

  const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];
  if (!tiposPermitidos.includes(archivo.type)) {
    return "La imagen debe estar en formato JPG, PNG o WEBP.";
  }

  if (archivo.size > APP_CONFIG.MAX_IMAGEN_BYTES) {
    return "La imagen supera el tamaño máximo permitido de 2 MB.";
  }

  return null;
}

/**
 * Valida los datos de un producto antes de crearlo o editarlo (Anexo A).
 *
 * @param {Object} producto - { nombre, precio, tipoProducto }.
 * @param {boolean} [validarTipo=true] - true al crear (el tipo no cambia al editar).
 * @returns {string|null} Mensaje de error o null si es válido.
 */
export function validarProducto(producto, validarTipo = true) {
  const nombre = String(producto.nombre || "").trim();
  if (nombre.length < 2 || nombre.length > 60) {
    return "El nombre del producto debe tener entre 2 y 60 caracteres.";
  }

  const precioNum = Number(String(producto.precio ?? "").replace(",", "."));
  if (Number.isNaN(precioNum) || precioNum <= 0 || precioNum > 999.99) {
    return "El precio debe ser mayor a 0 y hasta 999.99.";
  }

  // Verifica máximo 2 decimales
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(String(producto.precio).trim())) {
    return "El precio puede tener como máximo 2 decimales.";
  }

  if (validarTipo && !Object.values(TIPOS_PRODUCTO).includes(producto.tipoProducto)) {
    return "El tipo de producto debe ser alimento o bebida.";
  }

  return null;
}

/**
 * Valida el formulario de creación de un trabajador según Anexo A.
 *
 * @param {Object} datos - { nombre, apellido, cedula, correo, contrasena, confirmarContrasena }.
 * @returns {string|null} Mensaje de error o null si todo es correcto.
 */
export function validarNuevoTrabajador(datos) {
  if (!esNombrePersonaValido(datos.nombre)) {
    return "El nombre debe tener entre 2 y 50 letras.";
  }

  if (!esNombrePersonaValido(datos.apellido)) {
    return "El apellido debe tener entre 2 y 50 letras.";
  }

  if (!esCedulaEcuatorianaValida(datos.cedula)) {
    return "La cédula ecuatoriana ingresada no es válida (revisa los 10 dígitos).";
  }

  if (!esCorreoValido(datos.correo)) {
    return "Ingresa un correo electrónico válido.";
  }

  const clave = String(datos.contrasena || "");
  if (clave.length < 8 || !/[A-Za-z]/.test(clave) || !/\d/.test(clave)) {
    return "La contraseña debe tener al menos 8 caracteres, una letra y un número.";
  }

  if (clave !== datos.confirmarContrasena) {
    return "Las contraseñas no coinciden.";
  }

  return null;
}

/**
 * Valida el formato del código de retiro (6 caracteres alfanuméricos sin I, O, 0, 1).
 *
 * @param {string} codigo - Código ingresado por el trabajador.
 * @returns {string|null} Mensaje de error o null si el formato es correcto.
 */
export function validarFormatoCodigoRetiro(codigo) {
  const limpio = String(codigo || "").trim().toUpperCase();
  if (!limpio) {
    return "Ingresa el código de retiro presentado por el cliente.";
  }
  if (!/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(limpio)) {
    return "El código de retiro debe tener 6 caracteres válidos (sin I, O, 0 ni 1).";
  }
  return null;
}

/**
 * Valida el formulario de cambio de contraseña (HU-USU-01 / PUT /api/auth/contrasena):
 * - Contraseña actual obligatoria.
 * - Contraseña nueva de al menos 8 caracteres, con una letra, un número y máx. 72 bytes.
 * - Confirmación coincidente y distinta a la contraseña actual.
 *
 * @param {Object} datos - { contrasenaActual, contrasenaNueva, confirmarContrasena }.
 * @returns {string|null} Mensaje de error o null si todo es válido.
 */
export function validarCambioContrasena(datos) {
  const actual = String(datos.contrasenaActual || "");
  const nueva = String(datos.contrasenaNueva || "");
  const confirmar = String(datos.confirmarContrasena || "");

  if (!actual) {
    return "Debes ingresar tu contraseña actual.";
  }

  if (nueva.length < 8 || !/[A-Za-z]/.test(nueva) || !/\d/.test(nueva)) {
    return "La nueva contraseña debe tener al menos 8 caracteres, una letra y un número.";
  }

  // BCrypt acepta un máximo de 72 bytes en UTF-8
  if (new window.TextEncoder().encode(nueva).length > 72) {
    return "La nueva contraseña supera el límite máximo de 72 bytes.";
  }

  if (nueva !== confirmar) {
    return "La confirmación de la nueva contraseña no coincide.";
  }

  if (actual === nueva) {
    return "La nueva contraseña debe ser diferente a la actual.";
  }

  return null;
}
