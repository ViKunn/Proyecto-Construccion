# `HistorialServicio`

**Paquete:** `g5.backend.cafeteria.historial`  
**Estereotipo / Anotaciones:** `@Service`

> Servicio de lógica de negocio para la auditoría y consulta del historial de pedidos. Implementa la lógica de paginación asegurando que los eventos cronológicos de cada pedido permanezcan íntegros sin fragmentarse entre páginas consecutivas.

## Dependencias (Constructor)
- `HistorialRepositorio repositorio`

## Clases / Records Internos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `record` | `Pagina` | Página de historial donde total refleja los pedidos que cumplen el filtro. ([HistorialServicio.Pagina.md](./HistorialServicio.Pagina.md)) |

## Métodos

### `listar(Long idPedido, Integer pagina, Integer limite)`
```java
public Pagina listar(Long idPedido, Integer pagina, Integer limite)
```

La paginación es por pedido, garantizando que la línea de tiempo completa de un pedido nunca quede fragmentada entre páginas consecutivas.

* **Parámetros:**
  * `idPedido`: Filtro opcional por identificador de pedido.
  * `pagina`: Índice de página solicitado.
  * `limite`: Límite de pedidos por página.

### `detalle(long idPedido)`
```java
public PedidoDetalleAdmin detalle(long idPedido)
```

Recupera el detalle completo de un pedido para auditoría administrativa.

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.

* **Excepciones:**
  * `NoEncontradoException`: Si el pedido consultado no existe.
