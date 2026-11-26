# `AuthRepositorio.RegistroLogin` *(record)*

**Paquete:** `g5.backend.cafeteria.auth`  
**Clase contenedora:** `AuthRepositorio`

> Fila cruda para el login. Incluye el hash de seguridad: nunca debe salir de la capa de servicio.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idUsuario` | `long` | Identificador único del usuario en la base de datos. |
| `correo` | `String` | Correo electrónico registrado. |
| `contrasenaHash` | `String` | Hash de la contraseña almacenada con algoritmo seguro (BCrypt). |
| `tipo` | `TipoUsuario` | Rol o tipo de usuario (`CLIENTE`, `TRABAJADOR`, `ADMINISTRADOR`). |
| `idPerfil` | `Long` | Identificador del perfil (`codigo_cliente` o `id_trabajador`; `null` para administrador). |
| `nombre` | `String` | Nombre de pila del usuario. |
| `apellido` | `String` | Apellido del usuario. |
