# `Producto` *(record)*

**Paquete:** `g5.backend.cafeteria.producto`

> Entidad de dominio que modela un producto del catálogo de la cafetería.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `codigoProducto` | `long` | Identificador único del producto. |
| `nombre` | `String` | Nombre comercial del producto. |
| `precio` | `BigDecimal` | Precio unitario de venta. |
| `disponible` | `boolean` | Indicador de disponibilidad actual en el menú. |
| `tipoProducto` | `TipoProducto` | Categoría a la que pertenece el producto (`ALIMENTO`, `BEBIDA`). |
| `rutaImagen` | `String` | Ruta relativa del archivo de imagen en el servidor. |
