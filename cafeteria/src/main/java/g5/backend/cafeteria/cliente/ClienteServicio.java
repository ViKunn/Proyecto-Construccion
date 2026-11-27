package g5.backend.cafeteria.cliente;

import g5.backend.cafeteria.core.ConflictoException;
import g5.backend.cafeteria.core.ValidacionException;
import g5.backend.cafeteria.core.ValidadorDatos;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio de lógica de negocio responsable del registro y validación de clientes.
 * Aplica reglas de formato, asegura la unicidad de credenciales e identidad nacional,
 * y delega la persistencia transaccional tras generar el hash seguro de la contraseña.
 */

@Service
public class ClienteServicio {

   private static final String MSG_CORREO_DUPLICADO = "Ya existe una cuenta con este correo";
   private static final String MSG_CEDULA_DUPLICADA = "Ya existe un cliente con esta cédula";

   private final ClienteRepositorio repositorio;
   private final ValidadorDatos validador;
   private final PasswordEncoder encoder;

   public ClienteServicio(ClienteRepositorio repositorio, ValidadorDatos validador,
         PasswordEncoder encoder) {
      this.repositorio = repositorio;
      this.validador = validador;
      this.encoder = encoder;
   }

   /**
    * Registro de un nuevo cliente en el sistema 
    * @throws ValidacionException Si los datos suministrados no superan las validaciones de formato o están incompletos.
    * @throws ConflictoException Si el correo electrónico o la cédula ya pertenecen a otra cuenta existente.
    */
   public Cliente registrar(RegistroClienteRequest req) {
      if (req == null) {
         throw new ValidacionException(Map.of("cuerpo", "Debe enviar los datos del cliente"));
      }

      String nombre = validador.normalizarTexto(req.nombre());
      String apellido = validador.normalizarTexto(req.apellido());
      String cedula = validador.normalizarNumero(req.cedula());
      String celular = validador.normalizarNumero(req.celular());
      String correo = validador.normalizarCorreo(req.correo());
      String contrasena = req.contrasena();

      // 1. Validaciones de formato: se reportan todos los errores juntos
      Map<String, String> errores = new LinkedHashMap<>();
      agregar(errores, "nombre", validador.errorNombre(nombre, "El nombre"));
      agregar(errores, "apellido", validador.errorNombre(apellido, "El apellido"));
      agregar(errores, "cedula", validador.errorCedula(cedula));
      agregar(errores, "celular", validador.errorCelular(celular));
      agregar(errores, "correo", validador.errorCorreo(correo));
      agregar(errores, "contrasena", validador.errorContrasena(contrasena));
      if (!errores.isEmpty()) {
         throw new ValidacionException(errores);
      }

      // 2. Unicidad (mensajes claros antes de llegar a la restricción de la BD)
      if (repositorio.existePorCorreo(correo)) {
         throw new ConflictoException("correo", MSG_CORREO_DUPLICADO);
      }
      if (repositorio.existePorCedula(cedula)) {
         throw new ConflictoException("cedula", MSG_CEDULA_DUPLICADA);
      }

      // 3. Persistencia (el hash BCrypt se genera aquí; la contraseña nunca se guarda
      // ni se registra)
      try {
         return repositorio.insertar(correo, encoder.encode(contrasena),
               nombre, apellido, cedula, celular);
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