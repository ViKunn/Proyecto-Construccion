# `ProductoServicio`

**Paquete:** `g5.backend.cafeteria.producto`  
**Estereotipo / Anotaciones:** `@Service`

> Servicio de lógica de negocio responsable del catálogo de productos y la gestión del menú.

## Dependencias (Constructor)
- `ProductoRepositorio repositorio`
- `ValidadorProducto validador`
- `AlmacenImagenes almacen`

## Métodos

### `listarMenu()`
```java
public List<Producto> listarMenu()
```

Menú que visualizan los clientes: únicamente incluye productos marcados como disponibles (RN-NEG-02).

### `listar(String tipoTexto, Boolean disponible)`
```java
public List<Producto> listar(String tipoTexto, Boolean disponible)
```

Catálogo completo para uso del personal, con filtros opcionales de tipo y disponibilidad.

* **Parámetros:**
  * `tipoTexto`: Categoría en texto ('bebida' o 'alimento').
  * `disponible`: Filtro de disponibilidad booleano.

### `obtener(long codigo)`
```java
public Producto obtener(long codigo)
```

Obtiene un producto por su código identificador.

* **Parámetros:**
  * `codigo`: Identificador del producto.

* **Excepciones:**
  * `NoEncontradoException`: Si no existe ningún producto con el código suministrado.

### `crear(String nombre, String precioTexto, String tipoTexto, MultipartFile imagen)`
```java
public Producto crear(String nombre, String precioTexto, String tipoTexto, MultipartFile imagen)
```

Crea un nuevo producto en el catálogo validando sus campos, comprobando la unicidad del nombre comercial y almacenando el archivo de imagen adjunto.

* **Parámetros:**
  * `nombre`: Nombre del producto.
  * `precioTexto`: Precio en representación textual.
  * `tipoTexto`: Categoría en representación textual.
  * `imagen`: Archivo de imagen adjunto.

* **Excepciones:**
  * `ValidacionException`: Si hay errores de formato, campos vacíos o valores no permitidos.
  * `ConflictoException`: Si ya existe un producto con el mismo nombre comercial.

### `actualizar(long codigo, String nombre, BigDecimal precio, Boolean disponible)`
```java
public Producto actualizar(long codigo, String nombre, BigDecimal precio, Boolean disponible)
```

Cambia el nombre, precio y/o disponibilidad de un producto (los atributos en `null` permanecen sin cambios). Un cambio de precio NO afecta a pedidos existentes: `detalle_pedido` conserva su `precio_unitario` histórico (RN-NEG-04).

* **Parámetros:**
  * `codigo`: Identificador del producto a modificar.
  * `nombre`: Nuevo nombre comercial o null.
  * `precio`: Nuevo precio de venta o null.
  * `disponible`: Nuevo estado de disponibilidad o null.

* **Excepciones:**
  * `ValidacionException`: Si los datos a actualizar no cumplen con las reglas de negocio.
  * `ConflictoException`: Si el nuevo nombre comercial ya está en uso por otro producto.
  * `NoEncontradoException`: Si el producto a actualizar no existe.

### `reemplazarImagen(long codigo, MultipartFile imagen)`
```java
public Producto reemplazarImagen(long codigo, MultipartFile imagen)
```

Reemplaza la imagen existente de un producto, eliminando el archivo anterior del almacenamiento en disco.

* **Parámetros:**
  * `codigo`: Identificador del producto.
  * `imagen`: Nuevo archivo de imagen.

* **Excepciones:**
  * `NoEncontradoException`: Si el producto no existe.

### `armarMenu(List<Long> codigos)`
```java
public List<Producto> armarMenu(List<Long> codigos)
```

Arma el menú: quedan disponibles exactamente los productos indicados y no disponibles los demás. No existe borrado de productos: retirar del menú equivale a fijar `disponible = false` (los pedidos históricos siguen referenciando al producto).

* **Parámetros:**
  * `codigos`: Lista de identificadores de productos que conformarán el menú activo.

* **Excepciones:**
  * `ValidacionException`: Si la lista contiene códigos inexistentes o vacíos.
