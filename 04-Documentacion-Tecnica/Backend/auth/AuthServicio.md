# `AuthServicio`

**Paquete:** `g5.backend.cafeteria.auth`  
**Estereotipo / Anotaciones:** `@Service`

> Servicio de lógica de negocio responsable del proceso de autenticación de usuarios. Valida formatos, verifica credenciales contra hashes BCrypt y mitiga ataques de temporización (timing attacks) para evitar la enumeración de usuarios en el sistema.

## Dependencias (Constructor)
- `AuthRepositorio repositorio`
- `PasswordEncoder encoder`
- `ValidadorDatos validador`

## Métodos

### `autenticar(String correo, String contrasena)`
```java
public Optional<UsuarioAutenticado> autenticar(String correo, String contrasena)
```

Realiza la validación integral de credenciales de acceso para un usuario. Devuelve vacío ante CUALQUIER fallo (correo inexistente, contraseña incorrecta, datos inconsistentes) para no filtrar información.

* **Parámetros:**
  * `correo`: Correo electrónico ingresado.
  * `contrasena`: Contraseña en texto plano ingresada.

### `cambiarContrasena(long idUsuario, String contrasenaActual, String contrasenaNueva)`
```java
public void cambiarContrasena(long idUsuario, String contrasenaActual, String contrasenaNueva)
```

Cambia la contraseña del usuario autenticado (HU-USU-01). Sirve para los tres tipos de usuario: cliente, trabajador y administrador, porque todos comparten la tabla usuario.

Reglas: la contraseña actual debe ser correcta; la nueva debe cumplir la política de `ValidadorDatos.errorContrasena(String)` (mínimo 8 caracteres, al menos una letra y un número, máximo 72 bytes) y ser distinta de la actual. Se guarda solo el hash BCrypt.

* **Parámetros:**
  * `idUsuario`: id del usuario, tomado de la sesión (nunca del frontend)
  * `contrasenaActual`: contraseña vigente, para confirmar la identidad
  * `contrasenaNueva`: contraseña que reemplazará a la actual

* **Excepciones:**
  * `ValidacionException`: si algún dato no es válido o la contraseña actual es incorrecta
  * `NoEncontradoException`: si el usuario de la sesión ya no existe
