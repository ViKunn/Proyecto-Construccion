package g5.backend.cafeteria.core;

import java.time.Duration;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración de Spring MVC para la exposición y distribución de imágenes estáticas.
 * Mapea la ruta pública {@code /imagenes/**} hacia el directorio físico gestionado por {@link AlmacenImagenes},
 * configurando políticas de caché HTTP prolongadas para optimizar el rendimiento.
 */

@Configuration
public class ConfiguracionImagenes implements WebMvcConfigurer {

   private final AlmacenImagenes almacen;

   public ConfiguracionImagenes(AlmacenImagenes almacen) {
      this.almacen = almacen;
   }

   @Override
   public void addResourceHandlers(ResourceHandlerRegistry registry) {
      String ubicacion = almacen.directorioBase().toUri().toString();
      if (!ubicacion.endsWith("/")) {
         ubicacion += "/";
      }
      // Los nombres de archivo son únicos por subida, por lo que es seguro cachear
      registry.addResourceHandler("/imagenes/**")
            .addResourceLocations(ubicacion)
            .setCacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic());
   }
}