package g5.backend.cafeteria.trabajador;

import g5.backend.cafeteria.auth.SesionUsuario;
import g5.backend.cafeteria.auth.TipoUsuario;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Gestión de trabajadores: solo el administrador. */
@RestController
@RequestMapping("/api/trabajadores")
public class TrabajadorControlador {

   private final TrabajadorServicio servicio;
   private final SesionUsuario sesion;

   public TrabajadorControlador(TrabajadorServicio servicio, SesionUsuario sesion) {
      this.servicio = servicio;
      this.sesion = sesion;
   }

   @GetMapping
   public List<Trabajador> listar(HttpServletRequest request) {
      sesion.exigir(request, TipoUsuario.ADMINISTRADOR);
      return servicio.listar();
   }

   /**
    * Crea la cuenta (usuario + perfil de trabajador). El administrador define la
    * contraseña inicial.
    */
   @PostMapping
   public ResponseEntity<Trabajador> registrar(@RequestBody(required = false) RegistroTrabajadorRequest body,
         HttpServletRequest request) {
      sesion.exigir(request, TipoUsuario.ADMINISTRADOR);
      return ResponseEntity.status(HttpStatus.CREATED).body(servicio.registrar(body));
   }
}