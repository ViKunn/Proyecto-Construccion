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

Interfaz operativa destinada al personal de cafetería (`tipo_usuario = trabajador`) para atender la cola de pedidos anticipados, registrar los avances de preparación, validar el código de retiro en mostrador y administrar la carta de productos del menú diario. Está construida con HTML5, CSS3 y JavaScript modular (`ES Modules`, sin frameworks) y se sirve desde `src/main/resources/static/admin/` por el mismo backend Spring Boot.

Todas las peticiones se envían bajo `/api` con `credentials: "include"` utilizando la cookie de sesión `HttpOnly` `CAFETERIA_SESION`. El identificador `id_trabajador` nunca viaja desde el navegador: el servidor lo obtiene de la sesión activa al registrar cada cambio en `historial_estado_pedido`.

### 2.2 Páginas (HTML)

| Archivo | Descripción |
|---|---|
| `admin/index.html` | Pantalla de acceso compartida para personal de cafetería y administrador. Presenta un diseño dividido con ilustración 2D del mostrador y formulario de inicio de sesión (`correo` y `contraseña`), redirigiendo automáticamente según el rol autenticado (`HU-USU-02`). |
| `admin/panel-trabajador.html` | Panel operativo del personal de cafetería. Incluye la barra superior con botón **Cambiar contraseña** (`HU-USU-01`) y **Cerrar sesión**, un banner visual y tres pestañas principales: **Panel de Pedidos** (`HU-PER-04` a `HU-PER-06`), **Validar Código de Retiro** (`HU-PER-07`) y **Gestión del Menú** en formato de carta visual (`HU-PER-01` a `HU-PER-03`), además de los modales de detalle de pedido, edición de producto/imagen y cambio de contraseña. |

### 2.3 Controladores de página (`js/pages`)

| Archivo | Descripción |
|---|---|
| `admin/js/pages/login.js` | Controla `admin/index.html`: al cargar verifica si existe una sesión activa mediante `GET /api/auth/me` para redirigir directo al panel correspondiente; valida el formulario de ingreso, invoca `iniciarSesion()` y redirige a `panel-trabajador.html` o `panel-administrador.html` según `sesion.tipo`. |
| `admin/js/pages/trabajador.js` | Controla `admin/panel-trabajador.html`: exige rol `trabajador`, carga pedidos en curso y entregados con contadores y refresco automático cada 15 segundos, muestra el modal de detalle de cada pedido, ejecuta las transiciones lineales (*Pendiente* → *En preparación* → *Listo*), gestiona la verificación y entrega por código de retiro (`verificar-codigo` y `entregar`), y administra la carta visual del menú (registro con imagen, filtros, edición, reemplazo de imagen, interruptor de disponibilidad y armado de menú en lote). |

### 2.4 Servicios y comunicación con la API (`js/services`, `js/api`)

| Archivo | Descripción |
|---|---|
| `admin/js/api/httpClient.js` | Cliente HTTP centralizado sobre `fetch()`. Envía siempre `credentials: "include"`, soporta tanto cuerpos JSON como `FormData` (`multipart/form-data` para imágenes de productos) y traduce el formato unificado de errores del backend (`{"mensaje", "errores"}`) y códigos HTTP (`400`, `401`, `403`, `404`, `409`, `413`). |
| `admin/js/services/authService.js` | Operaciones de sesión y cuenta: `iniciarSesion` (`POST /api/auth/login`, bloqueando cuentas de `cliente`), `obtenerSesionActual` (`GET /api/auth/me`), `requerirRol` (protección de pantallas), `cerrarSesion` (`POST /api/auth/logout`) y `cambiarContrasena` (`PUT /api/auth/contrasena`). |
| `admin/js/services/pedidoService.js` | Operaciones sobre la cola de pedidos y entrega: `listarPedidos`, `listarTodosLosPedidos` (`GET /api/pedidos`), `obtenerDetallePedido` (`GET /api/pedidos/{id}`), `iniciarPreparacion` (`POST /api/pedidos/{id}/iniciar-preparacion`), `marcarPedidoListo` (`POST /api/pedidos/{id}/marcar-listo`), `verificarCodigoRetiro` (`POST /api/pedidos/{id}/verificar-codigo`) y `entregarPedido` (`POST /api/pedidos/{id}/entregar`). |
| `admin/js/services/productoService.js` | Operaciones de mantenimiento del menú: `listarProductos` (`GET /api/productos`), `crearProducto` (`POST /api/productos` en `multipart/form-data`), `actualizarProducto` (`PATCH /api/productos/{codigo}`), `reemplazarImagenProducto` (`PUT /api/productos/{codigo}/imagen`) y `armarMenu` (`PUT /api/productos/menu`). |

### 2.5 Utilidades y configuración (`js/utils`, `js/config.js`)

