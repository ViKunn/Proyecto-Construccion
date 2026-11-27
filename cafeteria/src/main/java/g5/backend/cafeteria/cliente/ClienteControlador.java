package g5.backend.cafeteria.cliente;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controlador REST que expone las operaciones públicas asociadas a los clientes.
 * Proporciona el punto de entrada para el registro de nuevos usuarios en la plataforma.
 */
@RestController
@RequestMapping("/api/clientes")
public class ClienteControlador {

   /** Respuesta mínima: no se exponen ids internos, cédula ni hash. */
   public record ClienteRegistradoDto(String nombre, String apellido, String correo) {
   }

   private final ClienteServicio servicio;

   public ClienteControlador(ClienteServicio servicio) {
      this.servicio = servicio;
   }

   @PostMapping("/registro")
   public ResponseEntity<ClienteRegistradoDto> registrar(@RequestBody(required = false) RegistroClienteRequest body) {
      Cliente c = servicio.registrar(body);
      return ResponseEntity.status(HttpStatus.CREATED)
            .body(new ClienteRegistradoDto(c.nombre(), c.apellido(), c.correo()));
   }
}