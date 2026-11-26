# `ClienteRepositorio`

**Paquete:** `g5.backend.cafeteria.cliente`  
**Estereotipo / Anotaciones:** `@Repository`

> Repositorio de acceso a datos para la gestión y persistencia de clientes. Proporciona métodos de verificación de unicidad y operaciones transaccionales sobre las tablas `usuario` y `cliente` mediante `JdbcTemplate`.

## Dependencias (Constructor)
- `JdbcTemplate jdbc`

## Métodos

### `existePorCorreo(String correo)`
```java
public boolean existePorCorreo(String correo)
```

Verifica si una dirección de correo electrónico ya se encuentra registrada en la tabla de usuarios. La búsqueda no distingue entre mayúsculas y minúsculas.

* **Parámetros:**
  * `correo`: Dirección de correo electrónico a consultar.

### `existePorCedula(String cedula)`
```java
public boolean existePorCedula(String cedula)
```

Verifica si un número de cédula de identidad ya está registrado en la tabla de clientes.

* **Parámetros:**
  * `cedula`: Cédula a consultar.

### `insertar(String correo, String contrasenaHash, String nombre, String apellido, String cedula, String celular)`
```java
@Transactional
public Cliente insertar(String correo, String contrasenaHash, String nombre, String apellido, String cedula, String celular)
```

Inserta de manera transaccional una nueva cuenta de usuario y su correspondiente registro de cliente.

* **Parámetros:**
  * `correo`: Correo electrónico del usuario.
  * `contrasenaHash`: Hash de la contraseña ya cifrada con BCrypt.
  * `nombre`: Nombre de pila del cliente.
  * `apellido`: Apellidos del cliente.
  * `cedula`: Cédula de identidad.
  * `celular`: Número de teléfono móvil.
