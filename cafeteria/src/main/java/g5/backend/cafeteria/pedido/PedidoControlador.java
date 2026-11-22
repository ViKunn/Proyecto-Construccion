package g5.backend.cafeteria.pedido;

import com.fasterxml.jackson.annotation.JsonInclude;
import g5.backend.cafeteria.auth.SesionUsuario;
import g5.backend.cafeteria.auth.TipoUsuario;
import g5.backend.cafeteria.auth.UsuarioAutenticado;
import jakarta.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoControlador {

   private static final TipoUsuario[] PERSONAL = {TipoUsuario.TRABAJADOR, TipoUsuario.ADMINISTRADOR};

   // ---------------------------- DTOs ----------------------------

   public record CrearPedidoRequest(List<ItemPedido> items) {
   }

   public record CodigoRetiroRequest(String codigoRetiro) {
   }

   public record DetalleDto(long codigoProducto, String nombre, BigDecimal precioUnitario,
                            int cantidad, BigDecimal subtotal) {
      static DetalleDto de(DetallePedido d) {
         return new DetalleDto(d.codigoProducto(), d.nombreProducto(), d.precioUnitario(),
               d.cantidad(), d.subtotal());
      }
   }

   public record ClienteDto(String nombre, String apellido) {
   }

   /**
    * Cliente: ve su codigoRetiro. Personal: ve al cliente pero NO el código (lo verifican contra lo que
    * presenta el cliente; si lo vieran, la verificación no tendría sentido). Los null se omiten del JSON.
    */
   @JsonInclude(JsonInclude.Include.NON_NULL)
   public record PedidoDto(long idPedido, EstadoPedido estado, OffsetDateTime fechaRegistro,
                           BigDecimal importeTotal, String codigoRetiro, ClienteDto cliente,
                           List<DetalleDto> items) {

      static PedidoDto paraCliente(Pedido p) {
         return new PedidoDto(p.idPedido(), p.estado(), p.fechaRegistro(), p.importeTotal(),
               p.codigoRetiro(), null, items(p));
      }

      static PedidoDto paraPersonal(Pedido p) {
         return new PedidoDto(p.idPedido(), p.estado(), p.fechaRegistro(), p.importeTotal(),
               null, new ClienteDto(p.clienteNombre(), p.clienteApellido()), items(p));
      }

      private static List<DetalleDto> items(Pedido p) {
         return p.detalles().stream().map(DetalleDto::de).toList();
      }
   }

   private final PedidoServicio servicio;
   private final SesionUsuario sesion;

   public PedidoControlador(PedidoServicio servicio, SesionUsuario sesion) {
      this.servicio = servicio;
      this.sesion = sesion;
   }

   // ---------------------------- Público ----------------------------

   /** Reglas que el frontend puede necesitar. cantidadMaximaPorProducto = -1 significa sin límite. */
   @GetMapping("/configuracion")
   public Map<String, Integer> configuracion() {
      return Map.of("cantidadMaximaPorProducto", servicio.cantidadMaximaPorProducto());
   }

   // ---------------------------- Cliente ----------------------------

   /** PN-01: confirma el pedido. Body: {"items":[{"codigoProducto":1,"cantidad":2}]}. El cliente sale de la sesión. */
   @PostMapping
   public ResponseEntity<PedidoDto> crear(@RequestBody(required = false) CrearPedidoRequest body,
                                          HttpServletRequest request) {
      UsuarioAutenticado u = sesion.exigir(request, TipoUsuario.CLIENTE);
      Pedido pedido = servicio.crear(u.codigoCliente(), body == null ? null : body.items());
      return ResponseEntity.status(HttpStatus.CREATED).body(PedidoDto.paraCliente(pedido));
   }

   /** RU-05: pedidos del cliente autenticado, del más reciente al más antiguo. */
   @GetMapping("/mis-pedidos")
   public List<PedidoDto> misPedidos(@RequestParam(value = "limite", required = false) Integer limite,
                                     HttpServletRequest request) {
      UsuarioAutenticado u = sesion.exigir(request, TipoUsuario.CLIENTE);
      return servicio.listarDeCliente(u.codigoCliente(), limite).stream()
            .map(PedidoDto::paraCliente).toList();
   }

   // ---------------------------- Cliente o personal ----------------------------

   @GetMapping("/{id}")
   public PedidoDto obtener(@PathVariable("id") long id, HttpServletRequest request) {
      UsuarioAutenticado u = sesion.exigir(request);
      if (u.tipo() == TipoUsuario.CLIENTE) {
         return PedidoDto.paraCliente(servicio.obtenerDeCliente(id, u.codigoCliente()));
      }
      return PedidoDto.paraPersonal(servicio.obtenerCompleto(id));
   }

   // ---------------------------- Personal ----------------------------

   /** RU-07: sin estado = pedidos en curso; ?estado=entregado = registro. Opcional: &limite=100 (máx. 500). */
   @GetMapping
   public List<PedidoDto> listar(@RequestParam(value = "estado", required = false) String estado,
                                 @RequestParam(value = "limite", required = false) Integer limite,
                                 HttpServletRequest request) {
      sesion.exigir(request, PERSONAL);
      return servicio.listarParaPersonal(estado, limite).stream()
            .map(PedidoDto::paraPersonal).toList();
   }

   // Los cambios de estado los hace solo un TRABAJADOR: el historial exige id_trabajador

   @PostMapping("/{id}/iniciar-preparacion")
   public PedidoDto iniciarPreparacion(@PathVariable("id") long id, HttpServletRequest request) {
      UsuarioAutenticado u = sesion.exigir(request, TipoUsuario.TRABAJADOR);
      return PedidoDto.paraPersonal(servicio.iniciarPreparacion(id, u.idTrabajador()));
   }

   @PostMapping("/{id}/marcar-listo")
   public PedidoDto marcarListo(@PathVariable("id") long id, HttpServletRequest request) {
      UsuarioAutenticado u = sesion.exigir(request, TipoUsuario.TRABAJADOR);
      return PedidoDto.paraPersonal(servicio.marcarListo(id, u.idTrabajador()));
   }

   /** Solo comprueba el código; no cambia el estado. Body: {"codigoRetiro":"A2B3C4"} */
   @PostMapping("/{id}/verificar-codigo")
   public Map<String, Boolean> verificarCodigo(@PathVariable("id") long id,
                                               @RequestBody(required = false) CodigoRetiroRequest body,
                                               HttpServletRequest request) {
      sesion.exigir(request, TipoUsuario.TRABAJADOR);
      String codigo = body == null ? null : body.codigoRetiro();
      return Map.of("valido", servicio.verificarCodigo(id, codigo));
   }

   /** Entrega el pedido: exige estado "listo" y volver a verificar el código. Body: {"codigoRetiro":"A2B3C4"} */
   @PostMapping("/{id}/entregar")
   public PedidoDto entregar(@PathVariable("id") long id,
                             @RequestBody(required = false) CodigoRetiroRequest body,
                             HttpServletRequest request) {
      UsuarioAutenticado u = sesion.exigir(request, TipoUsuario.TRABAJADOR);
      String codigo = body == null ? null : body.codigoRetiro();
      return PedidoDto.paraPersonal(servicio.entregar(id, u.idTrabajador(), codigo));
   }
}