/**
 * Archivo: validators.js
 * Propósito: Validaciones del lado del cliente para dar retroalimentación inmediata.
 * Replican las reglas de ValidadorDatos del backend, que siempre vuelve a validar.
 */

const REGEX_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REGEX_NOMBRE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:[ '-][A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*$/;

/**
 * @param {string} correo - Correo a validar.
 * @returns {boolean} true si tiene formato de correo.
 */
export function esCorreoValido(correo) {
  return REGEX_CORREO.test(String(correo || "").trim());
}

/**
 * Valida una cédula ecuatoriana: provincia 01-24 o 30, tercer dígito 0-5
 * y dígito verificador módulo 10.
 *
 * @param {string} cedula - Cédula de 10 dígitos.
 * @returns {boolean} true si es válida.
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
  if (Number(limpio[2]) > 5) {
    return false;
  }
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
  const esperado = residuo === 0 ? 0 : 10 - residuo;
  return esperado === Number(limpio[9]);
}

/**
 * Política de contraseñas del backend: 8+ caracteres, una letra, un número, máximo 72 bytes.
 *
 * @param {string} contrasena - Contraseña a validar.
 * @returns {string|null} Mensaje de error o null si es válida.
 */
export function errorContrasena(contrasena) {
  const valor = String(contrasena || "");
  if (valor.length < 8 || !/[A-Za-z]/.test(valor) || !/\d/.test(valor)) {
    return "La contraseña debe tener al menos 8 caracteres, una letra y un número.";
  }
  if (new window.TextEncoder().encode(valor).length > 72) {
    return "La contraseña es demasiado larga (máximo 72 bytes).";
  }
  return null;
}

/**
 * Valida el formulario de registro de cliente (HU-CLI-07).
 *
 * @param {Object} datos - { nombre, apellido, cedula, celular, correo, contrasena, confirmar }.
 * @returns {Object<string,string>} Mapa campo -> mensaje; vacío si todo es válido.
 */
export function validarRegistro(datos) {
  const errores = {};
  if (!REGEX_NOMBRE.test(String(datos.nombre || "").trim())) {
    errores.nombre = "Ingresa un nombre válido (solo letras).";
  }
  if (!REGEX_NOMBRE.test(String(datos.apellido || "").trim())) {
    errores.apellido = "Ingresa un apellido válido (solo letras).";
  }
  if (!esCedulaEcuatorianaValida(datos.cedula)) {
    errores.cedula = "La cédula no es válida.";
  }
  if (!/^09\d{8}$/.test(String(datos.celular || "").trim())) {
    errores.celular = "El celular debe tener 10 dígitos y empezar con 09.";
  }
  if (!esCorreoValido(datos.correo)) {
    errores.correo = "Ingresa un correo válido.";
  }
  const errorClave = errorContrasena(datos.contrasena);
  if (errorClave) {
    errores.contrasena = errorClave;
  } else if (datos.contrasena !== datos.confirmar) {
    errores.confirmar = "Las contraseñas no coinciden.";
  }
  return errores;
}

/**
 * Valida el formulario de cambio de contraseña (HU-USU-01).
 *
 * @param {Object} datos - { contrasenaActual, contrasenaNueva, confirmar }.
 * @returns {string|null} Mensaje de error o null.
 */
export function validarCambioContrasena(datos) {
  if (!datos.contrasenaActual) {
    return "Ingresa tu contraseña actual.";
  }
  const errorNueva = errorContrasena(datos.contrasenaNueva);
  if (errorNueva) {
    return errorNueva;
  }
  if (datos.contrasenaNueva !== datos.confirmar) {
    return "La confirmación no coincide con la nueva contraseña.";
  }
  if (datos.contrasenaNueva === datos.contrasenaActual) {
    return "La nueva contraseña debe ser distinta de la actual.";
  }
  return null;
}
