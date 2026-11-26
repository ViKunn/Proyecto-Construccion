# `ValidadorProducto`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** `@Component`

> Componente de validación y conversión de atributos para el catálogo de productos. Comprueba las restricciones sintácticas de nombres, precisión y rango de precios monetarios, y correspondencia de categorías de producto.

## Métodos

### `normalizarNombre(String s)`
```java
public String normalizarNombre(String s)
```

Normaliza el nombre comercial del producto eliminando espacios superfluos en los extremos y colapsando múltiples espacios intermedios.

* **Parámetros:**
  * `s`: Nombre comercial a normalizar.

### `errorNombre(String nombre)`
```java
public String errorNombre(String nombre)
```

Valida que el nombre comercial no esté vacío y no supere el límite máximo de 100 caracteres.

* **Parámetros:**
  * `nombre`: Nombre comercial del producto.

### `convertirPrecio(String texto)`
```java
public BigDecimal convertirPrecio(String texto)
```

Parsea y convierte una representación en texto a `BigDecimal` monetario. Devuelve `null` si el formato numérico es inválido.

* **Parámetros:**
  * `texto`: Cadena con el valor del precio.

### `errorPrecio(BigDecimal precio)`
```java
public String errorPrecio(BigDecimal precio)
```

Valida que el precio sea estrictamente positivo (mayor a cero), no nulo y tenga como máximo 2 dígitos decimales.

* **Parámetros:**
  * `precio`: Precio monetario a evaluar.

### `convertirTipo(String texto)`
```java
public TipoProducto convertirTipo(String texto)
```

Convierte una representación textual a su constante `TipoProducto` correspondiente.

* **Parámetros:**
  * `texto`: Cadena con la categoría del producto ('alimento' o 'bebida').

### `errorTipo(TipoProducto tipo)`
```java
public String errorTipo(TipoProducto tipo)
```

Verifica que la categoría del producto no sea nula y corresponda a una opción válida del catálogo.

* **Parámetros:**
  * `tipo`: Instancia de `TipoProducto` a verificar.
