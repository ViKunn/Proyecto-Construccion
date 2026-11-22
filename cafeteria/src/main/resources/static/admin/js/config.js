/**
 * Archivo: config.js
 * Propósito: Centralizar la configuración general del Frontend Administrativo,
 * las constantes del dominio (estados de pedido, roles, tipos de producto)
 * y la bandera USE_MOCK para alternar entre datos simulados y el backend real
 * de Spring Boot.
 */

export const APP_CONFIG = {
  /**
   * URL base del backend Spring Boot.
   * Como los archivos estáticos se sirven desde el mismo servidor (puerto 8080),
   * se usa "/api" como ruta relativa. Si se abre con Live Server externo,
   * cambiar a "http://localhost:8080/api".
   */
  API_BASE_URL: "/api",

  /**
   * Bandera de modo simulado (mock):
   * - true: utiliza datos locales en memoria/localStorage (ideal mientras el backend termina).
   * - false: realiza peticiones HTTP reales hacia los controladores de Spring Boot.
   */
  USE_MOCK: true,

  /**
   * Intervalo en milisegundos para actualizar automáticamente el panel de pedidos.
   */
  AUTO_REFRESH_MS: 15000,

  /**
   * Clave usada en sessionStorage para guardar la sesión del usuario autenticado.
   */
  SESSION_STORAGE_KEY: "cafeteria_admin_sesion",

  /**
   * Clave usada en localStorage para persistir los datos de prueba en modo mock.
   */
  MOCK_STORAGE_KEY: "cafeteria_admin_mock_db_v1"
};

/**
 * Tipos de usuario definidos en la entidad Usuario (tipo_usuario).
 */
export const ROLES = {
  CLIENTE: "cliente",
  TRABAJADOR: "trabajador",
  ADMINISTRADOR: "administrador"
};

/**
 * Estados válidos de un pedido según RN-NEG-06.
 * Flujo estrictamente lineal:
 * pendiente -> en preparación -> listo -> entregado
 */
export const ESTADOS_PEDIDO = {
  PENDIENTE: "pendiente",
  EN_PREPARACION: "en preparación",
  LISTO: "listo",
  ENTREGADO: "entregado"
};

/**
 * Etiquetas legibles para mostrar los estados en la interfaz.
 */
export const ETIQUETAS_ESTADO = {
  [ESTADOS_PEDIDO.PENDIENTE]: "Pendiente",
  [ESTADOS_PEDIDO.EN_PREPARACION]: "En preparación",
  [ESTADOS_PEDIDO.LISTO]: "Listo para retirar",
  [ESTADOS_PEDIDO.ENTREGADO]: "Entregado"
};

/**
 * Tipos de producto permitidos en la entidad Producto (tipo_producto).
 */
export const TIPOS_PRODUCTO = {
  ALIMENTO: "alimento",
  BEBIDA: "bebida"
};

/**
 * Valores permitidos para disponibilidad de producto (disponible).
 */
export const DISPONIBILIDAD = {
  SI: "si",
  NO: "no"
};
