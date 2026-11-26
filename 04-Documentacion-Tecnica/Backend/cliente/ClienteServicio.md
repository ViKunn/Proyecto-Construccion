# `ClienteServicio`

**Paquete:** `g5.backend.cafeteria.cliente`  
**Estereotipo / Anotaciones:** `@Service`

> Servicio de lógica de negocio responsable del registro y validación de clientes. Aplica reglas de formato, asegura la unicidad de credenciales e identidad nacional, y delega la persistencia transaccional tras generar el hash seguro de la contraseña.

## Dependencias (Constructor)
- `ClienteRepositorio repositorio`
- `ValidadorDatos validador`
- `PasswordEncoder encoder`

## Métodos

### `registrar(RegistroClienteRequest req)`
```java
public Cliente registrar(RegistroClienteRequest req)
```

Procesa y ejecuta el registro integral de un nuevo cliente en el sistema. Valida todos los campos de forma acumulativa, verifica que no existan colisiones de correo o cédula y almacena la información cifrando la contraseña con BCrypt.

* **Parámetros:**
  * `req`: Petición `RegistroClienteRequest` con los datos a registrar.

* **Excepciones:**
  * `ValidacionException`: Si los datos suministrados no superan las validaciones de formato o están incompletos.
  * `ConflictoException`: Si el correo electrónico o la cédula ya pertenecen a otra cuenta existente.
