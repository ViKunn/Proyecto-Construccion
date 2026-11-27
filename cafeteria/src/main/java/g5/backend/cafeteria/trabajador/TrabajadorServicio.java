package g5.backend.cafeteria.trabajador;

import g5.backend.cafeteria.core.ConflictoException;
import g5.backend.cafeteria.core.ValidacionException;
import g5.backend.cafeteria.core.ValidadorDatos;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio de lógica de negocio encargado de la administración del personal operativo.
 */

@Service
public class TrabajadorServicio {

   private static final String MSG_CORREO_DUPLICADO = "Ya existe una cuenta con este correo";
   private static final String MSG_CEDULA_DUPLICADA = "Ya existe un trabajador con esta cédula";

   private final TrabajadorRepositorio repositorio;
   private final ValidadorDatos validador;
   private final PasswordEncoder encoder;

   public TrabajadorServicio(TrabajadorRepositorio repositorio, ValidadorDatos validador,
         PasswordEncoder encoder) {
      this.repositorio = repositorio;
      this.validador = validador;
      this.encoder = encoder;
   }

   public List<Trabajador> listar() {
      return repositorio.listar();
   }

   public Trabajador registrar(RegistroTrabajadorRequest req) {
      if (req == null) {
         throw new ValidacionException(Map.of("cuerpo", "Debe enviar los datos del trabajador"));
      }

      String nombre = validador.normalizarTexto(req.nombre());
      String apellido = validador.normalizarTexto(req.apellido());
      String cedula = validador.normalizarNumero(req.cedula());
      String correo = validador.normalizarCorreo(req.correo());
      String contrasena = req.contrasena();

      Map<String, String> errores = new LinkedHashMap<>();
      agregar(errores, "nombre", validador.errorNombre(nombre, "El nombre"));
      agregar(errores, "apellido", validador.errorNombre(apellido, "El apellido"));
      agregar(errores, "cedula", validador.errorCedula(cedula));
      agregar(errores, "correo", validador.errorCorreo(correo));
      agregar(errores, "contrasena", validador.errorContrasena(contrasena));
      if (!errores.isEmpty()) {
         throw new ValidacionException(errores);
      }

      if (repositorio.existePorCorreo(correo)) {
         throw new ConflictoException("correo", MSG_CORREO_DUPLICADO);
      }
      if (repositorio.existePorCedula(cedula)) {
         throw new ConflictoException("cedula", MSG_CEDULA_DUPLICADA);
      }

      try {
         return repositorio.insertar(correo, encoder.encode(contrasena), nombre, apellido, cedula);
      } catch (DuplicateKeyException e) {
         // Carrera: otro registro idéntico se confirmó entre la verificación y el insert
         if (repositorio.existePorCorreo(correo)) {
            throw new ConflictoException("correo", MSG_CORREO_DUPLICADO);
         }
         throw new ConflictoException("cedula", MSG_CEDULA_DUPLICADA);
      }
   }

   private static void agregar(Map<String, String> errores, String campo, String error) {
      if (error != null) {
         errores.put(campo, error);
      }
   }
}