# `ItemPedido` *(record)*

**Paquete:** `g5.backend.cafeteria.pedido`

> Estructura de datos que representa una línea de producto solicitada en la creación de un pedido. Solo recibe el identificador del producto y la cantidad; los precios son fijados por el servidor (RN-NEG-03/04).

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `codigoProducto` | `Long` | Identificador del producto a adquirir. |
| `cantidad` | `Integer` | Unidades enteras solicitadas del producto. |
