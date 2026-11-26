# `HistorialRepositorio`

**Paquete:** `g5.backend.cafeteria.historial`  
**Estereotipo / Anotaciones:** `@Repository`

> Repositorio de acceso a datos para el módulo de auditoría e historial de pedidos mediante `JdbcTemplate`.

## Dependencias (Constructor)
- `JdbcTemplate jdbc`

## Métodos

### `contarPedidos(Long idPedido)`
```java
public long contarPedidos(Long idPedido)
```

Cantidad total de pedidos con historial registrado (opcionalmente filtrado por el pedido indicado).

* **Parámetros:**
  * `idPedido`: Filtro opcional por identificador de pedido.

### `idsPedidos(Long idPedido, int limite, long offset)`
```java
public List<Long> idsPedidos(Long idPedido, int limite, long offset)
```

Obtiene una página de identificadores de pedido ordenados del más reciente al más antiguo.

* **Parámetros:**
  * `idPedido`: Filtro opcional por pedido.
  * `limite`: Tamaño de la página.
  * `offset`: Desplazamiento inicial de paginación.

### `buscarCambios(Collection<Long> idsPedido)`
```java
public Map<Long, List<CambioEstado>> buscarCambios(Collection<Long> idsPedido)
```

Recupera los cambios de estado de varios pedidos en una sola consulta optimizada, estructurados en orden cronológico y agrupados por pedido.

* **Parámetros:**
  * `idsPedido`: Colección de identificadores de pedido.

### `buscarDetalle(long idPedido)`
```java
public Optional<PedidoDetalleAdmin> buscarDetalle(long idPedido)
```

Recupera la auditoría completa de un pedido a partir de las vistas `v_detalle_pedidos` y `v_historial_pedidos`.

* **Parámetros:**
  * `idPedido`: Identificador del pedido.
