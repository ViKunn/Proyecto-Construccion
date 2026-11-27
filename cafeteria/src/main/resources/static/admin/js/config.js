/**
 * Archivo: config.js
 * Propósito: Centralizar las rutas base y las constantes del dominio
 * exactamente como las expone el backend Spring Boot y Supabase.
 */

export const APP_CONFIG = {
  /**
   * URL base del backend Spring Boot.
   * Al servirse desde src/main/resources/static/admin/, se usa "/api"
   * para compartir origen y enviar automáticamente la cookie CAFETERIA_SESION.
   */
  API_BASE_URL: "/api",

  /**
   * Intervalo en milisegundos para refrescar automáticamente la cola de pedidos.
   */
  AUTO_REFRESH_MS: 15000,

  /**
   * Tamaño máximo permitido por el servidor para imágenes de productos (2 MB).
   */
  MAX_IMAGEN_BYTES: 2 * 1024 * 1024
};

/**
 * Roles definidos en tipo_usuario_enum de Supabase y TipoUsuario del backend.
 */
export const ROLES = {
  CLIENTE: "cliente",
  TRABAJADOR: "trabajador",
  ADMINISTRADOR: "administrador"
};

/**
 * Estados válidos definidos en estado_pedido_enum (RN-NEG-06).
 * Flujo estrictamente lineal: pendiente -> en_preparacion -> listo -> entregado.
 */
export const ESTADOS_PEDIDO = {
  PENDIENTE: "pendiente",
  EN_PREPARACION: "en_preparacion",
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
 * Tipos de producto definidos en tipo_producto_enum.
 */
export const TIPOS_PRODUCTO = {
  ALIMENTO: "alimento",
  BEBIDA: "bebida"
};
