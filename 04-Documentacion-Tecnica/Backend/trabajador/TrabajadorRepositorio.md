# `TrabajadorRepositorio`

**Paquete:** `g5.backend.cafeteria.trabajador`  
**Estereotipo / Anotaciones:** `@Repository`

> Repositorio de acceso a datos para la administración de trabajadores. Proporciona métodos de verificación de unicidad, listados mediante vistas y operaciones de inserción transaccional sobre las tablas `usuario` y `trabajador`.

## Dependencias (Constructor)
- `JdbcTemplate jdbc`

## Métodos

### `listar()`
```java
public List<Trabajador> listar()
```

Usa la vista `v_trabajadores` (no expone la contraseña).

### `existePorCorreo(String correo)`
```java
public boolean existePorCorreo(String correo)
```

Verifica si un correo electrónico ya se encuentra registrado en el sistema.

* **Parámetros:**
  * `correo`: Correo a consultar.

### `existePorCedula(String cedula)`
```java
public boolean existePorCedula(String cedula)
```

Verifica si un número de cédula ya se encuentra registrado en el sistema.

* **Parámetros:**
  * `cedula`: Cédula a consultar.

### `insertar(String correo, String contrasenaHash, String nombre, String apellido, String cedula)`
```java
@Transactional
public Trabajador insertar(String correo, String contrasenaHash, String nombre, String apellido, String cedula)
```

Crea usuario + trabajador en una sola transacción.

* **Parámetros:**
  * `correo`: Correo electrónico del trabajador.
  * `contrasenaHash`: Hash BCrypt de la contraseña.
  * `nombre`: Nombre del trabajador.
  * `apellido`: Apellido del trabajador.
  * `cedula`: Cédula de identidad.
