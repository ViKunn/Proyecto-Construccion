# `DetallePedido` *(record)*

**Paquete:** `g5.backend.cafeteria.pedido`

> Entidad de dominio que representa una línea de detalle dentro de un pedido registrado. Almacena el precio unitario histórico congelado al momento de la compra (RN-NEG-04).

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `codigoProducto` | `long` | Identificador único del producto. |
| `nombreProducto` | `String` | Nombre descriptivo del producto. |
| `precioUnitario` | `BigDecimal` | Precio congelado por unidad de producto. |
| `cantidad` | `int` | Número de unidades solicitadas. |

## Métodos Adicionales

### `subtotal()`
```java
public BigDecimal subtotal()
```

Calcula el subtotal monetario de la línea de producto multiplicando el precio unitario por la cantidad.
