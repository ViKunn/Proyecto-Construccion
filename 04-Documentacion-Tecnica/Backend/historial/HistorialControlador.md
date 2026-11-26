# `HistorialControlador`

**Paquete:** `g5.backend.cafeteria.historial`  
**Estereotipo / Anotaciones:** `@RestController @RequestMapping("/api/historial-pedidos")`

> Controlador REST para la consulta histórica y auditoría detallada de pedidos. Proporciona endpoints protegidos exclusivos para el administrador, permitiendo supervisar las transiciones de estado, empleados involucrados y detalles de compra.

## Dependencias (Constructor)
- `HistorialServicio servicio`
- `SesionUsuario sesion`

## Métodos

### `listar(Long idPedido, Integer pagina, Integer limite, HttpServletRequest request)`
```java
@GetMapping
public HistorialServicio.Pagina listar(@RequestParam(value = "idPedido", required = false) Long idPedido, @RequestParam(value = "pagina", required = false) Integer pagina, @RequestParam(value = "limite", required = false) Integer limite, HttpServletRequest request)
```

Historial paginado por pedido (más recientes primero). Filtros opcionales: `?idPedido=&pagina=0&limite=50`. Requiere autenticación con rol de administrador.

* **Parámetros:**
  * `idPedido`: Filtro opcional por identificador de pedido.
  * `pagina`: Número de página solicitada (base 0).
  * `limite`: Cantidad máxima de pedidos por página.
  * `request`: Solicitud HTTP con la sesión del administrador.

### `detalle(long idPedido, HttpServletRequest request)`
```java
@GetMapping("/{idPedido}")
public PedidoDetalleAdmin detalle(@PathVariable("idPedido") long idPedido, HttpServletRequest request)
```

Detalle completo del pedido seleccionado para fines de auditoría: datos generales, cliente, productos y secuencia histórica de estados. Requiere autenticación con rol de administrador.

* **Parámetros:**
  * `idPedido`: Identificador del pedido.
  * `request`: Solicitud HTTP con la sesión del administrador.
