package g5.backend.cafeteria.auth;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthControlador {

   public record LoginRequest(String correo, String contrasena) {
   }

   /** Lo único que ve el navegador. Los ids permanecen en la sesión del servidor. */
   public record SesionDto(TipoUsuario tipo, String nombre, String apellido, String correo) {
      static SesionDto de(UsuarioAutenticado u) {
         return new SesionDto(u.tipo(), u.nombre(), u.apellido(), u.correo());
      }
   }

   private final AuthServicio servicio;
   private final SesionUsuario sesion;

   public AuthControlador(AuthServicio servicio, SesionUsuario sesion) {
      this.servicio = servicio;
      this.sesion = sesion;
   }

   @PostMapping("/login")
   public ResponseEntity<?> login(@RequestBody(required = false) LoginRequest body,
                                  HttpServletRequest request) {
      Optional<UsuarioAutenticado> usuario = body == null
            ? Optional.empty()
            : servicio.autenticar(body.correo(), body.contrasena());

      if (usuario.isEmpty()) {
         return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
               .body(Map.of("mensaje", "Correo o contraseña incorrectos"));
      }
      sesion.iniciar(request, usuario.get());
      return ResponseEntity.ok(SesionDto.de(usuario.get()));
   }

   /** Permite al frontend restaurar la sesión al recargar la página. */
   @GetMapping("/me")
   public ResponseEntity<?> me(HttpServletRequest request) {
      return sesion.actual(request)
            .<ResponseEntity<?>>map(u -> ResponseEntity.ok(SesionDto.de(u)))
            .orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                  .body(Map.of("mensaje", "Sesión no iniciada")));
   }

   @PostMapping("/logout")
   public ResponseEntity<Void> logout(HttpServletRequest request) {
      sesion.cerrar(request);
      return ResponseEntity.noContent().build();
   }
}