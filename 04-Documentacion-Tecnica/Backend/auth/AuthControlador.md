# `AuthControlador`

**Paquete:** `g5.backend.cafeteria.auth`  
**Estereotipo / Anotaciones:** `@RestController @RequestMapping("/api/auth")`

> Controlador REST encargado de la autenticación y gestión de sesiones de usuario. Proporciona endpoints para iniciar sesión, verificar el estado de la sesión activa, cambiar la contraseña y cerrar sesión, gestionando la identidad en el servidor mediante cookies de sesión.

## Dependencias (Constructor)
- `AuthServicio servicio`
- `SesionUsuario sesion`

## Clases / Records Internos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `record` | `LoginRequest` | Estructura de datos que encapsula las credenciales de inicio de sesión enviadas por el cliente. ([AuthControlador.LoginRequest.md](./AuthControlador.LoginRequest.md)) |
| `record` | `CambioContrasenaRequest` | Estructura de datos que encapsula las credenciales para el cambio de contraseña de un usuario autenticado. ([AuthControlador.CambioContrasenaRequest.md](./AuthControlador.CambioContrasenaRequest.md)) |
| `record` | `SesionDto` | DTO público que expone la información básica del usuario autenticado para el cliente web. ([AuthControlador.SesionDto.md](./AuthControlador.SesionDto.md)) |

## Métodos

### `login(LoginRequest body, HttpServletRequest request)`
```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody(required = false) LoginRequest body, HttpServletRequest request)
```

Autentica a un usuario mediante sus credenciales (correo y contraseña). En caso de éxito, inicializa una nueva sesión HTTP en el servidor y retorna la información pública.

* **Parámetros:**
  * `body`: Objeto `LoginRequest` que contiene el correo y la contraseña.
  * `request`: Solicitud HTTP para establecer el contexto de sesión.

### `me(HttpServletRequest request)`
```java
@GetMapping("/me")
public ResponseEntity<?> me(HttpServletRequest request)
```

Consulta los datos de identidad del usuario asociado a la sesión activa en el servidor. Utilizado por el frontend para validar y restaurar la sesión ante recargas de página.

* **Parámetros:**
  * `request`: Solicitud HTTP con la cookie de sesión vigente.

### `logout(HttpServletRequest request)`
```java
@PostMapping("/logout")
public ResponseEntity<Void> logout(HttpServletRequest request)
```

Invalida y destruye la sesión HTTP del usuario en el servidor, revocando su autenticación.

* **Parámetros:**
  * `request`: Solicitud HTTP cuya sesión asociada será invalidada.

### `cambiarContrasena(CambioContrasenaRequest body, HttpServletRequest request)`
```java
@PutMapping("/contrasena")
public ResponseEntity<Void> cambiarContrasena(@RequestBody(required = false) CambioContrasenaRequest body, HttpServletRequest request)
```

Cambia la contraseña del usuario autenticado en la sesión vigente (HU-USU-01). Valida que la sesión esté activa y delega la verificación y actualización al servicio.

* **Parámetros:**
  * `body`: Objeto `CambioContrasenaRequest` con la contraseña actual y la nueva contraseña.
  * `request`: Solicitud HTTP para verificar la sesión activa del usuario.
