# Documento de Requisitos

**Proyecto:** Sistema de gestión de pedidos de una cafetería universitaria (`g5.backend:cafeteria`)  
**Versión:** 1.0 (Release 1.0)  
**Fecha:** 22 de noviembre de 2026  
**Responsable:** Integrante 2  
**Colaboradores:** Integrante 1, Integrante 3 e Integrante 4  
**Fuentes:** Especificación inicial de necesidades del cliente (27/10/2026), Indicaciones del proyecto – Release 1.0, *Historias de usuario – Cafetería (INVEST)* v1.0 y modelo de entidades del equipo.

---

## 1. Propósito y alcance

Este documento reúne los requisitos del Release 1.0: los requisitos de usuario (RU), los requisitos funcionales (RF), las reglas de negocio (RN-NEG), los procesos de negocio (PN), las historias de usuario con sus criterios de aceptación y los requisitos no funcionales. Para cada historia se indica dónde quedó implementada en el backend, para que el equipo de pruebas pueda trazar cada caso de prueba hasta su requisito.

**Incluido en el Release 1.0:** consultar el menú; armar, revisar y confirmar pedidos anticipados; obtener un código de retiro; consultar el estado del pedido; administrar el menú; atender los pedidos (preparación, listo, entrega con verificación del código); gestión de cuentas (inicio de sesión, registro de clientes, creación de trabajadores y cambio de contraseña). Los productos y pedidos persisten entre ejecuciones (Supabase/PostgreSQL).

**Fuera del Release 1.0:** pagos electrónicos (el pago es presencial), notificaciones por correo o mensajería, impresoras o lectores de códigos, promociones, reembolsos, cancelación de pedidos, pedidos programados, inventario de ingredientes y recuperación de contraseña olvidada.

---

## 2. Actores

| Actor | Descripción | Tipo de usuario en el sistema |
| :--- | :--- | :--- |
| **Cliente** | Estudiante o docente que consulta el menú, registra pedidos y consulta su estado. | `cliente` |
| **Personal de cafetería** | Trabajador que mantiene el menú y atiende los pedidos hasta su entrega. | `trabajador` |
| **Administrador** | Crea las cuentas del personal, consulta la lista de trabajadores y el historial de pedidos. | `administrador` |

---

## 3. Requisitos de usuario

| ID | Requisito | Actor |
| :--- | :--- | :--- |
| RU-01 | Consultar el menú con los productos disponibles y sus precios. | Cliente |
| RU-02 | Seleccionar uno o más productos e indicar la cantidad de cada uno. | Cliente |
| RU-03 | Conocer el importe total antes de confirmar el pedido. | Cliente |
| RU-04 | Confirmar el pedido y recibir un código único de retiro con su resumen. | Cliente |
| RU-05 | Consultar el estado de los pedidos registrados. | Cliente |
| RU-06 | Registrar productos y actualizar su nombre, precio y disponibilidad. | Personal |
| RU-07 | Consultar los pedidos y registrar su avance hasta la entrega, verificando el código de retiro. | Personal |

## 4. Requisitos funcionales

Los requisitos funcionales describen lo que el sistema debe hacer. Se derivan de los requisitos de usuario (sección 3) y de las reglas de negocio (sección 5), y cada uno se detalla en una o más historias de usuario (sección 7). La última columna indica los casos de prueba que lo verifican (Documento 6).

### 4.1 Cuentas y acceso

| ID | Requisito funcional | Actor | Historias / reglas | Casos de prueba |
| :--- | :--- | :--- | :--- | :--- |
| RF-01 | El sistema debe permitir registrar una cuenta de cliente con nombre, apellido, cédula ecuatoriana válida, celular (09XXXXXXXX), correo institucional no repetido y contraseña. | Cliente | HU-CLI-07 | CP-01, CP-02, CP-03, CP-36 |
| RF-02 | El sistema debe permitir iniciar sesión con correo y contraseña e identificar el tipo de usuario (cliente, trabajador o administrador). | Todos | HU-USU-02 | CP-04, CP-05 |
| RF-03 | El sistema debe permitir cerrar la sesión. | Todos | HU-USU-02 | CP-34 |
| RF-04 | El sistema debe restringir cada operación al tipo de usuario autorizado: el cliente solo usa su portal y el personal el suyo; sin sesión no se accede a páginas ni a la API protegidas. | Todos | HU-USU-02, RNF-02 | CP-06, CP-07, CP-08 |
| RF-05 | El sistema debe permitir que el usuario autenticado cambie su contraseña indicando la actual; la nueva debe tener al menos 8 caracteres, una letra, un número y ser distinta de la actual. | Todos | HU-USU-01 | CP-32, CP-33 |

### 4.2 Menú y productos

