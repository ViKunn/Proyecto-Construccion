# `AuthRepositorio`

**Paquete:** `g5.backend.cafeteria.auth`  
**Estereotipo / Anotaciones:** `@Repository`

> Repositorio de acceso a datos para la autenticación de usuarios. Ejecuta consultas directas sobre la base de datos mediante `JdbcTemplate` para recuperar credenciales, datos de perfil y roles asociados.

## Dependencias (Constructor)
- `JdbcTemplate jdbc`

## Clases / Records Internos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `record` | `RegistroLogin` | Fila cruda para el login. Incluye el hash de contraseña; nunca debe salir de la capa de servicio. ([AuthRepositorio.RegistroLogin.md](./AuthRepositorio.RegistroLogin.md)) |

## Métodos

### `buscarPorCorreo(String correo)`
```java
public Optional<RegistroLogin> buscarPorCorreo(String correo)
```

Busca un usuario por su correo electrónico uniendo información de las tablas `usuario`, `cliente` y `trabajador`.

* **Parámetros:**
  * `correo`: Correo electrónico a consultar.

### `buscarHashPorId(long idUsuario)`
```java
public Optional<String> buscarHashPorId(long idUsuario)
```

Recupera el hash de la contraseña de un usuario a partir de su ID.

* **Parámetros:**
  * `idUsuario`: Identificador del usuario.

### `actualizarContrasena(long idUsuario, String nuevoHash)`
```java
public boolean actualizarContrasena(long idUsuario, String nuevoHash)
```

Actualiza el hash de la contraseña de un usuario en la tabla `usuario`.

* **Parámetros:**
  * `idUsuario`: Identificador del usuario.
  * `nuevoHash`: Nuevo hash generado con BCrypt.
