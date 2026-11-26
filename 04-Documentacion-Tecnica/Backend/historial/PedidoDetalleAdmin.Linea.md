# `PedidoDetalleAdmin.Linea` *(record)*

**Paquete:** `g5.backend.cafeteria.historial`  
**Clase contenedora:** `PedidoDetalleAdmin`

> Representa una línea de producto dentro del pedido en la vista de auditoría administrativa (proyección de `v_detalle_pedidos`).

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idDetalle` | `long` | Identificador primario de la línea en la tabla `detalle_pedido`. |
| `productoNombre` | `String` | Nombre comercial del producto adquirido. |
| `cantidad` | `int` | Unidades compradas. |
| `precioUnitario` | `BigDecimal` | Precio unitario congelado al momento de la orden. |
| `subtotal` | `BigDecimal` | Subtotal monetario de la línea de producto. |