| ID | Requisito funcional | Actor | Historias / reglas | Casos de prueba |
| :--- | :--- | :--- | :--- | :--- |
| RF-06 | El sistema debe mostrar el menú con los productos disponibles, su precio, tipo e imagen, y permitir buscarlos y filtrarlos por tipo. | Cliente | HU-CLI-01, RU-01, RN-NEG-02 | CP-09, CP-10 |
| RF-07 | El sistema debe permitir registrar un producto con nombre único, precio mayor que cero, tipo (bebida o alimento), disponibilidad e imagen opcional. | Trabajador | HU-PER-01, RU-06 | CP-24, CP-25 |
| RF-08 | El sistema debe permitir modificar el nombre, precio, tipo e imagen de un producto sin alterar el precio de los pedidos ya registrados. | Trabajador | HU-PER-02, RN-NEG-04 | CP-26 |
| RF-09 | El sistema debe permitir activar o desactivar la disponibilidad de los productos, de forma individual o en lote para armar el menú del día. | Trabajador | HU-PER-03, RN-NEG-02 | CP-27, CP-28 |

### 4.3 Registro de pedidos

| ID | Requisito funcional | Actor | Historias / reglas | Casos de prueba |
| :--- | :--- | :--- | :--- | :--- |
| RF-10 | El sistema debe permitir seleccionar uno o más productos del menú e indicar, modificar o quitar la cantidad de cada uno. | Cliente | HU-CLI-02, RU-02 | CP-12, CP-13 |
| RF-11 | El sistema debe calcular y mostrar el subtotal de cada producto y el importe total antes de confirmar el pedido. | Cliente | HU-CLI-03, RU-03, RN-NEG-03 | CP-12 |
| RF-12 | El sistema debe validar antes de registrar que el pedido tenga al menos un producto, que las cantidades sean enteros positivos y que los productos sigan disponibles, informando cada error. | Cliente | HU-CLI-04, RN-NEG-01, RN-NEG-02 | CP-11, CP-15, CP-35 |
| RF-13 | El sistema debe registrar el pedido en estado Pendiente, guardar el precio vigente de cada producto, calcular el importe total en el servidor, generar un código de retiro único de 6 caracteres y mostrar el resumen del pedido. | Cliente | HU-CLI-05, RU-04, RN-NEG-03, RN-NEG-04, RN-NEG-05 | CP-14 |
| RF-14 | El sistema debe permitir al cliente consultar únicamente sus propios pedidos, con estado, código de retiro, fecha, productos e importe total. | Cliente | HU-CLI-06, RU-05 | CP-16, CP-20 |

### 4.4 Atención y entrega

| ID | Requisito funcional | Actor | Historias / reglas | Casos de prueba |
| :--- | :--- | :--- | :--- | :--- |
| RF-15 | El sistema debe listar los pedidos en curso, filtrables por estado y ordenados desde el más antiguo, con su detalle y los datos del cliente. | Trabajador | HU-PER-04, RU-07 | CP-17 |
| RF-16 | El sistema debe permitir avanzar el estado del pedido solo en el orden Pendiente → En preparación → Listo para retirar, registrando el trabajador y la fecha de cada cambio. | Trabajador | HU-PER-05, HU-PER-06, RN-NEG-06 | CP-18, CP-19 |
| RF-17 | El sistema debe verificar el código de retiro presentado y registrar la entrega solo si el pedido está Listo para retirar y el código coincide. | Trabajador | HU-PER-07, RU-07, RN-NEG-06, RN-NEG-07 | CP-21, CP-22, CP-23 |

### 4.5 Administración

| ID | Requisito funcional | Actor | Historias / reglas | Casos de prueba |
| :--- | :--- | :--- | :--- | :--- |
| RF-18 | El sistema debe permitir crear cuentas de trabajador con nombre, apellido, cédula válida, correo y contraseña. | Administrador | HU-ADM-01 | CP-29, CP-30 |
| RF-19 | El sistema debe mostrar la lista de trabajadores sin exponer sus contraseñas. | Administrador | HU-ADM-02 | CP-29 |
| RF-20 | El sistema debe permitir consultar el historial de pedidos y, para cada uno, sus cambios de estado con la fecha y el trabajador responsable. | Administrador | HU-ADM-03, RN-NEG-06 | CP-31 |

### 4.6 Persistencia

| ID | Requisito funcional | Actor | Historias / reglas | Casos de prueba |
| :--- | :--- | :--- | :--- | :--- |
| RF-21 | El sistema debe conservar las cuentas, los productos y los pedidos con su historial al reiniciar la aplicación. | Todos | RNF-01 | CP-37 |

---

## 5. Reglas de negocio

