# `Pedido` *(record)*

**Paquete:** `g5.backend.cafeteria.pedido`

> Modelo de dominio interno que representa un pedido en la cafetería. Incluye el código de retiro generado por el sistema (RN-NEG-05), el estado de avance (RN-NEG-06), el importe total congelado (RN-NEG-03) y sus líneas de detalle.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idPedido` | `long` | Identificador único del pedido en la base de datos. |
| `codigoCliente` | `long` | Identificador del cliente propietario de la orden. |
| `codigoRetiro` | `String` | Código alfanumérico único para retirar el pedido en mostrador. |
| `estado` | `EstadoPedido` | Estado actual en el ciclo de vida del pedido (`PENDIENTE`, `EN_PREPARACION`, `LISTO`, `ENTREGADO`). |
| `fechaRegistro` | `OffsetDateTime` | Fecha y hora de creación de la orden. |
| `importeTotal` | `BigDecimal` | Importe monetario total del pedido. |
| `clienteNombre` | `String` | Nombre del cliente. |
| `clienteApellido` | `String` | Apellidos del cliente. |
| `detalles` | `List<DetallePedido>` | Colección de productos detallados en el pedido. |

## Métodos Adicionales

### `conDetalles(List<DetallePedido> nuevos)`
```java
public Pedido conDetalles(List<DetallePedido> nuevos)
```

Retorna una copia inmutable del pedido con la lista de detalles indicada.

* **Parámetros:**
  * `nuevos`: Lista de detalles asociados a este pedido.
