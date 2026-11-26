# `PedidoControlador.DetalleDto` *(record)*

**Paquete:** `g5.backend.cafeteria.pedido`  
**Clase contenedora:** `PedidoControlador`

> DTO que representa una línea de detalle de pedido para la interfaz de usuario.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `codigoProducto` | `long` | Identificador del producto. |
| `nombre` | `String` | Nombre comercial del producto. |
| `precioUnitario` | `BigDecimal` | Precio congelado unitario al momento de la compra. |
| `cantidad` | `int` | Cantidad de unidades adquiridas. |
| `subtotal` | `BigDecimal` | Subtotal monetario calculado de la línea. |

## Métodos Adicionales
### `de(DetallePedido d)`
```java
static DetalleDto de(DetallePedido d)
```

Construye una instancia de `DetalleDto` a partir de un objeto de dominio `DetallePedido`.
