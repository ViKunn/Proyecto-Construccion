# `ConflictoException`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** Excepción de tiempo de ejecución (`RuntimeException`)

> Excepción lanzada cuando ocurre un conflicto con el estado actual de los datos, tales como duplicados o condiciones de carrera concurrentes. Es capturada por el manejador global para traducirse en una respuesta HTTP 409 (CONFLICT).

## Dependencias (Constructor)
- `String campo, String mensaje`

## Métodos

### `getErrores()`
```java
public Map<String, String> getErrores()
```

Retorna el mapa asociativo con el campo causante del conflicto y su correspondiente mensaje descriptivo.
