# `AuthControlador.CambioContrasenaRequest` *(record)*

**Paquete:** `g5.backend.cafeteria.auth`  
**Clase contenedora:** `AuthControlador`

> Estructura de datos que encapsula las credenciales enviadas para el cambio de contraseña de un usuario autenticado.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `contrasenaActual` | `String` | Contraseña vigente del usuario para verificar su identidad. |
| `contrasenaNueva` | `String` | Nueva contraseña propuesta que reemplazará a la actual. |
