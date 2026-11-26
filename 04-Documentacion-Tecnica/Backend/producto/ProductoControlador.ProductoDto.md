# `ProductoControlador.ProductoDto` *(record)*

**Paquete:** `g5.backend.cafeteria.producto`  
**Clase contenedora:** `ProductoControlador`

> Estructura DTO de producto adaptada para su consumo en la interfaz de usuario.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `codigoProducto` | `long` | Identificador único del producto. |
| `nombre` | `String` | Nombre comercial del producto. |
| `precio` | `BigDecimal` | Precio unitario de venta. |
| `tipoProducto` | `TipoProducto` | Categoría a la que pertenece el producto. |
| `disponible` | `boolean` | Indicador de disponibilidad actual en el menú. |
| `imagenUrl` | `String` | URL relativa para la carga de la imagen (ej. `/imagenes/bebida/x.png`). |

## Métodos Adicionales
### `de(Producto p)`
```java
static ProductoDto de(Producto p)
```

Construye una instancia de `ProductoDto` a partir de la entidad `Producto`, calculando la URL correspondiente a la imagen.
