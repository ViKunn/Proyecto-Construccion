# `ProductoRepositorio`

**Paquete:** `g5.backend.cafeteria.producto`  
**Estereotipo / Anotaciones:** `@Repository`

> Repositorio de acceso a datos para la administración del catálogo de productos y menú mediante `JdbcTemplate`.

## Dependencias (Constructor)
- `JdbcTemplate jdbc`

## Métodos

### `listar(TipoProducto tipo, Boolean disponible)`
```java
public List<Producto> listar(TipoProducto tipo, Boolean disponible)
```

Filtros opcionales (null = sin filtrar). Ordenado por categoría (enum) y nombre comercial.

* **Parámetros:**
  * `tipo`: Categoría de producto a filtrar, o null para todas.
  * `disponible`: Estado de disponibilidad a filtrar, o null para ignorar el filtro.

### `buscarPorCodigo(long codigo)`
```java
public Optional<Producto> buscarPorCodigo(long codigo)
```

Recupera un producto a partir de su clave primaria.

* **Parámetros:**
  * `codigo`: Identificador del producto.

### `existePorNombre(String nombre, Long excluirCodigo)`
```java
public boolean existePorNombre(String nombre, Long excluirCodigo)
```

Verifica si existe un producto registrado con el nombre especificado. Permite ignorar un código (`excluirCodigo`) para actualizar sin generar falsos positivos con el propio registro.

* **Parámetros:**
  * `nombre`: Nombre comercial a verificar.
  * `excluirCodigo`: Código del producto a omitir en la comprobación, o null.

### `insertar(String nombre, BigDecimal precio, TipoProducto tipo, String rutaImagen)`
```java
public Producto insertar(String nombre, BigDecimal precio, TipoProducto tipo, String rutaImagen)
```

Inserta un nuevo producto en la base de datos y retorna la entidad con su clave generada.

* **Parámetros:**
  * `nombre`: Nombre del producto.
  * `precio`: Precio monetario de venta.
  * `tipo`: Categoría del producto.
  * `rutaImagen`: Ruta del archivo de imagen persistido.

### `actualizar(long codigo, String nombre, BigDecimal precio, Boolean disponible)`
```java
public Optional<Producto> actualizar(long codigo, String nombre, BigDecimal precio, Boolean disponible)
```

Realiza una actualización parcial: los parámetros que llegan en `null` conservan el valor actual en la base de datos.

* **Parámetros:**
  * `codigo`: Código del producto a actualizar.
  * `nombre`: Nuevo nombre comercial o null.
  * `precio`: Nuevo precio de venta o null.
  * `disponible`: Nuevo estado de disponibilidad o null.

### `actualizarRutaImagen(long codigo, String rutaImagen)`
```java
public void actualizarRutaImagen(long codigo, String rutaImagen)
```

Actualiza la ruta relativa del archivo de imagen asociado a un producto.

* **Parámetros:**
  * `codigo`: Identificador del producto.
  * `rutaImagen`: Nueva ruta de imagen en el servidor.

### `buscarExistentes(Collection<Long> codigos)`
```java
public Set<Long> buscarExistentes(Collection<Long> codigos)
```

Devuelve el conjunto de códigos que existen efectivamente en la base de datos a partir de una lista dada.

* **Parámetros:**
  * `codigos`: Colección de códigos de productos a verificar.

### `fijarMenu(Collection<Long> codigos)`
```java
public void fijarMenu(Collection<Long> codigos)
```

Habilita exactamente los productos especificados como disponibles y deshabilita todos los demás en una sola sentencia SQL eficiente.

* **Parámetros:**
  * `codigos`: Colección de identificadores de productos a incluir en el menú.