| Archivo | Descripción |
|---|---|
| `admin/js/config.js` | Constantes del portal administrativo: `API_BASE_URL` (`/api`), intervalo de refresco automático (`15000 ms`), límite de tamaño de imagen (`2 MB`), roles (`ROLES`), estados de pedido (`ESTADOS_PEDIDO` y `ETIQUETAS_ESTADO`) y tipos de producto (`TIPOS_PRODUCTO`). |
| `admin/js/utils/cambioContrasenaModal.js` | Controlador reutilizable del modal **Cambiar contraseña** (`HU-USU-01`), compartido entre `panel-trabajador.html` y `panel-administrador.html` para validar campos, invocar `PUT /api/auth/contrasena`, mostrar errores de campo y gestionar sesiones expiradas (`401`). |
| `admin/js/utils/ui.js` | Utilidades visuales compartidas: escape de texto HTML contra XSS (`escaparHtml`), formato monetario USD (`formatearMoneda`), formato local de fechas ISO (`formatearFecha`), generación de badges de estado (`crearBadgeEstado`) y notificaciones emergentes (`mostrarToast`). |
| `admin/js/utils/validators.js` | Validaciones en cliente alineadas con el Anexo A de la API: formato de correo en tiempo lineal, nombres/apellidos, cédula ecuatoriana (módulo 10), datos e imágenes de productos (`JPG`/`PNG`/`WEBP` ≤ 2 MB), formato de código de retiro de 6 caracteres y política de contraseñas (mín. 8 caracteres, letra, número y máx. 72 bytes). |

### 2.6 Estilos y recursos visuales (`css`, `img`)

| Archivo | Descripción |
|---|---|
| `admin/css/styles.css` | Hoja de estilos unificada con estética de cafetería (paleta espresso, caramelo y crema tibia; tipografías *Playfair Display* y *Plus Jakarta Sans*). Define la barra superior fija, el login dividido, el banner de bienvenida, las pestañas, los contadores de estado, las tablas, la caja de retiro, la carta visual de productos (`.menu-grid` y `.menu-card`), el interruptor deslizante de disponibilidad, los modales con fondo difuminado, notificaciones y la clase accesible `.sr-only`. |
| `admin/img/cafe-pattern.svg` | Patrón 2D sutil (tazas, granos de café y medialunas) usado como textura de fondo en todo el portal. |
| `admin/img/hero-cafeteria.svg` | Ilustración 2D del mostrador de cafetería usada en la pantalla de acceso y en los banners superiores. |
| `admin/img/placeholder-bebida.svg` | Ilustración 2D de bebida mostrada en las tarjetas del menú cuando una bebida no tiene imagen cargada. |
| `admin/img/placeholder-alimento.svg` | Ilustración 2D de alimento mostrada en las tarjetas del menú cuando un alimento no tiene imagen cargada. |

### 2.7 Flujo general

1. El trabajador inicia sesión en `admin/index.html` y el sistema lo redirige a `admin/panel-trabajador.html`.
2. En **Panel de Pedidos**, consulta los pedidos en estado `pendiente` (y demás estados con contadores en vivo), revisa su detalle de productos e inicia la preparación (`pendiente` → `en_preparacion`).
3. Al finalizar la preparación, marca el pedido como `listo` (`en_preparacion` → `listo`).
4. En **Validar Código de Retiro**, selecciona el pedido listo, ingresa el código de 6 caracteres que presenta el cliente, lo comprueba (`verificar-codigo`) y confirma la entrega (`listo` → `entregado`).
5. En **Gestión del Menú**, registra nuevos productos con imagen opcional, edita nombre/precio/foto, activa o pausa disponibilidad con el interruptor de cada tarjeta o arma el menú diario en lote.
6. Desde la barra superior puede actualizar su contraseña en cualquier momento (`HU-USU-01`) o cerrar sesión.

> Por seguridad (`RN-NEG-07`), el servidor nunca envía `codigoRetiro` al personal en la cola de pedidos y vuelve a validar tanto el código como el estado `listo` al confirmar la entrega.

---

## 3. Módulo del Administrador

### 3.1 Descripción general

Interfaz de supervisión y administración destinada al rol `administrador` para crear y consultar cuentas de trabajadores, auditar el historial paginado de cambios de estado de todos los pedidos e inspeccionar su detalle completo (incluyendo cliente, código de retiro, ítems y trazabilidad por trabajador). Se aloja bajo `src/main/resources/static/admin/`, compartiendo la misma arquitectura modular en `ES Modules`, hoja de estilos y autenticación mediante cookie `HttpOnly` (`CAFETERIA_SESION`).

### 3.2 Páginas (HTML)

