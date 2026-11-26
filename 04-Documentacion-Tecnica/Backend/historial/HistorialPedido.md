# `HistorialPedido` *(record)*

**Paquete:** `g5.backend.cafeteria.historial`

> Agrupa la secuencia cronológica de transiciones de estado asociadas a un pedido específico.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idPedido` | `long` | Identificador único del pedido. |
| `cambios` | `List<CambioEstado>` | Lista cronológica de transiciones de estado experimentadas por el pedido. |
