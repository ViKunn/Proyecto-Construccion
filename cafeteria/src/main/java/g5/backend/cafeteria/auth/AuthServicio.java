package g5.backend.cafeteria.auth;

import g5.backend.cafeteria.auth.AuthRepositorio.RegistroLogin;
import g5.backend.cafeteria.core.NoEncontradoException;
import g5.backend.cafeteria.core.ValidacionException;
import g5.backend.cafeteria.core.ValidadorDatos;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio de lógica de negocio responsable del proceso de autenticación de usuarios.
 * Valida formatos, verifica credenciales contra hashes BCrypt y mitiga ataques de temporización
 * (timing attacks) para evitar la enumeración de usuarios en el sistema.
 */

@Service
public class AuthServicio {

   private static final Logger log = LoggerFactory.getLogger(AuthServicio.class);
   private static final int MAX_CORREO = 254;
   private static final int MAX_CONTRASENA = 128;

   private final AuthRepositorio repositorio;
   private final PasswordEncoder encoder;
   private final ValidadorDatos validador;
   /** Hash válido para comparar aunque el correo no exista (evita revelar usuarios por tiempo de respuesta). */
   private final String hashFalso;

   public AuthServicio(AuthRepositorio repositorio, PasswordEncoder encoder, ValidadorDatos validador) {
      this.repositorio = repositorio;
      this.encoder = encoder;
      this.validador = validador;
      this.hashFalso = encoder.encode("hash-falso-para-igualar-tiempos");
   }

   /**
    * Realiza la validación integral de credenciales de acceso para un usuario.
    * Devuelve vacío ante CUALQUIER fallo (correo inexistente, contraseña incorrecta, 
    * datos inconsistentes) para no filtrar información.
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

   /**
    * Cambia la contraseña del usuario autenticado (HU-USU-01). Sirve para los tres tipos
    * de usuario: cliente, trabajador y administrador, porque todos comparten la tabla usuario.
    *
    * <p>Reglas: la contraseña actual debe ser correcta; la nueva debe cumplir la política
    * de {@link ValidadorDatos#errorContrasena(String)} (mínimo 8 caracteres, al menos una
    * letra y un número, máximo 72 bytes) y ser distinta de la actual. Se guarda solo el
    * hash BCrypt.</p>
    *
    * @param idUsuario        id del usuario, tomado de la sesión (nunca del frontend)
    * @param contrasenaActual contraseña vigente, para confirmar la identidad
    * @param contrasenaNueva  contraseña que reemplazará a la actual
    * @throws ValidacionException   si algún dato no es válido o la contraseña actual es incorrecta
    * @throws NoEncontradoException si el usuario de la sesión ya no existe
    */
   public void cambiarContrasena(long idUsuario, String contrasenaActual, String contrasenaNueva) {
      Map<String, String> errores = new LinkedHashMap<>();
      if (contrasenaActual == null || contrasenaActual.isEmpty()) {
         errores.put("contrasenaActual", "La contraseña actual es obligatoria");
      } else if (contrasenaActual.length() > MAX_CONTRASENA) {
         errores.put("contrasenaActual", "La contraseña actual es incorrecta");
      }
      String errorNueva = validador.errorContrasena(contrasenaNueva);
      if (errorNueva != null) {
         errores.put("contrasenaNueva", errorNueva);
      }
      if (!errores.isEmpty()) {
         throw new ValidacionException(errores);
      }

      String hashActual = repositorio.buscarHashPorId(idUsuario)
            .orElseThrow(() -> new NoEncontradoException("Usuario no encontrado"));

      if (!encoder.matches(contrasenaActual, hashActual)) {
         throw new ValidacionException(Map.of("contrasenaActual", "La contraseña actual es incorrecta"));
      }
      if (contrasenaNueva.equals(contrasenaActual)) {
         throw new ValidacionException(Map.of("contrasenaNueva",
               "La nueva contraseña debe ser distinta de la actual"));
      }

      if (!repositorio.actualizarContrasena(idUsuario, encoder.encode(contrasenaNueva))) {
         throw new NoEncontradoException("Usuario no encontrado");
      }
      log.info("Contraseña actualizada para el usuario {}", idUsuario);
   }
}