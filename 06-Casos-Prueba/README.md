# Casos de Prueba y Resultados

**Sistema:** Gestión de pedidos de una cafetería universitaria
**Versión:** Release 1.0 · **Fecha de ejecución:** 27/11/2026

## Documentos

| Documento | Contenido |
|---|---|
| [Entorno y ejecución](01-Entorno-y-Ejecucion.md) | Entorno, forma de ejecución y cómo repetir las pruebas |
| [Registro y acceso](02-Registro-y-Acceso.md) | CP-01, CP-02, CP-03, CP-04, CP-05, CP-06, CP-07, CP-08, CP-36 |
| [Menú, pedidos y seguimiento](03-Menu-Pedidos-y-Seguimiento.md) | CP-09, CP-10, CP-11, CP-12, CP-13, CP-14, CP-15, CP-16, CP-20, CP-35 |
| [Atención y entrega](04-Atencion-y-Entrega.md) | CP-17, CP-18, CP-19, CP-21, CP-22, CP-23 |
| [Productos](05-Productos.md) | CP-24, CP-25, CP-26, CP-27, CP-28 |
| [Administración, cuenta y persistencia](06-Administracion-Cuenta-y-Persistencia.md) | CP-29, CP-30, CP-31, CP-32, CP-33, CP-34, CP-37 |
| [Análisis de fallos](07-Analisis-de-Fallos.md) | Causa, solución y nueva ejecución de CP-28 y CP-35 |
| [Trazabilidad y observaciones](08-Trazabilidad-y-Observaciones.md) | Requisitos cubiertos y límites |
| [Anexo A: pruebas de la API](evidencias/pruebas_api.md) | Casos CF: permisos, validaciones, concurrencia y base de datos |
| [Anexo B: pruebas unitarias](evidencias/pruebas_unitarias.md) | Pruebas existentes del código |

## Resumen de resultados

| Conjunto | Casos | Aprobados al inicio | Fallidos al inicio |
|---|---|---|---|
| Casos de interfaz | 37 | 35 | 2 |
| [Anexo A: pruebas de la API](evidencias/pruebas_api.md) | 56 | 55 | 1 |
| [Anexo B: pruebas unitarias](evidencias/pruebas_unitarias.md) | 48 | 48 | 0 |

El fallo del anexo A (CF-PED-05) es el mismo defecto que CP-35.

