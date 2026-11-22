package g5.backend.cafeteria.core;

import java.time.Duration;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Publica el directorio de imágenes en GET /imagenes/** (p. ej. /imagenes/bebida/cafe-americano-1a2b3c4d.png). */
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