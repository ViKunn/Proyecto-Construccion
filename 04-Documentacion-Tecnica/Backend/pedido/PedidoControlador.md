# `PedidoControlador`

**Paquete:** `g5.backend.cafeteria.pedido`  
**Estereotipo / Anotaciones:** `@RestController @RequestMapping("/api/pedidos")`

> Controlador REST que gestiona el ciclo de vida de los pedidos y la entrega en mostrador. Expone endpoints para la creación de órdenes por clientes (PN-01), seguimiento de pedidos (RU-05) y despacho operativo por parte del personal de cafetería (PN-02, RU-07).

## Dependencias (Constructor)
- `PedidoServicio servicio`
- `SesionUsuario sesion`

## Clases / Records Internos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `record` | `CrearPedidoRequest` | DTO para la solicitud de creación de un nuevo pedido. ([PedidoControlador.CrearPedidoRequest.md](./PedidoControlador.CrearPedidoRequest.md)) |
| `record` | `CodigoRetiroRequest` | DTO que transporta el código alfanumérico de retiro provisto por el cliente en mostrador. ([PedidoControlador.CodigoRetiroRequest.md](./PedidoControlador.CodigoRetiroRequest.md)) |
| `record` | `DetalleDto` | DTO que representa una línea de detalle de pedido para la interfaz de usuario. ([PedidoControlador.DetalleDto.md](./PedidoControlador.DetalleDto.md)) |
| `record` | `ClienteDto` | DTO informativo con el nombre y apellido del cliente para la visualización del personal. ([PedidoControlador.ClienteDto.md](./PedidoControlador.ClienteDto.md)) |
| `record` | `PedidoDto` | Estructura DTO principal con proyección segura de pedidos para clientes o personal. ([PedidoControlador.PedidoDto.md](./PedidoControlador.PedidoDto.md)) |

## Métodos

### `configuracion()`
```java
@GetMapping("/configuracion")
public Map<String, Integer> configuracion()
```

Expone las reglas operativas que el frontend requiere para las órdenes. Un valor de `cantidadMaximaPorProducto = -1` significa sin límite.

### `crear(CrearPedidoRequest body, HttpServletRequest request)`
```java
@PostMapping
public ResponseEntity<PedidoDto> crear(@RequestBody(required = false) CrearPedidoRequest body, HttpServletRequest request)
```

Registra una nueva orden de compra para el cliente autenticado en la sesión (PN-01).

* **Parámetros:**
  * `body`: Solicitud con los productos y cantidades seleccionadas.
  * `request`: Solicitud HTTP con la sesión activa del cliente.

### `misPedidos(Integer limite, HttpServletRequest request)`
```java
@GetMapping("/mis-pedidos")
public List<PedidoDto> misPedidos(@RequestParam(value = "limite", required = false) Integer limite, HttpServletRequest request)
```

RU-05: Consulta el historial de pedidos del cliente autenticado, ordenados cronológicamente del más reciente al más antiguo.

* **Parámetros:**
  * `limite`: Número máximo opcional de registros a retornar.
  * `request`: Solicitud HTTP con la sesión del cliente.

### `obtener(long id, HttpServletRequest request)`
```java
@GetMapping("/{id}")
public PedidoDto obtener(@PathVariable("id") long id, HttpServletRequest request)
```

Consulta un pedido por su identificador único. Si quien consulta es cliente, solo puede acceder a sus propios pedidos; el personal operativo puede consultar cualquier orden.

* **Parámetros:**
  * `id`: Identificador único del pedido.
  * `request`: Solicitud HTTP con la sesión del usuario.

### `listar(String estado, Integer limite, HttpServletRequest request)`
```java
@GetMapping
public List<PedidoDto> listar(@RequestParam(value = "estado", required = false) String estado, @RequestParam(value = "limite", required = false) Integer limite, HttpServletRequest request)
```

Consulta los pedidos en cola de atención para el personal operativo (RU-07). Por defecto retorna pedidos en curso ordenados cronológicamente; opcionalmente filtra por estado específico.

* **Parámetros:**
  * `estado`: Filtro por estado ('pendiente', 'en_preparacion', 'listo', 'entregado').
  * `limite`: Límite máximo opcional de resultados.
  * `request`: Solicitud HTTP con la sesión del personal.

### `iniciarPreparacion(long id, HttpServletRequest request)`
```java
@PostMapping("/{id}/iniciar-preparacion")
public PedidoDto iniciarPreparacion(@PathVariable("id") long id, HttpServletRequest request)
```

Transiciona el estado del pedido a 'en_preparacion'. Requiere autenticación con rol de trabajador.

* **Parámetros:**
  * `id`: Identificador del pedido a preparar.
  * `request`: Solicitud HTTP del trabajador.

### `marcarListo(long id, HttpServletRequest request)`
```java
@PostMapping("/{id}/marcar-listo")
public PedidoDto marcarListo(@PathVariable("id") long id, HttpServletRequest request)
```

Cambia el estado del pedido a 'listo' indicando que se encuentra finalizado y disponible para su retiro. Requiere rol de trabajador.

* **Parámetros:**
  * `id`: Identificador del pedido listo.
  * `request`: Solicitud HTTP del trabajador.

### `verificarCodigo(long id, CodigoRetiroRequest body, HttpServletRequest request)`
```java
@PostMapping("/{id}/verificar-codigo")
public Map<String, Boolean> verificarCodigo(@PathVariable("id") long id, @RequestBody(required = false) CodigoRetiroRequest body, HttpServletRequest request)
```

Verifica de forma previa si el código de retiro presentado coincide con el del pedido sin modificar su estado. Requiere rol de trabajador.

* **Parámetros:**
  * `id`: Identificador del pedido.
  * `body`: Objeto `CodigoRetiroRequest` con el código ingresado.
  * `request`: Solicitud HTTP del trabajador.

### `entregar(long id, CodigoRetiroRequest body, HttpServletRequest request)`
```java
@PostMapping("/{id}/entregar")
public PedidoDto entregar(@PathVariable("id") long id, @RequestBody(required = false) CodigoRetiroRequest body, HttpServletRequest request)
```

Formaliza la entrega final del pedido al cliente (PN-02). Exige que el pedido esté en estado 'listo' y valida el código de retiro antes de transicionar a 'entregado'. Requiere rol de trabajador.

* **Parámetros:**
  * `id`: Identificador del pedido a entregar.
  * `body`: Objeto `CodigoRetiroRequest` con el código presentado por el cliente.
  * `request`: Solicitud HTTP del trabajador.
