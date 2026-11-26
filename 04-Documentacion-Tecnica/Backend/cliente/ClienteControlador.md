# `ClienteControlador`

**Paquete:** `g5.backend.cafeteria.cliente`  
**Estereotipo / Anotaciones:** `@RestController @RequestMapping("/api/clientes")`

> Controlador REST que expone las operaciones públicas asociadas a los clientes. Proporciona el punto de entrada para el registro de nuevos usuarios en la plataforma.

## Dependencias (Constructor)
- `ClienteServicio servicio`

## Clases / Records Internos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `record` | `ClienteRegistradoDto` | Estructura de respuesta mínima devuelta tras el registro exitoso de un cliente. ([ClienteControlador.ClienteRegistradoDto.md](./ClienteControlador.ClienteRegistradoDto.md)) |

## Métodos

### `registrar(RegistroClienteRequest body)`
```java
@PostMapping("/registro")
public ResponseEntity<ClienteRegistradoDto> registrar(@RequestBody(required = false) RegistroClienteRequest body)
```

Endpoint público para el registro de nuevos clientes en el sistema. Valida los datos recibidos en el cuerpo, persiste el usuario y genera su perfil.

* **Parámetros:**
  * `body`: Datos de registro contenidos en `RegistroClienteRequest`.
