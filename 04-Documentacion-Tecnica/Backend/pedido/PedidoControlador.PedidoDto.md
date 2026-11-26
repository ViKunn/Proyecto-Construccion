# `PedidoControlador.PedidoDto` *(record)*

**Paquete:** `g5.backend.cafeteria.pedido`  
**Clase contenedora:** `PedidoControlador`

> Estructura DTO principal para la transferencia de información de pedidos. Aplica una proyección segura: el cliente ve su código de retiro pero no datos redundantes; el personal visualiza la identidad del cliente pero nunca el código de retiro con antelación.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idPedido` | `long` | Identificador único del pedido. |
| `estado` | `EstadoPedido` | Estado actual del pedido (`PENDIENTE`, `EN_PREPARACION`, `LISTO`, `ENTREGADO`). |
| `fechaRegistro` | `OffsetDateTime` | Fecha y hora de creación de la orden. |
| `importeTotal` | `BigDecimal` | Total monetario a cancelar. |
| `codigoRetiro` | `String` | Código de retiro (visible solo para el cliente). |
| `cliente` | `ClienteDto` | Datos del cliente (visible solo para el personal). |
| `items` | `List<DetalleDto>` | Lista de productos detallados en la orden. |

## Métodos Adicionales

### `paraCliente(Pedido p)`
```java
static PedidoDto paraCliente(Pedido p)
```

Genera una proyección de `PedidoDto` específica para el cliente, conservando el código de retiro y omitiendo los datos del cliente.

### `paraPersonal(Pedido p)`
```java
static PedidoDto paraPersonal(Pedido p)
```

Genera una proyección de `PedidoDto` específica para el personal, exponiendo los datos del cliente y ocultando el código de retiro previo a la entrega.
