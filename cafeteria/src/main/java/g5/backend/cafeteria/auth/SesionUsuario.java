package g5.backend.cafeteria.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Componente transversal para la gestión del estado y ciclo de vida de la sesión HTTP.
 * Centraliza el acceso seguro a la identidad del usuario autenticado desde los controladores,
 * garantizando que los identificadores de cliente y personal nunca provengan de datos manipulables por el cliente.
 * Además, previene ataques de fijación de sesión (session fixation) y aplica control de acceso por roles.
 */
@Component
public class SesionUsuario {

   public static final String ATRIBUTO = "USUARIO_AUTENTICADO";

   public void iniciar(HttpServletRequest request, UsuarioAutenticado usuario) {
      HttpSession anterior = request.getSession(false);
      if (anterior != null) {
         anterior.invalidate();          // evita fijación de sesión
      }
      request.getSession(true).setAttribute(ATRIBUTO, usuario);
   }

   public void cerrar(HttpServletRequest request) {
      HttpSession s = request.getSession(false);
      if (s != null) {
         s.invalidate();
      }
   }

   public Optional<UsuarioAutenticado> actual(HttpServletRequest request) {
      HttpSession s = request.getSession(false);
      if (s == null) {
         return Optional.empty();
      }
      Object o = s.getAttribute(ATRIBUTO);
      return o instanceof UsuarioAutenticado u ? Optional.of(u) : Optional.empty();
   }

   /**
    * Exige la existencia de una sesión autenticada y verifica que el rol del usuario figure entre los permitidos.
    * @throws ResponseStatusException con estado 401 (UNAUTHORIZED) si no hay sesión, o 403 (FORBIDDEN) si el tipo de usuario no está autorizado.
    */
   public UsuarioAutenticado exigir(HttpServletRequest request, TipoUsuario... permitidos) {
      UsuarioAutenticado u = actual(request)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no iniciada"));
      if (permitidos.length > 0 && !Arrays.asList(permitidos).contains(u.tipo())) {
         throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso no permitido");
      }
      return u;
   }
}