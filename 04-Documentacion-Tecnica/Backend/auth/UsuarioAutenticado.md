# `UsuarioAutenticado` *(record)*

**Paquete:** `g5.backend.cafeteria.auth`

> Modela la identidad del usuario autenticado en el sistema. Se almacena exclusivamente en el servidor dentro de `HttpSession`, garantizando que el navegador solo retenga una cookie de sesión (`HttpOnly`) segura.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idUsuario` | `long` | Identificador primario en la tabla `usuario` (`usuario.id_usuario`). |
| `tipo` | `TipoUsuario` | Rol asignado al usuario (`CLIENTE`, `TRABAJADOR`, `ADMINISTRADOR`). |
| `idPerfil` | `Long` | Identificador de perfil: `cliente.codigo_cliente` si es `CLIENTE`, `trabajador.id_trabajador` si es `TRABAJADOR`, o `null` para `ADMINISTRADOR`. |
| `correo` | `String` | Dirección de correo electrónico del usuario. |
| `nombre` | `String` | Nombre de pila del usuario. |
| `apellido` | `String` | Apellido del usuario. |

## Métodos Adicionales

### `codigoCliente()`
```java
public long codigoCliente()
```

Obtiene el código de cliente asociado a este usuario.

* **Excepciones:**
  * `IllegalStateException`: Si el usuario no posee el rol `TipoUsuario.CLIENTE` o carece de perfil.

### `idTrabajador()`
```java
public long idTrabajador()
```

Obtiene el identificador de trabajador asociado a este usuario.

* **Excepciones:**
  * `IllegalStateException`: Si el usuario no posee el rol `TipoUsuario.TRABAJADOR` o carece de perfil.
