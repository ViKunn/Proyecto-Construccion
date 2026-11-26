# `PedidoDetalleAdmin` *(record)*

**Paquete:** `g5.backend.cafeteria.historial`

> Proyección integral de auditoría de un pedido para la interfaz del administrador. Consolida la cabecera, datos del cliente, líneas de compra desde `v_detalle_pedidos` y la línea de tiempo de transiciones desde `v_historial_pedidos`.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idPedido` | `long` | Identificador único del pedido. |
| `fechaRegistro` | `OffsetDateTime` | Fecha y hora de creación de la orden. |
| `estadoActual` | `EstadoPedido` | Estado en el que se encuentra actualmente el pedido. |
| `importeTotal` | `BigDecimal` | Monto monetario total del pedido. |
| `clienteNombre` | `String` | Nombre de pila del cliente que ordenó. |
| `clienteApellido` | `String` | Apellidos del cliente. |
| `clienteCelular` | `String` | Número telefónico de contacto del cliente. |
| `items` | `List<Linea>` | Colección de artículos adquiridos en el pedido (`Linea`). |
| `cambios` | `List<CambioEstado>` | Historial cronológico de cambios de estado (`CambioEstado`). |

## Métodos Adicionales

### `con(List<Linea> nuevosItems, List<CambioEstado> nuevosCambios)`
```java
public PedidoDetalleAdmin con(List<Linea> nuevosItems, List<CambioEstado> nuevosCambios)
```

Crea una nueva instancia inmutable de `PedidoDetalleAdmin` asociando las líneas de productos y los cambios de estado especificados.

* **Parámetros:**
  * `nuevosItems`: Lista de líneas de compra.
  * `nuevosCambios`: Lista de eventos cronológicos de cambio de estado.
