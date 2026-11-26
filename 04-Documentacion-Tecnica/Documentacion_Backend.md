# Documentación Técnica del Backend
**Proyecto:** Sistema de Gestión de Pedidos de Cafetería Universitaria  
**Versión:** 1.0  
**Tecnología:** Java · Spring Boot · JDBC · PostgreSQL (Supabase)

---

## Contenido

1. [Propósito del documento](#1-propósito-del-documento)
2. [Arquitectura](#2-arquitectura)
3. [Resumen de módulos](#3-resumen-de-módulos)
4. [Índice de clases](#4-índice-de-clases)

---

## 1. Propósito del documento

Este documento es el **punto de entrada** a la documentación técnica del código del servidor backend. Resume cómo está organizado el sistema y enlaza la documentación de cada clase, agrupada por módulo.

---

## 2. Arquitectura

El backend es un **monolito modular**: una sola aplicación Spring Boot (`g5.backend.cafeteria`) dividida en módulos por dominio. Dentro de cada módulo se aplica una **arquitectura en capas**:

| Capa | Clases | Responsabilidad |
|---|---|---|
| Controlador | `*Controlador` | Expone los endpoints REST, verifica la sesión y el rol, y entrega la respuesta como DTO. |
| Servicio | `*Servicio` | Aplica las reglas de negocio y las validaciones. |
| Repositorio | `*Repositorio` | Accede a PostgreSQL con JDBC (`JdbcTemplate`): consultas, vistas y la función `crear_pedido`. |
| Modelo | `record` y `enum` | Representan los datos: entidades, solicitudes (`*Request`), respuestas (`*Dto`) y estados. |
| Transversal | Módulo `core` | Soporte compartido: validadores, configuración, almacenamiento de imágenes y excepciones. |

Flujo de una petición:

```
Cliente HTTP → Controlador → Servicio → Repositorio → PostgreSQL
```

Además:

- **Dependencias en un solo sentido:** cada capa solo usa a la inmediatamente inferior.
- **Seguridad:** la identidad se guarda en el servidor mediante sesión HTTP (`HttpSession`, cookie `HttpOnly`). Los roles son `CLIENTE`, `TRABAJADOR` y `ADMINISTRADOR`.
- **Base de datos:** PostgreSQL concentra parte de las reglas de negocio mediante la función `crear_pedido`, triggers y vistas.
- **Errores:** `ManejadorExcepciones` devuelve los errores de validación (400), recurso inexistente (404) y conflicto (409) con un formato uniforme.

---

## 3. Resumen de módulos

| Módulo | Paquete | Responsabilidad principal |
|---|---|---|
| **`auth`** | `g5.backend.cafeteria.auth` | Inicio y cierre de sesión, cambio de contraseña y control de acceso por rol (`TipoUsuario`). |
| **`cliente`** | `g5.backend.cafeteria.cliente` | Registro de clientes y validación de sus datos personales. |
| **`trabajador`** | `g5.backend.cafeteria.trabajador` | Alta y consulta de trabajadores. Solo para el administrador. |
| **`producto`** | `g5.backend.cafeteria.producto` | Catálogo de productos: precios, disponibilidad, imágenes y armado del menú. |
| **`pedido`** | `g5.backend.cafeteria.pedido` | Creación de pedidos, cola de preparación, cambio de estados y entrega con código de retiro. |
| **`historial`** | `g5.backend.cafeteria.historial` | Consulta del historial de cambios de estado y del detalle de cada pedido. Solo para el administrador. |
| **`core`** | `g5.backend.cafeteria.core` | Validadores, configuración web, almacenamiento de imágenes y manejo de excepciones. |

---

## 4. Índice de clases

Cada enlace abre el documento de la clase en la carpeta `Backend`. Las clases anidadas se escriben como `Clase.Anidada`.

### 4.1 Punto de entrada

| Clase | Tipo | Descripción |
|---|---|---|
| [`CafeteriaApplication`](./Backend/CafeteriaApplication.md) | clase | Arranque de la aplicación Spring Boot. |

---

### 4.2 Módulo `auth` (Autenticación y Sesiones)

| Categoría | Clase | Tipo |
|---|---|---|
| Controlador | [`AuthControlador`](./Backend/auth/AuthControlador.md) | clase |
| Servicio | [`AuthServicio`](./Backend/auth/AuthServicio.md) | clase |
| Repositorio | [`AuthRepositorio`](./Backend/auth/AuthRepositorio.md) | clase |
| Componente de sesión | [`SesionUsuario`](./Backend/auth/SesionUsuario.md) | clase |
| Modelo | [`TipoUsuario`](./Backend/auth/TipoUsuario.md) | enum |
| Modelo | [`UsuarioAutenticado`](./Backend/auth/UsuarioAutenticado.md) | record |
| Modelo | [`AuthControlador.LoginRequest`](./Backend/auth/AuthControlador.LoginRequest.md) | record |
| Modelo | [`AuthControlador.CambioContrasenaRequest`](./Backend/auth/AuthControlador.CambioContrasenaRequest.md) | record |
| Modelo | [`AuthControlador.SesionDto`](./Backend/auth/AuthControlador.SesionDto.md) | record |
| Modelo | [`AuthRepositorio.RegistroLogin`](./Backend/auth/AuthRepositorio.RegistroLogin.md) | record |

---

### 4.3 Módulo `cliente` (Gestión de Clientes)

| Categoría | Clase | Tipo |
|---|---|---|
| Controlador | [`ClienteControlador`](./Backend/cliente/ClienteControlador.md) | clase |
| Servicio | [`ClienteServicio`](./Backend/cliente/ClienteServicio.md) | clase |
| Repositorio | [`ClienteRepositorio`](./Backend/cliente/ClienteRepositorio.md) | clase |
| Modelo | [`Cliente`](./Backend/cliente/Cliente.md) | record |
| Modelo | [`RegistroClienteRequest`](./Backend/cliente/RegistroClienteRequest.md) | record |
| Modelo | [`ClienteControlador.ClienteRegistradoDto`](./Backend/cliente/ClienteControlador.ClienteRegistradoDto.md) | record |

---

### 4.4 Módulo `trabajador` (Gestión de Personal Operativo)

| Categoría | Clase | Tipo |
|---|---|---|
| Controlador | [`TrabajadorControlador`](./Backend/trabajador/TrabajadorControlador.md) | clase |
| Servicio | [`TrabajadorServicio`](./Backend/trabajador/TrabajadorServicio.md) | clase |
| Repositorio | [`TrabajadorRepositorio`](./Backend/trabajador/TrabajadorRepositorio.md) | clase |
| Modelo | [`Trabajador`](./Backend/trabajador/Trabajador.md) | record |
| Modelo | [`RegistroTrabajadorRequest`](./Backend/trabajador/RegistroTrabajadorRequest.md) | record |

---

### 4.5 Módulo `producto` (Catálogo y Menú)

| Categoría | Clase | Tipo |
|---|---|---|
| Controlador | [`ProductoControlador`](./Backend/producto/ProductoControlador.md) | clase |
| Servicio | [`ProductoServicio`](./Backend/producto/ProductoServicio.md) | clase |
| Repositorio | [`ProductoRepositorio`](./Backend/producto/ProductoRepositorio.md) | clase |
| Modelo | [`TipoProducto`](./Backend/producto/TipoProducto.md) | enum |
| Modelo | [`Producto`](./Backend/producto/Producto.md) | record |
| Modelo | [`ProductoControlador.ProductoDto`](./Backend/producto/ProductoControlador.ProductoDto.md) | record |
| Modelo | [`ProductoControlador.CambioProductoRequest`](./Backend/producto/ProductoControlador.CambioProductoRequest.md) | record |
| Modelo | [`ProductoControlador.MenuRequest`](./Backend/producto/ProductoControlador.MenuRequest.md) | record |

---

### 4.6 Módulo `pedido` (Ciclo de Vida y Despacho de Pedidos)

| Categoría | Clase | Tipo |
|---|---|---|
| Controlador | [`PedidoControlador`](./Backend/pedido/PedidoControlador.md) | clase |
| Servicio | [`PedidoServicio`](./Backend/pedido/PedidoServicio.md) | clase |
| Repositorio | [`PedidoRepositorio`](./Backend/pedido/PedidoRepositorio.md) | clase |
| Modelo | [`EstadoPedido`](./Backend/pedido/EstadoPedido.md) | enum |
| Modelo | [`Pedido`](./Backend/pedido/Pedido.md) | record |
| Modelo | [`DetallePedido`](./Backend/pedido/DetallePedido.md) | record |
| Modelo | [`ItemPedido`](./Backend/pedido/ItemPedido.md) | record |
| Modelo | [`PedidoControlador.PedidoDto`](./Backend/pedido/PedidoControlador.PedidoDto.md) | record |
| Modelo | [`PedidoControlador.DetalleDto`](./Backend/pedido/PedidoControlador.DetalleDto.md) | record |
| Modelo | [`PedidoControlador.ClienteDto`](./Backend/pedido/PedidoControlador.ClienteDto.md) | record |
| Modelo | [`PedidoControlador.CrearPedidoRequest`](./Backend/pedido/PedidoControlador.CrearPedidoRequest.md) | record |
| Modelo | [`PedidoControlador.CodigoRetiroRequest`](./Backend/pedido/PedidoControlador.CodigoRetiroRequest.md) | record |
| Modelo | [`PedidoRepositorio.ProductoPedido`](./Backend/pedido/PedidoRepositorio.ProductoPedido.md) | record |

---

### 4.7 Módulo `historial` (Auditoría e Historial de Pedidos)

| Categoría | Clase | Tipo |
|---|---|---|
| Controlador | [`HistorialControlador`](./Backend/historial/HistorialControlador.md) | clase |
| Servicio | [`HistorialServicio`](./Backend/historial/HistorialServicio.md) | clase |
| Repositorio | [`HistorialRepositorio`](./Backend/historial/HistorialRepositorio.md) | clase |
| Modelo | [`CambioEstado`](./Backend/historial/CambioEstado.md) | record |
| Modelo | [`HistorialPedido`](./Backend/historial/HistorialPedido.md) | record |
| Modelo | [`HistorialServicio.Pagina`](./Backend/historial/HistorialServicio.Pagina.md) | record |
| Modelo | [`PedidoDetalleAdmin`](./Backend/historial/PedidoDetalleAdmin.md) | record |
| Modelo | [`PedidoDetalleAdmin.Linea`](./Backend/historial/PedidoDetalleAdmin.Linea.md) | record |

---

### 4.8 Módulo `core` (Componentes Transversales, Configuración y Excepciones)

| Categoría | Clase | Tipo |
|---|---|---|
| Validador | [`ValidadorDatos`](./Backend/core/ValidadorDatos.md) | clase |
| Validador | [`ValidadorPedido`](./Backend/core/ValidadorPedido.md) | clase |
| Validador | [`ValidadorProducto`](./Backend/core/ValidadorProducto.md) | clase |
| Componente | [`AlmacenImagenes`](./Backend/core/AlmacenImagenes.md) | clase |
| Componente | [`ConexionBD`](./Backend/core/ConexionBD.md) | clase |
| Configuración | [`ConfiguracionWeb`](./Backend/core/ConfiguracionWeb.md) | clase |
| Configuración | [`ConfiguracionImagenes`](./Backend/core/ConfiguracionImagenes.md) | clase |
| Excepciones | [`ManejadorExcepciones`](./Backend/core/ManejadorExcepciones.md) | clase |
| Excepciones | [`ValidacionException`](./Backend/core/ValidacionException.md) | clase |
| Excepciones | [`ConflictoException`](./Backend/core/ConflictoException.md) | clase |
| Excepciones | [`NoEncontradoException`](./Backend/core/NoEncontradoException.md) | clase |