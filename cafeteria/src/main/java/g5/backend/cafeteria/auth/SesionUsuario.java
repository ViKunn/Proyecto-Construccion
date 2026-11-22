package g5.backend.cafeteria.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import java.util.Arrays;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Acceso a la identidad del usuario autenticado desde cualquier controlador.
 * Los ids NUNCA se reciben del cliente: siempre salen de aquí.
 *
 * Uso en otros controladores:
 *   UsuarioAutenticado u = sesionUsuario.exigir(request, TipoUsuario.CLIENTE);
 *   long codigoCliente = u.codigoCliente();
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

   /** 401 si no hay sesión; 403 si el tipo no está permitido (sin tipos = cualquiera autenticado). */
   public UsuarioAutenticado exigir(HttpServletRequest request, TipoUsuario... permitidos) {
      UsuarioAutenticado u = actual(request)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sesión no iniciada"));
      if (permitidos.length > 0 && !Arrays.asList(permitidos).contains(u.tipo())) {
         throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acceso no permitido");
      }
      return u;
   }
}