| Archivo | Descripción |
|---|---|
| `admin/index.html` | Pantalla de acceso compartida. Al autenticarse una cuenta con `tipo = administrador`, redirige automáticamente a `admin/panel-administrador.html`. |
| `admin/panel-administrador.html` | Panel principal del administrador. Contiene la barra superior con **Cambiar contraseña** (`HU-USU-01`) y **Cerrar sesión**, el banner visual y dos pestañas: **Gestión de Trabajadores** (formulario de registro y tabla con búsqueda) e **Historial de Pedidos** (tabla paginada con filtro por `idPedido` y línea de tiempo), además de los modales de detalle completo del pedido y cambio de contraseña. |

### 3.3 Controladores de página (`js/pages`)

| Archivo | Descripción |
|---|---|
| `admin/js/pages/login.js` | Controla `admin/index.html`, valida las credenciales contra `/api/auth/login` y dirige a los administradores hacia `panel-administrador.html`. |
| `admin/js/pages/administrador.js` | Controla `admin/panel-administrador.html`: exige rol `administrador`, carga y filtra la lista de trabajadores, valida y registra nuevas cuentas de trabajador (con cédula ecuatoriana módulo 10 y política de contraseña), gestiona la paginación y filtro del historial de pedidos, y abre el modal con el detalle completo e historial de auditoría de cada pedido seleccionado. |

### 3.4 Servicios y comunicación con la API (`js/services`, `js/api`)

| Archivo | Descripción |
|---|---|
| `admin/js/api/httpClient.js` | Cliente HTTP único basado en `fetch()` con `credentials: "include"` y normalización de errores del backend. |
| `admin/js/services/authService.js` | Gestiona inicio/cierre de sesión, verificación de rol `administrador` (`GET /api/auth/me`) y cambio de contraseña (`PUT /api/auth/contrasena`). |
| `admin/js/services/trabajadorService.js` | Operaciones sobre cuentas de personal: `listarTrabajadores` (`GET /api/trabajadores`) y `crearTrabajador` (`POST /api/trabajadores`). |
| `admin/js/services/historialService.js` | Operaciones de auditoría: `listarHistorialPedidos` (`GET /api/historial-pedidos?pagina=&limite=&idPedido=`) y `obtenerDetalleHistorialPedido` (`GET /api/historial-pedidos/{idPedido}`). |

### 3.5 Utilidades y configuración (`js/utils`, `js/config.js`)

| Archivo | Descripción |
|---|---|
| `admin/js/config.js` | Define la ruta base `/api`, roles (`ROLES.ADMINISTRADOR`) y constantes/etiquetas de los estados de pedido mostrados en el historial. |
| `admin/js/utils/cambioContrasenaModal.js` | Controla el modal compartido **Cambiar contraseña** accesible desde la barra superior del panel del administrador. |
| `admin/js/utils/ui.js` | Provee escape contra XSS (`escaparHtml`), formato de importes y fechas, badges de estado para la línea de tiempo y notificaciones *toast*. |
| `admin/js/utils/validators.js` | Valida el formulario de alta de trabajadores (`validarNuevoTrabajador`: nombres, cédula ecuatoriana válida, correo y contraseña segura) y el cambio de contraseña (`validarCambioContrasena`). |

### 3.6 Estilos y recursos visuales (`css`, `img`)

| Archivo | Descripción |
|---|---|
| `admin/css/styles.css` | Hoja de estilos compartida con todo el módulo administrativo: barra superior espresso, banner 2D, pestañas, formularios en cuadrícula, tablas, barra de paginación (`.pagination-bar`), lista de línea de tiempo (`.timeline-list`), modales y etiquetas accesibles `.sr-only`. |
| `admin/img/cafe-pattern.svg` y `admin/img/hero-cafeteria.svg` | Recursos gráficos 2D locales usados como fondo sutil y banner del panel de administración. |

### 3.7 Flujo general

1. El administrador inicia sesión en `admin/index.html` y accede a `admin/panel-administrador.html`.
2. En **Gestión de Trabajadores**, consulta la lista del personal registrado (con búsqueda por nombre, apellido o cédula) y crea nuevas cuentas de trabajador definiendo su contraseña inicial.
3. En **Historial de Pedidos**, recorre los pedidos de forma paginada o busca un pedido por su `idPedido`, observando la línea de tiempo de cambios de estado (`pendiente` sin trabajador, y los cambios posteriores con el nombre del trabajador responsable).
4. Al pulsar **Ver detalle** sobre un pedido, inspecciona la información completa: datos y celular del cliente, código de retiro, productos con precios congelados/subtotales y auditoría completa de estados.
5. Desde la barra superior puede cambiar la contraseña de su cuenta (`HU-USU-01`) o cerrar sesión.

> De acuerdo con las reglas del backend, el administrador supervisa personal e historial, pero no avanza estados operativos de pedidos porque no posee un `id_trabajador` asociado.
