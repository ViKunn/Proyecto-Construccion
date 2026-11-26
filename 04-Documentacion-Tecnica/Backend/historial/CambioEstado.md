# `CambioEstado` *(record)*

**Paquete:** `g5.backend.cafeteria.historial`

> Una fila de `v_historial_pedidos`. `trabajadorNombre` y `trabajadorApellido` son `null` en el estado inicial (`pendiente`). Modela un evento o transición de estado en la línea de tiempo de un pedido.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idHistorial` | `long` | Identificador único del evento en el historial. |
| `estado` | `EstadoPedido` | Estado asignado al pedido en la transición. |
| `fechaCambio` | `OffsetDateTime` | Fecha y hora en la que se efectuó el cambio de estado. |
| `trabajadorNombre` | `String` | Nombre del trabajador que efectuó el cambio (`null` en estado inicial). |
| `trabajadorApellido` | `String` | Apellido del trabajador que efectuó el cambio (`null` en estado inicial). |
