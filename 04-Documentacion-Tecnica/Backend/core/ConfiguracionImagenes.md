# `ConfiguracionImagenes`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** `@Configuration`

> Configuración de Spring MVC para la exposición y distribución de imágenes estáticas. Mapea la ruta pública `/imagenes/**` hacia el directorio físico gestionado por `AlmacenImagenes`, configurando políticas de caché HTTP prolongadas para optimizar el rendimiento.

## Dependencias (Constructor)
- `AlmacenImagenes almacen`

## Métodos

### `addResourceHandlers(ResourceHandlerRegistry registry)`
```java
@Override
public void addResourceHandlers(ResourceHandlerRegistry registry)
```

Registra el manejador de recursos estáticos vinculando el patrón de URL `/imagenes/**` con el directorio físico del sistema de archivos.

* **Parámetros:**
  * `registry`: Registro de recursos de Spring MVC.
