# `ConfiguracionWeb`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** `@Configuration`

> Configuración web y de seguridad para la aplicación Spring MVC. Define el encoder para almacenamiento seguro de contraseñas y configura las políticas de CORS.

## Dependencias (Constructor)
- `String[] origenes` (`@Value("${app.cors.origenes:http://localhost:8080}")`)

## Métodos

### `passwordEncoder()`
```java
@Bean
public PasswordEncoder passwordEncoder()
```

Declara el bean de cifrado de contraseñas utilizando el algoritmo seguro BCrypt.

### `addCorsMappings(CorsRegistry registry)`
```java
@Override
public void addCorsMappings(CorsRegistry registry)
```

Configura las reglas de intercambio de recursos de origen cruzado (CORS), permitiendo métodos HTTP estándar, cookies y credenciales desde los orígenes configurados.

* **Parámetros:**
  * `registry`: Registro de mapeos CORS de Spring MVC.
