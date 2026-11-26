# Documentación técnica del frontend

**Proyecto:** Sistema de Gestión de Pedidos de Cafetería Universitaria  
**Stack:** HTML5 · CSS3 · JavaScript (ES Modules, sin frameworks)  
**Ubicación en el proyecto:** `src/main/resources/static/`  
**Versión:** 1.0

---

## Contenido

1. [Módulo del Cliente](#1-módulo-del-cliente)
   - [1.1 Descripción general](#11-descripción-general)
   - [1.2 Páginas (HTML)](#12-páginas-html)
   - [1.3 Controladores de página (`js/pages`)](#13-controladores-de-página-jspages)
   - [1.4 Servicios y comunicación con la API (`js/services`, `js/api`)](#14-servicios-y-comunicación-con-la-api-jsservices-jsapi)
   - [1.5 Utilidades y configuración (`js/utils`, `js/config.js`)](#15-utilidades-y-configuración-jsutils-jsconfigjs)
   - [1.6 Estilos (`css`)](#16-estilos-css)
   - [1.7 Flujo general](#17-flujo-general)
2. [Módulo del Trabajador](#2-módulo-del-trabajador)
   - [2.1 Descripción general](#21-descripción-general)
   - [2.2 Páginas (HTML)](#22-páginas-html)
   - [2.3 Controladores de página (`js/pages`)](#23-controladores-de-página-jspages)
   - [2.4 Servicios y comunicación con la API (`js/services`, `js/api`)](#24-servicios-y-comunicación-con-la-api-jsservices-jsapi)
   - [2.5 Utilidades y configuración (`js/utils`, `js/config.js`)](#25-utilidades-y-configuración-jsutils-jsconfigjs)
   - [2.6 Estilos (`css`)](#26-estilos-css)
   - [2.7 Flujo general](#27-flujo-general)
3. [Módulo del Administrador](#3-módulo-del-administrador)
   - [3.1 Descripción general](#31-descripción-general)
   - [3.2 Páginas (HTML)](#32-páginas-html)
   - [3.3 Controladores de página (`js/pages`)](#33-controladores-de-página-jspages)
   - [3.4 Servicios y comunicación con la API (`js/services`, `js/api`)](#34-servicios-y-comunicación-con-la-api-jsservices-jsapi)
   - [3.5 Utilidades y configuración (`js/utils`, `js/config.js`)](#35-utilidades-y-configuración-jsutils-jsconfigjs)
   - [3.6 Estilos (`css`)](#36-estilos-css)
   - [3.7 Flujo general](#37-flujo-general)

---

## 1. Módulo del Cliente

### 1.1 Descripción general

El frontend del cliente es la interfaz web con la que estudiantes y docentes consultan el menú, arman su pedido, lo confirman para obtener un código de retiro y siguen su estado hasta la entrega. Está construido con HTML5, CSS3 y JavaScript (módulos ES, sin frameworks) y lo sirve el mismo backend Spring Boot desde `src/main/resources/static/cliente/`.

Se comunica con la API REST bajo `/api` utilizando la cookie de sesión `HttpOnly` `CAFETERIA_SESION`. El código se organiza en capas: páginas (`HTML`), controladores de página (`pages`), servicios (llamadas a la API), utilidades (interfaz, validación y carrito) y estilos (`css`).

### 1.2 Páginas (HTML)

| Archivo | Descripción |
|---|---|
| `static/index.html` | Página raíz del sitio. Redirige automáticamente al portal del cliente e incluye un enlace al portal del personal (`/admin/`). |
| `cliente/index.html` | Pantalla de acceso con dos pestañas: **Ingresar** (correo y contraseña) y **Crear cuenta** (nombre, apellido, cédula, celular, correo y contraseña). Muestra los errores debajo de cada campo (`HU-USU-02` y `HU-CLI-07`). |
| `cliente/menu.html` | Página principal del cliente. Contiene el encabezado, la grilla del menú con buscador y filtros (*Todos*, *Bebidas*, *Alimentos*), el panel del carrito con el total, el diálogo de revisión del pedido y el diálogo de confirmación con el código de retiro (`HU-CLI-01` a `HU-CLI-05`). |
| `cliente/pedidos.html` | Página «Mis pedidos». Muestra cada pedido del cliente en una tarjeta con su estado, línea de progreso, código de retiro, detalle de productos y total, con filtros *En curso* y *Todos* (`HU-CLI-06`). |

### 1.3 Controladores de página (`js/pages`)

| Archivo | Descripción |
|---|---|
| `js/pages/acceso.js` | Controla `cliente/index.html`: cambia entre pestañas, valida los formularios, inicia sesión o registra la cuenta y redirige al menú. Si ya existe una sesión de cliente, entra directamente al menú. |
| `js/pages/menu.js` | Controla `cliente/menu.html`: carga el menú y el límite de cantidad, dibuja las tarjetas de productos, maneja el carrito (agregar, cambiar cantidad, quitar, vaciar), valida la selección, muestra la revisión, envía el pedido y presenta el código de retiro. Si una imagen no existe, usa una ilustración genérica. |
| `js/pages/pedidos.js` | Controla `cliente/pedidos.html`: consulta los pedidos del cliente, los dibuja con su progreso, aplica los filtros, se actualiza cada 15 segundos y avisa cuando un pedido pasa a *«Listo para retirar»*. |

### 1.4 Servicios y comunicación con la API (`js/services`, `js/api`)

| Archivo | Descripción |
|---|---|
| `js/api/httpClient.js` | Cliente HTTP único basado en `fetch()`. Envía siempre la cookie de sesión, arma las peticiones JSON y convierte las respuestas de error del backend (`{"mensaje", "errores"}`) en mensajes legibles con su código HTTP. |
| `js/services/authService.js` | Operaciones de cuenta: iniciar sesión (solo cuentas de cliente), registrar cliente, consultar la sesión actual, exigir sesión de cliente en páginas protegidas, cerrar sesión y cambiar contraseña. Endpoints: `/api/auth/*` y `/api/clientes/registro`. |
| `js/services/pedidoService.js` | Operaciones de pedidos: obtener el menú, el límite de unidades por producto, confirmar un pedido (solo envía códigos y cantidades; el importe lo calcula el servidor), listar «mis pedidos» y consultar un pedido. Endpoints: `/api/productos/menu` y `/api/pedidos/*`. |

### 1.5 Utilidades y configuración (`js/utils`, `js/config.js`)

| Archivo | Descripción |
|---|---|
| `js/config.js` | Constantes del portal: URL base de la API, intervalo de actualización, clave del carrito, límites de líneas y cantidades, roles, estados del pedido con sus etiquetas y mensajes, y tipos de producto. |
| `js/utils/carrito.js` | Clase `Carrito`: guarda el carrito en el navegador por cliente, agrega y modifica cantidades (solo enteros positivos, máximo 30 productos distintos y límite por producto), calcula subtotales y total referencial, y se sincroniza con el menú vigente quitando productos no disponibles y avisando cambios de precio. |
| `js/utils/encabezado.js` | Comportamiento común del encabezado de las páginas internas: saludo con el nombre del cliente, botón **Salir** y diálogo de cambio de contraseña (`HU-USU-01`). |
| `js/utils/ui.js` | Funciones de interfaz: escape de HTML contra XSS, formato de moneda y fecha, badge de estado del pedido, notificaciones emergentes (*toasts*), mensajes de formulario y apertura de diálogos. |
| `js/utils/validators.js` | Validaciones del lado del cliente que replican las del backend: correo, cédula ecuatoriana con dígito verificador, celular `09XXXXXXXX`, política de contraseñas y formularios de registro y cambio de contraseña. |

### 1.6 Estilos (`css`)

| Archivo | Descripción |
|---|---|
| `css/cliente.css` | Hoja de estilos del portal con la misma paleta y tipografía del frontend administrativo. Define botones, formularios, encabezado, grilla del menú, carrito, diálogos, badges de estado, tarjetas de pedidos y adaptación a pantallas pequeñas. Reutiliza las ilustraciones de `admin/img`. |

### 1.7 Flujo general

1. El cliente ingresa o crea su cuenta en `cliente/index.html`.
2. En `cliente/menu.html` elige productos, revisa el total referencial y confirma la orden.
3. El servidor valida las reglas de negocio, registra el pedido en estado `Pendiente` y devuelve el código de retiro.
4. En `cliente/pedidos.html` el cliente sigue el avance (*Pendiente*, *En preparación*, *Listo para retirar*, *Entregado*) y presenta su código en el mostrador.

> Todas las reglas se validan nuevamente en el backend, por lo que el frontend nunca envía precios ni identificadores de usuario.

---

## 2. Módulo del Trabajador

### 2.1 Descripción general

Interfaz operativa destinada al personal de cafetería para la gestión de la cola de pedidos en curso, actualización de estados de preparación, verificación de códigos de retiro en mostrador y administración del menú diario. Se aloja bajo `src/main/resources/static/admin/` compartiendo arquitectura modular en JavaScript puro (`ES Modules`) y autenticación mediante cookie `HttpOnly` (`CAFETERIA_SESION`).

### 2.2 Páginas (HTML)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con las vistas HTML correspondientes al flujo del trabajador.* |

### 2.3 Controladores de página (`js/pages`)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con los controladores en `admin/js/pages/` asociados al trabajador.* |

### 2.4 Servicios y comunicación con la API (`js/services`, `js/api`)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con los servicios en `admin/js/api/` y `admin/js/services/`.* |

### 2.5 Utilidades y configuración (`js/utils`, `js/config.js`)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con las utilidades y configuración en `admin/js/utils/` y `admin/js/config.js`.* |

### 2.6 Estilos (`css`)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con las hojas de estilo en `admin/css/`.* |

### 2.7 Flujo general

*Por completar con el flujo operativo del trabajador (inicio de sesión, gestión de cola de pedidos, cambio de estados, verificación de código de retiro y entrega en mostrador).*

---

## 3. Módulo del Administrador

### 3.1 Descripción general

Interfaz de supervisión y administración del sistema destinada al rol `administrador` para el registro de personal operativo (trabajadores), consulta del catálogo completo y auditoría del historial de pedidos. Se aloja bajo `src/main/resources/static/admin/` utilizando la misma arquitectura modular en JavaScript (`ES Modules`) y sesión autenticada en servidor (`CAFETERIA_SESION`).

### 3.2 Páginas (HTML)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con las vistas HTML correspondientes al flujo del administrador.* |

### 3.3 Controladores de página (`js/pages`)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con los controladores en `admin/js/pages/` asociados al administrador.* |

### 3.4 Servicios y comunicación con la API (`js/services`, `js/api`)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con los servicios en `admin/js/api/` y `admin/js/services/`.* |

### 3.5 Utilidades y configuración (`js/utils`, `js/config.js`)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con las utilidades y configuración en `admin/js/utils/` y `admin/js/config.js`.* |

### 3.6 Estilos (`css`)

| Archivo | Descripción |
|---|---|
| *Pendiente* | *Por completar con las hojas de estilo en `admin/css/`.* |

### 3.7 Flujo general

*Por completar con el flujo administrativo (inicio de sesión, gestión de cuentas de trabajadores, administración del catálogo de productos y auditoría del historial de pedidos).*