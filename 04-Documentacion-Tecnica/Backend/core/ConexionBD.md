# `ConexionBD`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** `@Component`

> Componente de inicialización que valida la conectividad con la base de datos relacional durante el arranque del contexto Spring Boot.

## Dependencias (Constructor)
- `DataSource dataSource`

## Métodos

### `verificarConexion()`
```java
public boolean verificarConexion()
```

Ejecuta una consulta de verificación sobre el `DataSource` para comprobar la disponibilidad y estado de la conexión con PostgreSQL.

### `run(String... args)`
```java
@Override
public void run(String... args)
```

Método de callback invocado automáticamente por Spring Boot al finalizar la inicialización del contenedor de dependencias.

* **Parámetros:**
  * `args`: Argumentos pasados por línea de comandos.
