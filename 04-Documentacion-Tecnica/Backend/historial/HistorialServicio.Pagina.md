# `HistorialServicio.Pagina` *(record)*

**Paquete:** `g5.backend.cafeteria.historial`  
**Clase contenedora:** `HistorialServicio`

> Estructura de respuesta para la paginación de auditoría: `total` representa los pedidos que cumplen el filtro (no la cantidad individual de filas de cambios).

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `total` | `long` | Cantidad total de pedidos que satisfacen los criterios de búsqueda. |
| `pagina` | `int` | Índice de la página actual (base 0). |
| `limite` | `int` | Cantidad máxima de pedidos por página. |
| `pedidos` | `List<HistorialPedido>` | Colección de pedidos incluidos en la página con sus cambios cronológicos. |
