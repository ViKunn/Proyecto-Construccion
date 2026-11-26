/**
 * Archivo: config.js
 * Propósito: Constantes del portal del cliente, alineadas con el backend Spring Boot
 * (enums tipo_usuario_enum, estado_pedido_enum y tipo_producto_enum de Supabase).
 */

export const APP_CONFIG = {
  /** Mismo origen que el backend: la cookie CAFETERIA_SESION viaja automáticamente. */
  API_BASE_URL: "/api",

  /** Cada cuánto se refresca el estado de "Mis pedidos" (HU-CLI-06). */
  AUTO_REFRESH_MS: 15000,

  /** Clave de localStorage donde se guarda el carrito del cliente. */
  CLAVE_CARRITO: "cafeteria.carrito",

  /** Máximo de productos distintos por pedido (ValidadorPedido.MAX_LINEAS). */
  MAX_LINEAS: 30,

  /** Tope técnico de unidades por producto cuando el servidor no fija un límite. */
  MAX_CANTIDAD_TECNICA: 1000
};

export const ROLES = {
  CLIENTE: "cliente",
  TRABAJADOR: "trabajador",
  ADMINISTRADOR: "administrador"
};

/** Flujo RN-NEG-06: pendiente -> en_preparacion -> listo -> entregado. */
export const ESTADOS_PEDIDO = ["pendiente", "en_preparacion", "listo", "entregado"];

export const ETIQUETAS_ESTADO = {
  pendiente: "Pendiente",
  en_preparacion: "En preparación",
  listo: "Listo para retirar",
  entregado: "Entregado"
};

/** Mensaje que ve el cliente en cada estado de su pedido. */
export const DESCRIPCION_ESTADO = {
  pendiente: "Recibimos tu pedido. Pronto empezaremos a prepararlo.",
  en_preparacion: "Estamos preparando tu pedido.",
  listo: "¡Tu pedido está listo! Acércate al mostrador con tu código de retiro.",
  entregado: "Pedido entregado. ¡Buen provecho!"
};

export const TIPOS_PRODUCTO = {
  bebida: "Bebidas",
  alimento: "Alimentos"
};
