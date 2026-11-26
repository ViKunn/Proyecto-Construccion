# `ValidacionException`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** Excepción de tiempo de ejecución (`RuntimeException`)

> Excepción lanzada cuando los datos suministrados por el cliente no satisfacen las reglas de validación o formato. Contiene un mapa asociativo con los errores específicos por campo y se traduce a un código HTTP 400 (BAD REQUEST).

## Dependencias (Constructor)
- `Map<String, String> errores`

## Métodos

### `getErrores()`
```java
public Map<String, String> getErrores()
```

Retorna el mapa detallado con los nombres de campos y sus mensajes de error de validación asociados.
