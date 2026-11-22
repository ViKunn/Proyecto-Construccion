package g5.backend.cafeteria.historial;

import g5.backend.cafeteria.auth.SesionUsuario;
import g5.backend.cafeteria.auth.TipoUsuario;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Historial de pedidos y de sus cambios de estado: solo el administrador. */
@RestController
@RequestMapping("/api/historial-pedidos")
public class HistorialControlador {

   private final HistorialServicio servicio;
   private final SesionUsuario sesion;

   public HistorialControlador(HistorialServicio servicio, SesionUsuario sesion) {
      this.servicio = servicio;
      this.sesion = sesion;
   }

   /**
    * Historial paginado por pedido (más recientes primero). Filtros opcionales:
    * ?idPedido=&pagina=0&limite=50
    */
   @GetMapping
   public HistorialServicio.Pagina listar(
         @RequestParam(value = "idPedido", required = false) Long idPedido,
         @RequestParam(value = "pagina", required = false) Integer pagina,
         @RequestParam(value = "limite", required = false) Integer limite,
         HttpServletRequest request) {
      sesion.exigir(request, TipoUsuario.ADMINISTRADOR);
      return servicio.listar(idPedido, pagina, limite);
   }

   /**
    * Detalle del pedido seleccionado: datos, cliente, productos y cambios de
    * estado.
    */
   @GetMapping("/{idPedido}")
   public PedidoDetalleAdmin detalle(@PathVariable("idPedido") long idPedido, HttpServletRequest request) {
      sesion.exigir(request, TipoUsuario.ADMINISTRADOR);
      return servicio.detalle(idPedido);
   }
}