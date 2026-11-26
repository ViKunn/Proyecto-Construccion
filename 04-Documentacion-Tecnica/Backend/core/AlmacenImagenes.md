# `AlmacenImagenes`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** `@Component`

> Componente encargado del almacenamiento, validación y gestión de imágenes de productos en disco. Implementa medidas de seguridad como nombres generados aleatoriamente por el servidor mediante slugs y UUID, detección de formatos reales a través de números mágicos (magic bytes) en lugar de extensiones arbitrarias, y restricción de rutas para evitar ataques de salto de directorio (directory traversal).

## Dependencias (Constructor)
- `String directorio` (`@Value("${app.imagenes.directorio:uploads/productos}")`)
- `long maxBytes` (`@Value("${app.imagenes.max-bytes:2097152}")`)

## Métodos

### `directorioBase()`
```java
public Path directorioBase()
```

Retorna la ruta absoluta del directorio base de almacenamiento en el servidor.

### `errorImagen(MultipartFile archivo)`
```java
public String errorImagen(MultipartFile archivo)
```

Valida el archivo de imagen: comprueba que no sea nulo ni vacío, que no supere el tamaño máximo establecido (2 MB por defecto) y verifica que los primeros bytes correspondan a formatos reales válidos (PNG, JPEG, WebP).

* **Parámetros:**
  * `archivo`: Archivo multipart recibido.

### `guardar(MultipartFile archivo, String subcarpeta, String nombreBase)`
```java
public String guardar(MultipartFile archivo, String subcarpeta, String nombreBase)
```

Almacena de forma segura una imagen en disco generando un nombre único con UUID y slug sanitizado.

* **Parámetros:**
  * `archivo`: Archivo multipart a guardar.
  * `subcarpeta`: Subdirectorio de destino (ej. "bebida" o "alimento").
  * `nombreBase`: Nombre descriptivo para la generación del slug.

### `eliminar(String rutaRelativa)`
```java
public void eliminar(String rutaRelativa)
```

Elimina un archivo de imagen en disco validando estrictamente que su ruta normalizada resida dentro del directorio base configurado.

* **Parámetros:**
  * `rutaRelativa`: Ruta relativa del archivo a remover.
