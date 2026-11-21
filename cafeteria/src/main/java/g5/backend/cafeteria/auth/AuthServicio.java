package g5.backend.cafeteria.auth;

import g5.backend.cafeteria.auth.AuthRepositorio.RegistroLogin;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServicio {

   private static final Logger log = LoggerFactory.getLogger(AuthServicio.class);
   private static final int MAX_CORREO = 254;
   private static final int MAX_CONTRASENA = 128;

   private final AuthRepositorio repositorio;
   private final PasswordEncoder encoder;
   /** Hash válido para comparar aunque el correo no exista (evita revelar usuarios por tiempo de respuesta). */
   private final String hashFalso;

   public AuthServicio(AuthRepositorio repositorio, PasswordEncoder encoder) {
      this.repositorio = repositorio;
      this.encoder = encoder;
      this.hashFalso = encoder.encode("hash-falso-para-igualar-tiempos");
   }

   /**
    * Valida credenciales. Devuelve vacío ante CUALQUIER fallo (correo inexistente,
    * contraseña incorrecta, datos inconsistentes) para no filtrar información.
    */
   public Optional<UsuarioAutenticado> autenticar(String correo, String contrasena) {
      if (correo == null || contrasena == null) {
         return Optional.empty();
      }
      String correoNorm = correo.trim();
      if (correoNorm.isEmpty() || contrasena.isEmpty()
            || correoNorm.length() > MAX_CORREO || contrasena.length() > MAX_CONTRASENA) {
         return Optional.empty();
      }

      Optional<RegistroLogin> registro = repositorio.buscarPorCorreo(correoNorm);
      if (registro.isEmpty()) {
         encoder.matches(contrasena, hashFalso);
         return Optional.empty();
      }

      RegistroLogin r = registro.get();
      if (!encoder.matches(contrasena, r.contrasenaHash())) {
         return Optional.empty();
      }

      // Cliente y trabajador deben tener perfil; el administrador no.
      if (r.tipo() != TipoUsuario.ADMINISTRADOR && r.idPerfil() == null) {
         log.warn("Usuario {} ({}) sin perfil asociado; acceso denegado", r.idUsuario(), r.tipo());
         return Optional.empty();
      }

      return Optional.of(new UsuarioAutenticado(
            r.idUsuario(), r.tipo(), r.idPerfil(), r.correo(), r.nombre(), r.apellido()));
   }
}