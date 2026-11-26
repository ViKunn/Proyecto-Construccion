package g5.backend.cafeteria.pedido;

import g5.backend.cafeteria.core.ConflictoException;
import g5.backend.cafeteria.core.NoEncontradoException;
import g5.backend.cafeteria.core.ValidacionException;
import g5.backend.cafeteria.core.ValidadorPedido;
import g5.backend.cafeteria.pedido.PedidoRepositorio.ProductoPedido;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

/**
 * Servicio de lógica de negocio que orquesta la creación, consulta y transición
 * de estados de pedidos.
 */
@Service
public class PedidoServicio {

   private static final int LIMITE_POR_DEFECTO = 100;
   private static final int LIMITE_MAXIMO = 500;
   private static final String MSG_ORDEN = "Los pedidos solo avanzan en orden: pendiente → en_preparacion → listo → entregado";

   private final PedidoRepositorio repositorio;
   private final ValidadorPedido validador;

   public PedidoServicio(PedidoRepositorio repositorio, ValidadorPedido validador) {
      this.repositorio = repositorio;
      this.validador = validador;
   }

   // ------------------------------------------------------------------
   // Creación (PN-01)
   // ------------------------------------------------------------------

   /**
    * Límite de unidades por producto (-1 = sin límite). El frontend puede usarlo
    * para limitar el selector.
    */
   public int cantidadMaximaPorProducto() {
      return validador.limiteCantidad();
   }

   /**
    * Crea el pedido del cliente. El servidor recalcula todo: precios y total salen
    * de la base de datos,
    * nunca del frontend.
    */
   public Pedido crear(long codigoCliente, List<ItemPedido> items) {
      String errorItems = validador.errorItems(items);
      if (errorItems != null) {
         throw new ValidacionException(Map.of("items", errorItems));
      }

      // Si el mismo producto viene repetido, se suman las cantidades
      Map<Long, Long> solicitado = new LinkedHashMap<>();
      for (ItemPedido i : items) {
         solicitado.merge(i.codigoProducto(), i.cantidad().longValue(), Long::sum);
      }

      Map<Long, ProductoPedido> productos = repositorio.buscarProductos(solicitado.keySet());
      Map<String, String> errores = new LinkedHashMap<>();
      solicitado.forEach((codigo, cantidad) -> {
         ProductoPedido p = productos.get(codigo);
         String clave = "producto." + codigo;
         if (p == null) {
            errores.put(clave, "El producto " + codigo + " no existe");
         } else if (!p.disponible()) {
            errores.put(clave, "El producto '" + p.nombre() + "' no está disponible (RN-NEG-02)");
         } else {
            String error = validador.errorCantidad(p.nombre(), cantidad);
            if (error != null) {
               errores.put(clave, error);
            }
         }
      });
      if (!errores.isEmpty()) {
         throw new ValidacionException(errores);
      }

      Map<Long, Integer> finales = new LinkedHashMap<>();
      solicitado.forEach((codigo, cantidad) -> finales.put(codigo, cantidad.intValue()));

      long idPedido;
      try {
         idPedido = repositorio.crearPedido(codigoCliente, finales);
      } catch (DataAccessException e) {
         // Carrera: un producto se deshabilitó entre la validación y el insert
         if (mensajeRaiz(e).contains("RN-NEG-02")) {
            throw new ConflictoException("items",
                  "Algún producto dejó de estar disponible. Actualiza el menú e inténtalo de nuevo");
         }
         throw e;
      }
      return obtenerCompleto(idPedido);
   }

   // ------------------------------------------------------------------
   // Consultas
   // ------------------------------------------------------------------

   public Pedido obtenerCompleto(long idPedido) {
      Pedido pedido = repositorio.buscarPorId(idPedido)
            .orElseThrow(() -> new NoEncontradoException("Pedido no encontrado"));
      Map<Long, List<DetallePedido>> detalles = repositorio.buscarDetalles(List.of(idPedido));
      return pedido.conDetalles(detalles.getOrDefault(idPedido, List.of()));
   }

   /**
    * Un cliente solo puede ver sus propios pedidos; para los ajenos responde como
    * si no existieran.
    */
   public Pedido obtenerDeCliente(long idPedido, long codigoCliente) {
      Pedido pedido = obtenerCompleto(idPedido);
      if (pedido.codigoCliente() != codigoCliente) {
         throw new NoEncontradoException("Pedido no encontrado");
      }
      return pedido;
   }

   public List<Pedido> listarDeCliente(long codigoCliente, Integer limite) {
      return adjuntarDetalles(repositorio.listarPorCliente(codigoCliente, limiteSeguro(limite)));
   }

   /**
    * Cola del personal. Sin estado: pedidos en curso (pendiente, en_preparacion,
    * listo), los más antiguos primero.
    * Con estado=entregado: registro histórico, los más recientes primero.
    */
   public List<Pedido> listarParaPersonal(String estadoTexto, Integer limite) {
      List<EstadoPedido> estados = EstadoPedido.ACTIVOS;
      boolean ascendente = true;
      if (estadoTexto != null && !estadoTexto.isBlank()) {
         EstadoPedido estado = EstadoPedido.desdeTexto(estadoTexto);
         if (estado == null) {
            throw new ValidacionException(Map.of("estado",
                  "El estado debe ser: pendiente, en_preparacion, listo o entregado"));
         }
         estados = List.of(estado);
         ascendente = estado != EstadoPedido.ENTREGADO;
      }
      return adjuntarDetalles(repositorio.listarPorEstados(estados, ascendente, limiteSeguro(limite)));
   }