| ID | Regla | Dónde se garantiza |
| :--- | :--- | :--- |
| RN-NEG-01 | Un pedido contiene al menos un producto y cada cantidad es un entero positivo. | `ValidadorPedido.errorItems`, `crear_pedido()`, `ctg_pedido_exigir_detalle`, `check (cantidad > 0)` |
| RN-NEG-02 | Solo los productos disponibles pueden incluirse en pedidos nuevos. | `PedidoServicio.crear`, trigger `trg_detalle_validar` |
| RN-NEG-03 | El importe total es la suma de precio unitario × cantidad de cada detalle. | Trigger `trg_detalle_recalcular_total` (el frontend nunca envía precios) |
| RN-NEG-04 | El precio aplicado a un detalle no cambia si después se modifica el precio del menú. | `detalle_pedido.precio_unitario` se copia al insertar y no puede modificarse |
| RN-NEG-05 | Cada pedido confirmado recibe un código de retiro único. | `generar_codigo_retiro()`: 6 caracteres sin 0, O, 1 ni I; columna `unique` |
| RN-NEG-06 | Flujo de estados: Pendiente → En preparación → Listo para retirar → Entregado, sin saltos ni retrocesos. | `PedidoServicio.cambiarEstado`, trigger `trg_historial_validar` |
| RN-NEG-07 | La entrega solo procede si el pedido está Listo y se presenta el código correspondiente. | `PedidoServicio.entregar` |

## 6. Procesos de negocio

- **PN-01 – Registro de pedido:** el cliente consulta el menú → selecciona productos y cantidades → revisa el importe → confirma → el sistema valida (RN-NEG-01/02), registra el pedido en estado *Pendiente* con precios congelados y devuelve el código de retiro.
- **PN-02 – Atención de pedido:** el personal consulta la cola → inicia la preparación → marca el pedido como listo → el cliente presenta su código → el personal lo verifica y registra la entrega. Cada cambio queda en `historial_estado_pedido` con el trabajador que lo hizo.

---

## 7. Historias de usuario y trazabilidad

Formato: *Como [usuario], quiero [funcionalidad], para [beneficio]*. Las historias HU-CLI y HU-PER cumplen INVEST (ver documento de historias de usuario). Las historias HU-USU y HU-ADM se incorporan en esta versión porque estaban definidas en el modelo de entidades (sección "El administrador del sistema puede") y son necesarias para identificar al cliente, tema que la especificación dejaba abierto.

| ID | Historia | Trazabilidad | Implementación (API) | Estado |
| :--- | :--- | :--- | :--- | :--- |
| HU-CLI-01 | Consultar menú y precios | RU-01, RN-NEG-02 | `GET /api/productos/menu` | Listo |
| HU-CLI-02 | Seleccionar productos y cantidades | RU-02, RN-NEG-01/02 | Carrito en frontend + `GET /api/pedidos/configuracion` | Listo |
| HU-CLI-03 | Revisar el importe total | RU-03, RN-NEG-03 | Cálculo en frontend; total oficial en `POST /api/pedidos` | Listo |
| HU-CLI-04 | Validar la selección antes de confirmar | RN-NEG-01/02 | Errores 400 de `POST /api/pedidos` | Listo |
| HU-CLI-05 | Confirmar pedido y obtener código de retiro | RU-04, RN-NEG-01..06 | `POST /api/pedidos` | Listo |
| HU-CLI-06 | Consultar estado del pedido | RU-05, RN-NEG-06 | `GET /api/pedidos/mis-pedidos`, `GET /api/pedidos/{id}` | Listo |
| HU-PER-01 | Registrar un producto | RU-06 | `POST /api/productos` | Listo |
| HU-PER-02 | Actualizar nombre o precio | RU-06, RN-NEG-03/04 | `PATCH /api/productos/{codigo}` | Listo |
| HU-PER-03 | Cambiar disponibilidad | RU-06, RN-NEG-02 | `PATCH /api/productos/{codigo}`, `PUT /api/productos/menu` | Listo |
| HU-PER-04 | Consultar pedidos pendientes | RU-07 | `GET /api/pedidos?estado=pendiente` | Listo |
| HU-PER-05 | Iniciar preparación | RU-07, RN-NEG-06 | `POST /api/pedidos/{id}/iniciar-preparacion` | Listo |
| HU-PER-06 | Marcar pedido como listo | RU-07, RN-NEG-06 | `POST /api/pedidos/{id}/marcar-listo` | Listo |
| HU-PER-07 | Verificar código y registrar entrega | RU-07, RN-NEG-06/07 | `POST /api/pedidos/{id}/verificar-codigo`, `/entregar` | Listo |
| HU-USU-01 | Cambiar mi contraseña | Modelo de entidades | `PUT /api/auth/contrasena` | Listo |
| HU-USU-02 | Iniciar y cerrar sesión según mi tipo de usuario | Sección 8 (identificación) | `POST /api/auth/login`, `/logout`, `GET /api/auth/me` | Listo |
| HU-CLI-07 | Registrarme como cliente | Sección 8 (identificación) | `POST /api/clientes/registro` | Listo |
| HU-ADM-01 | Crear cuentas de trabajadores | Modelo de entidades | `POST /api/trabajadores` | Listo |
| HU-ADM-02 | Consultar la lista de trabajadores | Modelo de entidades | `GET /api/trabajadores` | Listo |
| HU-ADM-03 | Consultar el historial de pedidos y sus cambios de estado | RN-NEG-06 | `GET /api/historial-pedidos`, `/{idPedido}` | Listo |

