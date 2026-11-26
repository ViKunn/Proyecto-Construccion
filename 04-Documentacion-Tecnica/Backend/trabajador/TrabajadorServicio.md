# `TrabajadorServicio`

**Paquete:** `g5.backend.cafeteria.trabajador`  
**Estereotipo / Anotaciones:** `@Service`

> Servicio de lógica de negocio encargado de la administración del personal operativo. Gestiona el listado y el alta de cuentas de trabajadores, validando datos personales, controlando la duplicidad de información y asegurando el almacenamiento cifrado de contraseñas.

## Dependencias (Constructor)
- `TrabajadorRepositorio repositorio`
- `ValidadorDatos validador`
- `PasswordEncoder encoder`

## Métodos

### `listar()`
```java
public List<Trabajador> listar()
```

Recupera la lista de todos los trabajadores registrados en el sistema.

### `registrar(RegistroTrabajadorRequest req)`
```java
public Trabajador registrar(RegistroTrabajadorRequest req)
```

Registra un nuevo empleado validando la coherencia de sus datos personales y la unicidad de su cédula y correo.

* **Parámetros:**
  * `req`: Datos de la solicitud provistos en `RegistroTrabajadorRequest`.

* **Excepciones:**
  * `ValidacionException`: Si los campos presentan errores de formato o incumplen restricciones.
  * `ConflictoException`: Si la cédula o el correo ya están asociados a otro usuario.