   // ------------------------------------------------------------------
   // Avance de estados (PN-02)
   // ------------------------------------------------------------------

   public Pedido iniciarPreparacion(long idPedido, long idTrabajador) {
      return cambiarEstado(idPedido, idTrabajador, EstadoPedido.PENDIENTE, EstadoPedido.EN_PREPARACION);
   }

   public Pedido marcarListo(long idPedido, long idTrabajador) {
      return cambiarEstado(idPedido, idTrabajador, EstadoPedido.EN_PREPARACION, EstadoPedido.LISTO);
   }

   /**
    * Función 1: verifica que el código presentado coincida con el del pedido. No
    * modifica nada.
    */
   public boolean verificarCodigo(long idPedido, String codigoIngresado) {
      Pedido pedido = repositorio.buscarPorId(idPedido)
            .orElseThrow(() -> new NoEncontradoException("Pedido no encontrado"));
      return coincide(pedido, codigoIngresado);
   }

   /**
    * Función 2: entrega el pedido. Exige estado "listo" (RN-NEG-07) y verifica el
    * código antes de cambiar el estado.
    */
   public Pedido entregar(long idPedido, long idTrabajador, String codigoIngresado) {
      Pedido pedido = repositorio.buscarPorId(idPedido)
            .orElseThrow(() -> new NoEncontradoException("Pedido no encontrado"));

      if (pedido.estado() != EstadoPedido.LISTO) {
         throw new ConflictoException("estado", "Solo se puede entregar un pedido que está 'listo'. "
               + "Estado actual: '" + pedido.estado().valorBd() + "'");
      }
      if (!coincide(pedido, codigoIngresado)) {
         throw new ValidacionException(Map.of("codigoRetiro", "El código de retiro no coincide"));
      }
      return aplicarEstado(pedido, idTrabajador, EstadoPedido.ENTREGADO);
   }

   // ------------------------------------------------------------------
   // Internos
   // ------------------------------------------------------------------

   private Pedido cambiarEstado(long idPedido, long idTrabajador, EstadoPedido esperado, EstadoPedido nuevo) {
      Pedido pedido = repositorio.buscarPorId(idPedido)
            .orElseThrow(() -> new NoEncontradoException("Pedido no encontrado"));
      if (pedido.estado() != esperado) {
         throw new ConflictoException("estado", "El pedido está '" + pedido.estado().valorBd()
               + "' y no puede pasar a '" + nuevo.valorBd() + "'. " + MSG_ORDEN);
      }
      return aplicarEstado(pedido, idTrabajador, nuevo);
   }

   private Pedido aplicarEstado(Pedido pedido, long idTrabajador, EstadoPedido nuevo) {
      try {
         repositorio.registrarEstado(pedido.idPedido(), idTrabajador, nuevo);
      } catch (DuplicateKeyException e) {
         throw conflictoPorConcurrencia();
      } catch (DataAccessException e) {
         // Otro trabajador cambió el estado al mismo tiempo: el trigger rechaza la
         // transición
         if (mensajeRaiz(e).contains("Transición no permitida")) {
            throw conflictoPorConcurrencia();
         }
         throw e;
      }
      return obtenerCompleto(pedido.idPedido());
   }

   private ConflictoException conflictoPorConcurrencia() {
      return new ConflictoException("estado",
            "El estado del pedido ya fue modificado por otro usuario. Actualiza la lista. " + MSG_ORDEN);
   }

   /**
    * Comparación en tiempo constante, ignorando mayúsculas/minúsculas y espacios
    * alrededor.
    */
   private boolean coincide(Pedido pedido, String codigoIngresado) {
      String ingresado = validador.normalizarCodigoRetiro(codigoIngresado);
      if (!validador.formatoCodigoRetiroValido(ingresado)) {
         return false;
      }
      return MessageDigest.isEqual(
            ingresado.getBytes(StandardCharsets.UTF_8),
            pedido.codigoRetiro().getBytes(StandardCharsets.UTF_8));
   }

   private List<Pedido> adjuntarDetalles(List<Pedido> pedidos) {
      Map<Long, List<DetallePedido>> detalles = repositorio.buscarDetalles(
            pedidos.stream().map(Pedido::idPedido).toList());
      return pedidos.stream()
            .map(p -> p.conDetalles(detalles.getOrDefault(p.idPedido(), List.of())))
            .toList();
   }

   private static int limiteSeguro(Integer limite) {
      if (limite == null) {
         return LIMITE_POR_DEFECTO;
      }
      return Math.max(1, Math.min(limite, LIMITE_MAXIMO));
   }

   private static String mensajeRaiz(Throwable e) {
      String mensaje = NestedExceptionUtils.getMostSpecificCause(e).getMessage();
      return mensaje == null ? "" : mensaje;
   }
}