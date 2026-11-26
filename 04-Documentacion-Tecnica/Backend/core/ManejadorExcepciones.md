# `ManejadorExcepciones`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** `@RestControllerAdvice`

> Manejador global de excepciones para todos los controladores REST de la aplicación. Estandariza un formato único de errores: `{"mensaje": "...", "errores": {"campo": "detalle"}}`.

## Métodos

### `validacion(ValidacionException e)`
```java
@ExceptionHandler(ValidacionException.class)
public ResponseEntity<Map<String, Object>> validacion(ValidacionException e)
```

Captura excepciones de validación de negocio y retorna respuesta HTTP 400 (BAD REQUEST) con los errores desglosados por campo.

* **Parámetros:**
  * `e`: Excepción de validación capturada.

### `conflicto(ConflictoException e)`
```java
@ExceptionHandler(ConflictoException.class)
public ResponseEntity<Map<String, Object>> conflicto(ConflictoException e)
```

Captura colisiones de datos y duplicidad de registros, retornando una respuesta HTTP 409 (CONFLICT).

* **Parámetros:**
  * `e`: Excepción de conflicto capturada.

### `noEncontrado(NoEncontradoException e)`
```java
@ExceptionHandler(NoEncontradoException.class)
public ResponseEntity<Map<String, Object>> noEncontrado(NoEncontradoException e)
```

Captura recursos no existentes y retorna una respuesta HTTP 404 (NOT FOUND).

* **Parámetros:**
  * `e`: Excepción de recurso no encontrado capturada.

### `archivoGrande(MaxUploadSizeExceededException e)`
```java
@ExceptionHandler(MaxUploadSizeExceededException.class)
public ResponseEntity<Map<String, Object>> archivoGrande(MaxUploadSizeExceededException e)
```

Captura intentos de carga de archivos que sobrepasan el tamaño máximo configurado y retorna una respuesta HTTP 400 (BAD REQUEST).

* **Parámetros:**
  * `e`: Excepción de tamaño de archivo excedido capturada.

### `cuerpoInvalido(HttpMessageNotReadableException e)`
```java
@ExceptionHandler(HttpMessageNotReadableException.class)
public ResponseEntity<Map<String, Object>> cuerpoInvalido(HttpMessageNotReadableException e)
```

Captura solicitudes con JSON mal formado o tipos de datos incompatibles en el cuerpo y retorna una respuesta HTTP 400 (BAD REQUEST).

* **Parámetros:**
  * `e`: Excepción de deserialización HTTP capturada.
