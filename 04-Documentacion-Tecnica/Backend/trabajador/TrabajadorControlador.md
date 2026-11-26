# `TrabajadorControlador`

**Paquete:** `g5.backend.cafeteria.trabajador`  
**Estereotipo / Anotaciones:** `@RestController @RequestMapping("/api/trabajadores")`

> Controlador REST para la administración y supervisión del personal operativo (trabajadores). Todas las operaciones requieren autenticación activa con rol de administrador.

## Dependencias (Constructor)
- `TrabajadorServicio servicio`
- `SesionUsuario sesion`

## Métodos

### `listar(HttpServletRequest request)`
```java
@GetMapping
public List<Trabajador> listar(HttpServletRequest request)
```

Obtiene la lista completa de trabajadores registrados. Requiere autenticación activa con rol de administrador.

* **Parámetros:**
  * `request`: Solicitud HTTP con la sesión autenticada.

### `registrar(RegistroTrabajadorRequest body, HttpServletRequest request)`
```java
@PostMapping
public ResponseEntity<Trabajador> registrar(@RequestBody(required = false) RegistroTrabajadorRequest body, HttpServletRequest request)
```

Crea la cuenta (usuario + perfil de trabajador). El administrador define la contraseña inicial.

* **Parámetros:**
  * `body`: Datos del trabajador a registrar.
  * `request`: Solicitud HTTP con la sesión del administrador.