| Caso fallido | Defecto | Situación |
|---|---|---|
| [CP-28](05-Productos.md#cp-28) | Guardar el menú con un filtro desactivaba los productos ocultos | Corregido e integrado (commit `f5e1910`); aprobado en la nueva ejecución |
| [CP-35](03-Menu-Pedidos-y-Seguimiento.md#cp-35) | La API aceptaba cantidades decimales y las truncaba | Corregido e integrado (commit `d01f757`); aprobado en la nueva ejecución |

## Matriz de casos

| ID | Módulo | Caso | Requisito | 1.ª ejecución | Estado final |
|---|---|---|---|---|---|
| [CP-01](02-Registro-y-Acceso.md#cp-01) | Registro | Registrar un cliente con datos válidos | HU-CLI-07 | Aprobado | Aprobado |
| [CP-02](02-Registro-y-Acceso.md#cp-02) | Registro | Registrar con datos no válidos | HU-CLI-07 | Aprobado | Aprobado |
| [CP-03](02-Registro-y-Acceso.md#cp-03) | Registro | Registrar un correo ya usado | HU-CLI-07 | Aprobado | Aprobado |
| [CP-04](02-Registro-y-Acceso.md#cp-04) | Acceso | Iniciar sesión como cliente | HU-USU-02 | Aprobado | Aprobado |
| [CP-05](02-Registro-y-Acceso.md#cp-05) | Acceso | Iniciar sesión con contraseña incorrecta | HU-USU-02 | Aprobado | Aprobado |
| [CP-06](02-Registro-y-Acceso.md#cp-06) | Acceso | Una cuenta del personal no entra al portal de clientes | HU-USU-02 | Aprobado | Aprobado |
| [CP-07](02-Registro-y-Acceso.md#cp-07) | Acceso | Una cuenta de cliente no entra al portal del personal | HU-USU-02 | Aprobado | Aprobado |
| [CP-08](02-Registro-y-Acceso.md#cp-08) | Acceso | Abrir una página protegida sin sesión | HU-USU-02, RNF-02 | Aprobado | Aprobado |
| [CP-09](03-Menu-Pedidos-y-Seguimiento.md#cp-09) | Menú | Consultar el menú y los precios | HU-CLI-01, RN-NEG-02 | Aprobado | Aprobado |
| [CP-10](03-Menu-Pedidos-y-Seguimiento.md#cp-10) | Menú | Buscar y filtrar productos | HU-CLI-01 | Aprobado | Aprobado |
| [CP-11](03-Menu-Pedidos-y-Seguimiento.md#cp-11) | Pedido | No se puede confirmar un pedido vacío | HU-CLI-04, RN-NEG-01 | Aprobado | Aprobado |
| [CP-12](03-Menu-Pedidos-y-Seguimiento.md#cp-12) | Pedido | Armar un pedido y revisar el total | HU-CLI-02, HU-CLI-03, RN-NEG-03 | Aprobado | Aprobado |
| [CP-13](03-Menu-Pedidos-y-Seguimiento.md#cp-13) | Pedido | Quitar un producto reduciendo la cantidad a cero | HU-CLI-02, RN-NEG-01 | Aprobado | Aprobado |
| [CP-14](03-Menu-Pedidos-y-Seguimiento.md#cp-14) | Pedido | Confirmar el pedido y obtener el código | HU-CLI-05, RN-NEG-05, RN-NEG-06 | Aprobado | Aprobado |
| [CP-15](03-Menu-Pedidos-y-Seguimiento.md#cp-15) | Pedido | Un producto deja de estar disponible antes de confirmar | HU-CLI-04, RN-NEG-02 | Aprobado | Aprobado |
| [CP-16](03-Menu-Pedidos-y-Seguimiento.md#cp-16) | Seguimiento | Consultar el estado de mis pedidos | HU-CLI-06, RU-05 | Aprobado | Aprobado |
| [CP-17](04-Atencion-y-Entrega.md#cp-17) | Atención | Consultar los pedidos pendientes | HU-PER-04, RN-NEG-07 | Aprobado | Aprobado |
| [CP-18](04-Atencion-y-Entrega.md#cp-18) | Atención | Iniciar la preparación | HU-PER-05, RN-NEG-06 | Aprobado | Aprobado |
| [CP-19](04-Atencion-y-Entrega.md#cp-19) | Atención | Marcar el pedido como listo | HU-PER-06, RN-NEG-06 | Aprobado | Aprobado |
| [CP-20](03-Menu-Pedidos-y-Seguimiento.md#cp-20) | Seguimiento | El cliente ve que su pedido está listo | HU-CLI-06 | Aprobado | Aprobado |
| [CP-21](04-Atencion-y-Entrega.md#cp-21) | Entrega | Entregar con un código incorrecto | HU-PER-07, RN-NEG-07 | Aprobado | Aprobado |
| [CP-22](04-Atencion-y-Entrega.md#cp-22) | Entrega | Comprobar el código correcto | HU-PER-07, RN-NEG-07 | Aprobado | Aprobado |
| [CP-23](04-Atencion-y-Entrega.md#cp-23) | Entrega | Registrar la entrega con el código correcto | HU-PER-07, RN-NEG-06, RN-NEG-07 | Aprobado | Aprobado |
| [CP-24](05-Productos.md#cp-24) | Productos | Registrar un producto nuevo | HU-PER-01, RU-06 | Aprobado | Aprobado |
| [CP-25](05-Productos.md#cp-25) | Productos | Registrar un producto con precio no válido | HU-PER-01 | Aprobado | Aprobado |
| [CP-26](05-Productos.md#cp-26) | Productos | Cambiar el precio sin alterar pedidos anteriores | HU-PER-02, RN-NEG-04 | Aprobado | Aprobado |
| [CP-27](05-Productos.md#cp-27) | Productos | Desactivar un producto | HU-PER-03, RN-NEG-02 | Aprobado | Aprobado |
| [CP-28](05-Productos.md#cp-28) | Productos | Guardar el menú en lote con un filtro activo | HU-PER-03, RN-NEG-02 | Fallido | Aprobado en la nueva ejecución |
| [CP-29](06-Administracion-Cuenta-y-Persistencia.md#cp-29) | Administración | Crear una cuenta de trabajador | HU-ADM-01, HU-ADM-02 | Aprobado | Aprobado |
| [CP-30](06-Administracion-Cuenta-y-Persistencia.md#cp-30) | Administración | Crear un trabajador con cédula no válida | HU-ADM-01 | Aprobado | Aprobado |
| [CP-31](06-Administracion-Cuenta-y-Persistencia.md#cp-31) | Administración | Consultar el historial de un pedido | HU-ADM-03, RN-NEG-06 | Aprobado | Aprobado |
| [CP-32](06-Administracion-Cuenta-y-Persistencia.md#cp-32) | Cuenta | Cambiar contraseña indicando mal la actual | HU-USU-01 | Aprobado | Aprobado |
| [CP-33](06-Administracion-Cuenta-y-Persistencia.md#cp-33) | Cuenta | Cambiar la contraseña e iniciar sesión con la nueva | HU-USU-01 | Aprobado | Aprobado |
| [CP-34](06-Administracion-Cuenta-y-Persistencia.md#cp-34) | Cuenta | Cerrar sesión | HU-USU-02 | Aprobado | Aprobado |
| [CP-35](03-Menu-Pedidos-y-Seguimiento.md#cp-35) | Pedido | La API rechaza una cantidad decimal | RN-NEG-01, HU-CLI-04 | Fallido | Aprobado en la nueva ejecución |
| [CP-36](02-Registro-y-Acceso.md#cp-36) | Registro | Registrar un correo que no es institucional | HU-CLI-07 | Aprobado | Aprobado |
| [CP-37](06-Administracion-Cuenta-y-Persistencia.md#cp-37) | Persistencia | Los pedidos se conservan al reiniciar la aplicación | RNF-01 | Aprobado | Aprobado |
