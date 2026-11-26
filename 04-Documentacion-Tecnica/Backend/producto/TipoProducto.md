# `TipoProducto` *(enum)*

**Paquete:** `g5.backend.cafeteria.producto`

> Categorías de productos ofrecidas en el catálogo de la cafetería.

## Valores
| Constante | Descripción |
| :--- | :--- |
| `ALIMENTO` | Producto clasificado como alimento comestible. |
| `BEBIDA` | Producto clasificado como bebida líquida. |

## Constantes y Métodos

### `valorBd()`
```java
public String valorBd()
```

Devuelve la representación textual del tipo de producto para su almacenamiento en base de datos.

### `desdeTexto(String valor)`
```java
public static TipoProducto desdeTexto(String valor)
```

Convierte una representación en texto al valor del enum. Devuelve `null` si el texto no corresponde a un tipo válido.

* **Parámetros:**
  * `valor`: Cadena de texto a evaluar ('alimento' o 'bebida').
