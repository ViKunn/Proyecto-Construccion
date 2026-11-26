# `ProductoControlador`

**Paquete:** `g5.backend.cafeteria.producto`  
**Estereotipo / Anotaciones:** `@RestController @RequestMapping("/api/productos")`

> Controlador REST para el catálogo de productos y la administración del menú. Ofrece rutas públicas para la consulta del menú para clientes (RU-01) y rutas protegidas para la creación, actualización y gestión de imágenes por parte del personal (RU-06).

## Dependencias (Constructor)
- `ProductoServicio servicio`
- `SesionUsuario sesion`

## Clases / Records Internos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `record` | `ProductoDto` | Estructura DTO de producto adaptada para su consumo en la interfaz de usuario. ([ProductoControlador.ProductoDto.md](./ProductoControlador.ProductoDto.md)) |
| `record` | `CambioProductoRequest` | DTO para la modificación parcial de atributos de un producto. ([ProductoControlador.CambioProductoRequest.md](./ProductoControlador.CambioProductoRequest.md)) |
| `record` | `MenuRequest` | DTO para la solicitud de configuración masiva del menú diario. ([ProductoControlador.MenuRequest.md](./ProductoControlador.MenuRequest.md)) |

## Métodos

### `menu()`
```java
@GetMapping("/menu")
public List<ProductoDto> menu()
```

RU-01: Menú con productos disponibles y sus precios vigentes. No requiere autenticación.

### `listar(String tipo, Boolean disponible, HttpServletRequest request)`
```java
@GetMapping
public List<ProductoDto> listar(@RequestParam(value = "tipo", required = false) String tipo, @RequestParam(value = "disponible", required = false) Boolean disponible, HttpServletRequest request)
```

Catálogo completo de productos para el personal. Filtros opcionales: `?tipo=bebida|alimento&disponible=true|false`. Requiere rol de personal (trabajador o administrador).

* **Parámetros:**
  * `tipo`: Filtro opcional por categoría ('bebida' o 'alimento').
  * `disponible`: Filtro opcional por disponibilidad (`true` o `false`).
  * `request`: Solicitud HTTP para control de acceso y verificación de sesión.

### `obtener(long codigo, HttpServletRequest request)`
```java
@GetMapping("/{codigo}")
public ProductoDto obtener(@PathVariable("codigo") long codigo, HttpServletRequest request)
```

Obtiene la información detallada de un producto por su código. Requiere rol de personal.

* **Parámetros:**
  * `codigo`: Identificador del producto.
  * `request`: Solicitud HTTP para verificación de sesión.

### `crear(String nombre, String precio, String tipo, MultipartFile imagen, HttpServletRequest request)`
```java
@PostMapping(consumes = "multipart/form-data")
public ResponseEntity<ProductoDto> crear(@RequestParam(value = "nombre", required = false) String nombre, @RequestParam(value = "precio", required = false) String precio, @RequestParam(value = "tipo", required = false) String tipo, @RequestParam(value = "imagen", required = false) MultipartFile imagen, HttpServletRequest request)
```

Crea un nuevo producto en el catálogo junto con su imagen opcional (`multipart/form-data`). Requiere rol de personal.

* **Parámetros:**
  * `nombre`: Nombre comercial del producto.
  * `precio`: Precio en formato texto a ser validado y parseado.
  * `tipo`: Categoría del producto.
  * `imagen`: Archivo de imagen adjunto.
  * `request`: Solicitud HTTP para verificación de sesión.

### `actualizar(long codigo, CambioProductoRequest body, HttpServletRequest request)`
```java
@PatchMapping("/{codigo}")
public ProductoDto actualizar(@PathVariable("codigo") long codigo, @RequestBody(required = false) CambioProductoRequest body, HttpServletRequest request)
```

RU-06: Permite al personal cambiar el nombre, precio y/o disponibilidad de un producto existente (modificación parcial vía JSON). Requiere rol de personal.

* **Parámetros:**
  * `codigo`: Identificador del producto a modificar.
  * `body`: Atributos que se desean actualizar.
  * `request`: Solicitud HTTP para verificación de sesión.

### `reemplazarImagen(long codigo, MultipartFile imagen, HttpServletRequest request)`
```java
@PutMapping(value = "/{codigo}/imagen", consumes = "multipart/form-data")
public ProductoDto reemplazarImagen(@PathVariable("codigo") long codigo, @RequestParam(value = "imagen", required = false) MultipartFile imagen, HttpServletRequest request)
```

Reemplaza la imagen del producto (`multipart/form-data`, campo "imagen"). Requiere rol de personal.

* **Parámetros:**
  * `codigo`: Identificador del producto.
  * `imagen`: Nuevo archivo de imagen que sustituye al anterior.
  * `request`: Solicitud HTTP para verificación de sesión.

### `armarMenu(MenuRequest body, HttpServletRequest request)`
```java
@PutMapping("/menu")
public List<ProductoDto> armarMenu(@RequestBody(required = false) MenuRequest body, HttpServletRequest request)
```

Arma el menú diario: los productos indicados en la lista quedan disponibles y todos los demás pasan a estar no disponibles. Requiere rol de personal.

* **Parámetros:**
  * `body`: Lista con los identificadores de productos que formarán el menú activo.
  * `request`: Solicitud HTTP para verificación de sesión.
