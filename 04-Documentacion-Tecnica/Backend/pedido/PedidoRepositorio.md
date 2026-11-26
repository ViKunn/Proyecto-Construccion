# `PedidoRepositorio`

**Paquete:** `g5.backend.cafeteria.pedido`  
**Estereotipo / Anotaciones:** `@Repository`

> Repositorio de acceso a datos para la persistencia y ciclo de vida de los pedidos. Delega la creación atómica a la función almacenada `crear_pedido`, realiza consultas por cliente o cola de trabajo, y registra transiciones de estado en `historial_estado_pedido`.

## Dependencias (Constructor)
- `JdbcTemplate jdbc`

## Clases / Records Internos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `record` | `ProductoPedido` | Datos mínimos de un producto para validar un pedido. ([PedidoRepositorio.ProductoPedido.md](./PedidoRepositorio.ProductoPedido.md)) |

## Métodos

### `crear(long codigoCliente, List<ItemPedido> items)`
```java
public Pedido crear(long codigoCliente, List<ItemPedido> items)
```

Invoca la función almacenada `crear_pedido` de PostgreSQL que genera de forma atómica el código alfanumérico de retiro, totaliza los importes y registra los detalles.

* **Parámetros:**
  * `codigoCliente`: Identificador del cliente.
  * `items`: Lista de productos y cantidades compradas.

### `buscarProductos(Collection<Long> codigos)`
```java
public Map<Long, ProductoPedido> buscarProductos(Collection<Long> codigos)
```

Recupera información resumida de los productos indicados para validaciones previas a la persistencia.

* **Parámetros:**
  * `codigos`: Colección de identificadores de producto.

### `buscarPorId(long idPedido)`
```java
public Optional<Pedido> buscarPorId(long idPedido)
```

Recupera la cabecera de un pedido por su identificador único.

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.

### `listarPorEstados(List<EstadoPedido> estados, boolean ascendente, int limite)`
```java
public List<Pedido> listarPorEstados(List<EstadoPedido> estados, boolean ascendente, int limite)
```

Consulta los pedidos en cola para el personal filtrando por un conjunto de estados. El parámetro `ascendente = true` lista los más antiguos primero.

* **Parámetros:**
  * `estados`: Lista de estados permitidos.
  * `ascendente`: Sentido de ordenamiento cronológico.
  * `limite`: Límite máximo de registros a retornar.

### `listarPorCliente(long codigoCliente, int limite)`
```java
public List<Pedido> listarPorCliente(long codigoCliente, int limite)
```

Recupera los pedidos pertenecientes a un cliente ordenados del más reciente al más antiguo.

* **Parámetros:**
  * `codigoCliente`: Identificador del cliente.
  * `limite`: Límite de pedidos a retornar.

### `buscarDetalles(Collection<Long> idsPedido)`
```java
public Map<Long, List<DetallePedido>> buscarDetalles(Collection<Long> idsPedido)
```

Obtiene las líneas de detalle de múltiples pedidos en una única consulta optimizada, agrupándolas por identificador de pedido.

* **Parámetros:**
  * `idsPedido`: Colección de identificadores de pedido.

### `registrarEstado(long idPedido, long idTrabajador, EstadoPedido nuevo)`
```java
public void registrarEstado(long idPedido, long idTrabajador, EstadoPedido nuevo)
```

Registra el cambio de estado en la tabla `historial_estado_pedido`. Los triggers de PostgreSQL validan la máquina de estados (RN-NEG-06) y sincronizan la columna de estado en la tabla `pedido`.

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.
  * `idTrabajador`: Identificador del trabajador responsable.
  * `nuevo`: Nuevo estado asignado.