*"Listo"* = implementado en el backend y en la interfaz web, e integrado en la rama `main`.

### 7.1 Criterios de aceptación de las historias nuevas

**HU-USU-01 – Cambiar mi contraseña.** Como usuario del sistema (cliente, trabajador o administrador), quiero cambiar mi contraseña, para mantener segura mi cuenta.
- Solo un usuario con sesión iniciada puede cambiar su propia contraseña; el usuario se toma de la sesión.
- Debo ingresar mi contraseña actual; si es incorrecta, el sistema lo informa y no cambia nada.
- La nueva contraseña tiene al menos 8 caracteres, al menos una letra y un número, y es distinta de la actual.
- Se guarda únicamente el hash BCrypt; después del cambio, la contraseña anterior ya no permite iniciar sesión.

**HU-USU-02 – Iniciar y cerrar sesión.** Como usuario, quiero iniciar sesión con mi correo y contraseña, para acceder a las funciones de mi tipo de usuario.
- Con credenciales correctas, el sistema reconoce si soy cliente, trabajador o administrador.
- Con credenciales incorrectas, el mensaje no revela si el correo existe.
- Cada tipo de usuario solo accede a sus operaciones (401 sin sesión, 403 sin permiso).

**HU-CLI-07 – Registrarme como cliente.** Como estudiante o docente, quiero crear mi cuenta con nombre, apellido, cédula, celular y correo institucional, para registrar y consultar mis pedidos.
- La cédula ecuatoriana se valida con su dígito verificador; el celular tiene 10 dígitos y empieza con 09.
- El correo debe ser del dominio institucional y no puede repetirse.

**HU-ADM-01/02/03 – Administración.** Como administrador, quiero crear cuentas de trabajadores, ver su lista y consultar el historial de cambios de estado de los pedidos, para controlar quién atiende la cafetería y cómo avanzan los pedidos.
- El administrador no puede avanzar estados de pedidos (no tiene perfil de trabajador).
- La lista de trabajadores nunca muestra contraseñas.

---

## 8. Aclaraciones resueltas por el equipo

| Pregunta abierta en las historias | Decisión del Release 1.0 |
| :--- | :--- |
| ¿Cómo se identifica el cliente? | Con una cuenta propia (correo institucional y contraseña) e inicio de sesión; cada cliente ve solo sus pedidos. |
| ¿Datos obligatorios de un producto? | Nombre, precio (> 0), disponibilidad y tipo (bebida/alimento); la imagen es opcional. |
| ¿Formato del código de retiro? | 6 caracteres alfanuméricos en mayúsculas, sin 0, O, 1 ni I para evitar confusiones. |
| ¿Se puede cancelar o corregir un pedido? | No en el Release 1.0; solo existe el flujo de RN-NEG-06. |
| ¿Formato monetario? | Dólares con 2 decimales (`numeric(10,2)`). |
| ¿Qué incluye el resumen del pedido? | Número, fecha, estado, código de retiro, productos con cantidad, precio unitario, subtotal e importe total. |

---

## 9. Requisitos no funcionales

| ID | Requisito |
| :--- | :--- |
| RNF-01 Persistencia | Productos, cuentas y pedidos se almacenan en PostgreSQL (Supabase) y persisten entre ejecuciones. |
| RNF-02 Seguridad | Contraseñas con hash BCrypt (costo 10); sesión en el servidor con cookie HttpOnly de 8 horas; los ids nunca se aceptan desde el frontend; RLS activo en Supabase. |
| RNF-03 Integridad | Las reglas RN-NEG-01..07 se validan en el backend y además en la base de datos (triggers), de modo que no se pueden saltar. |
| RNF-04 Concurrencia | Si dos trabajadores cambian el mismo pedido a la vez, solo un cambio se aplica y el otro recibe un conflicto (409). |
| RNF-05 Mantenibilidad | Código Java documentado con JavaDoc y revisado con Checkstyle, PMD y SpotBugs. |
| RNF-06 Verificabilidad | Pruebas unitarias con JUnit 5 y Mockito que no requieren conexión a la base de datos. |
| RNF-07 Plataforma | Java 25, Spring Boot 4.2, frontend HTML/CSS/JavaScript servido por el mismo backend. |
