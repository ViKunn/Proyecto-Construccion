package g5.backend.cafeteria.core;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class ConfiguracionWeb implements WebMvcConfigurer {

   private final String[] origenesPermitidos;

   public ConfiguracionWeb(@Value("${app.cors.origenes:http://localhost:8080}") String[] origenes) {
      this.origenesPermitidos = origenes;
   }

   /**
    * BCrypt $2a$, costo 10: compatible con los hashes de Supabase (pgcrypto bf).
    */
   @Bean
   public PasswordEncoder passwordEncoder() {
      return new BCryptPasswordEncoder(10);
   }

   /**
    * Necesario para que el navegador envíe/reciba la cookie de sesión desde otro
    * origen (frontend).
    */
   @Override
   public void addCorsMappings(CorsRegistry registry) {
      registry.addMapping("/api/**")
            .allowedOrigins(origenesPermitidos)
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowCredentials(true);
   }
}