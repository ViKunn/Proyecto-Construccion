# `AuthControlador.SesionDto` *(record)*

**Paquete:** `g5.backend.cafeteria.auth`  
**Clase contenedora:** `AuthControlador`

> DTO público que expone la información básica del usuario autenticado para el cliente web, omitiendo identificadores internos sensibles y hashes de seguridad.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `tipo` | `TipoUsuario` | Rol o categoría asignada al usuario (cliente, trabajador, administrador). |
| `nombre` | `String` | Nombre de pila del usuario. |
| `apellido` | `String` | Apellido del usuario. |
| `correo` | `String` | Dirección de correo electrónico del usuario. |

## Métodos Adicionales
### `de(UsuarioAutenticado u)`
```java
static SesionDto de(UsuarioAutenticado u)
```

Construye una instancia de `SesionDto` a partir de un objeto `UsuarioAutenticado`.
