/**
 * Archivo: mockData.js
 * Propósito: Simular la base de datos de Supabase en localStorage cuando
 * APP_CONFIG.USE_MOCK es true. Respeta exactamente las entidades y atributos
 * definidos por el equipo: Usuario, Trabajador, Cliente, Producto, Pedido,
 * DetallePedido e HistorialEstadoPedido.
 */

import { APP_CONFIG, DISPONIBILIDAD, ESTADOS_PEDIDO, ROLES, TIPOS_PRODUCTO } from "../config.js";

/**
 * Datos iniciales de prueba para demostración y desarrollo del panel admin.
 */
function crearEstadoInicialMock() {
  return {
    usuarios: [
      {
        idUsuario: 1,
        correo: "admin@epn.edu.ec",
        contrasena: "admin123",
        tipoUsuario: ROLES.ADMINISTRADOR
      },
      {
        idUsuario: 2,
        correo: "trabajador@epn.edu.ec",
        contrasena: "trab123",
        tipoUsuario: ROLES.TRABAJADOR
      },
      {
        idUsuario: 3,
        correo: "cliente@epn.edu.ec",
        contrasena: "cli123",
        tipoUsuario: ROLES.CLIENTE
      }
    ],
    trabajadores: [
      {
        idTrabajador: 1,
        idUsuario: 2,
        nombre: "Carlos",
        apellido: "Mendoza",
        cedula: "1723456789",
        correo: "trabajador@epn.edu.ec"
      }
    ],
    clientes: [
      {
        codigoCliente: "CLI-001",
        idUsuario: 3,
        nombre: "Ana",
        apellido: "Torres",
        cedula: "1719876543",
        celular: "0991234567"
      }
    ],
    productos: [
      {
        codigoProducto: "PROD-001",
        nombre: "Café Americano",
        precio: 1.5,
        disponible: DISPONIBILIDAD.SI,
        tipoProducto: TIPOS_PRODUCTO.BEBIDA
      },
      {
        codigoProducto: "PROD-002",
        nombre: "Empanada de Queso",
        precio: 1.25,
        disponible: DISPONIBILIDAD.SI,
        tipoProducto: TIPOS_PRODUCTO.ALIMENTO
      },
      {
        codigoProducto: "PROD-003",
        nombre: "Jugo de Naranja Natural",
        precio: 1.75,
        disponible: DISPONIBILIDAD.SI,
        tipoProducto: TIPOS_PRODUCTO.BEBIDA
      },
      {
        codigoProducto: "PROD-004",
        nombre: "Sánduche de Pollo",
        precio: 2.5,
        disponible: DISPONIBILIDAD.NO,
        tipoProducto: TIPOS_PRODUCTO.ALIMENTO
      }
    ],
    pedidos: [
      {
        idPedido: 101,
        codigoCliente: "CLI-001",
        nombreCliente: "Ana Torres",
        codigoRetiro: "CAF-101A",
        estado: ESTADOS_PEDIDO.PENDIENTE,
        fechaRegistro: "2026-11-21T09:15:00",
        importeTotal: 4.0,
        detalles: [
          {
            idDetalle: 1,
            idPedido: 101,
            codigoProducto: "PROD-001",
            nombreProducto: "Café Americano",
            precioUnitario: 1.5,
            cantidad: 1
          },
          {
            idDetalle: 2,
            idPedido: 101,
            codigoProducto: "PROD-002",
            nombreProducto: "Empanada de Queso",
            precioUnitario: 1.25,
            cantidad: 2
          }
        ],
        historial: [
          {
            idHistorial: 1,
            idPedido: 101,
            idTrabajador: null,
            nombreTrabajador: "Sistema (registro inicial)",
            estado: ESTADOS_PEDIDO.PENDIENTE,
            fechaCambio: "2026-11-21T09:15:00"
          }
        ]
      },
      {
        idPedido: 102,
        codigoCliente: "CLI-001",
        nombreCliente: "Ana Torres",
        codigoRetiro: "CAF-102B",
        estado: ESTADOS_PEDIDO.EN_PREPARACION,
        fechaRegistro: "2026-11-21T09:20:00",
        importeTotal: 1.75,
        detalles: [
          {
            idDetalle: 3,
            idPedido: 102,
            codigoProducto: "PROD-003",
            nombreProducto: "Jugo de Naranja Natural",
            precioUnitario: 1.75,
            cantidad: 1
          }
        ],
        historial: [
          {
            idHistorial: 2,
            idPedido: 102,
            idTrabajador: null,
            nombreTrabajador: "Sistema (registro inicial)",
            estado: ESTADOS_PEDIDO.PENDIENTE,
            fechaCambio: "2026-11-21T09:20:00"
          },
          {
            idHistorial: 3,
            idPedido: 102,
            idTrabajador: 1,
            nombreTrabajador: "Carlos Mendoza",
            estado: ESTADOS_PEDIDO.EN_PREPARACION,
            fechaCambio: "2026-11-21T09:22:00"
          }
        ]
      },
      {
        idPedido: 103,
        codigoCliente: "CLI-001",
        nombreCliente: "Ana Torres",
        codigoRetiro: "CAF-103C",
        estado: ESTADOS_PEDIDO.LISTO,
        fechaRegistro: "2026-11-21T09:05:00",
        importeTotal: 3.0,
        detalles: [
          {
            idDetalle: 4,
            idPedido: 103,
            codigoProducto: "PROD-001",
            nombreProducto: "Café Americano",
            precioUnitario: 1.5,
            cantidad: 2
          }
        ],
        historial: [
          {
            idHistorial: 4,
            idPedido: 103,
            idTrabajador: null,
            nombreTrabajador: "Sistema (registro inicial)",
            estado: ESTADOS_PEDIDO.PENDIENTE,
            fechaCambio: "2026-11-21T09:05:00"
          },
          {
            idHistorial: 5,
            idPedido: 103,
            idTrabajador: 1,
            nombreTrabajador: "Carlos Mendoza",
            estado: ESTADOS_PEDIDO.EN_PREPARACION,
            fechaCambio: "2026-11-21T09:07:00"
          },
          {
            idHistorial: 6,
            idPedido: 103,
            idTrabajador: 1,
            nombreTrabajador: "Carlos Mendoza",
            estado: ESTADOS_PEDIDO.LISTO,
            fechaCambio: "2026-11-21T09:12:00"
          }
        ]
      }
    ]
  };
}

/**
 * Obtiene la base de datos simulada desde localStorage.
 * Si no existe todavía, la inicializa con los datos de ejemplo.
 *
 * @returns {Object} Objeto con arreglos de usuarios, trabajadores, clientes, productos y pedidos.
 */
export function cargarMockDB() {
  const guardado = localStorage.getItem(APP_CONFIG.MOCK_STORAGE_KEY);
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch {
      // Si el JSON guardado está dañado, se restaura el estado inicial
    }
  }
  const inicial = crearEstadoInicialMock();
  guardarMockDB(inicial);
  return inicial;
}

/**
 * Persiste los cambios realizados en la base de datos simulada dentro de localStorage.
 *
 * @param {Object} db - Estado actualizado de la base de datos mock.
 */
export function guardarMockDB(db) {
  localStorage.setItem(APP_CONFIG.MOCK_STORAGE_KEY, JSON.stringify(db));
}
