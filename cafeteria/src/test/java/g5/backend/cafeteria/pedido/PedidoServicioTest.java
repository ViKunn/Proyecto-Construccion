package g5.backend.cafeteria.pedido;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import g5.backend.cafeteria.core.ConflictoException;
import g5.backend.cafeteria.core.NoEncontradoException;
import g5.backend.cafeteria.core.ValidacionException;
import g5.backend.cafeteria.core.ValidadorPedido;
import g5.backend.cafeteria.pedido.PedidoRepositorio.ProductoPedido;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;

/**
 * Pruebas unitarias de {@link PedidoServicio} (lógica de negocio del Integrante 2):
 * registro de pedidos (PN-01, RN-NEG-01..05) y avance de estados (PN-02, RN-NEG-06/07).
 * La base de datos se simula con Mockito; no se necesita conexión a Supabase.
 */
class PedidoServicioTest {

   private static final long CLIENTE = 1L;
   private static final long OTRO_CLIENTE = 2L;
   private static final long TRABAJADOR = 3L;
   private static final long ID_PEDIDO = 10L;
   private static final String CODIGO = "ABC234";

   private static final ProductoPedido CAFE = new ProductoPedido(1L, "Café americano", true);
   private static final ProductoPedido SANDUCHE = new ProductoPedido(7L, "Sánduche de pollo", true);
   private static final ProductoPedido PASTEL = new ProductoPedido(12L, "Pastel de chocolate", false);

   private PedidoRepositorio repositorio;
   private PedidoServicio servicio;

   @BeforeEach
   void preparar() {
      repositorio = mock(PedidoRepositorio.class);
      servicio = new PedidoServicio(repositorio, new ValidadorPedido(-1));
      when(repositorio.buscarDetalles(any())).thenReturn(Map.of());
   }

   private static Pedido pedido(EstadoPedido estado) {
      return new Pedido(ID_PEDIDO, CLIENTE, CODIGO, estado, OffsetDateTime.now(),
            new BigDecimal("4.75"), "Ana", "Torres", List.of());
   }

   // ==================================================================
   // Registro de pedidos (PN-01)
   // ==================================================================

   @Test
   @DisplayName("HU-CLI-04 / RN-NEG-01: no se registra un pedido sin productos")
   void rechazaPedidoSinProductos() {
      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.crear(CLIENTE, List.of()));

      assertTrue(e.getErrores().get("items").contains("al menos un producto"));
      verify(repositorio, never()).crearPedido(anyLong(), any());
   }

   @Test
   @DisplayName("HU-CLI-04 / RN-NEG-01: no se registra un pedido con cantidad no positiva")
   void rechazaCantidadNoPositiva() {
      assertThrows(ValidacionException.class,
            () -> servicio.crear(CLIENTE, List.of(new ItemPedido(1L, 0))));
      verify(repositorio, never()).crearPedido(anyLong(), any());
   }

   @Test
   @DisplayName("HU-CLI-04 / RN-NEG-02: no se registra un pedido con un producto no disponible")
   void rechazaProductoNoDisponible() {
      when(repositorio.buscarProductos(any())).thenReturn(Map.of(12L, PASTEL));

      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.crear(CLIENTE, List.of(new ItemPedido(12L, 1))));

      assertTrue(e.getErrores().get("producto.12").contains("no está disponible"));
      verify(repositorio, never()).crearPedido(anyLong(), any());
   }

   @Test
   @DisplayName("HU-CLI-04: no se registra un pedido con un producto inexistente")
   void rechazaProductoInexistente() {
      when(repositorio.buscarProductos(any())).thenReturn(Map.of());

      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.crear(CLIENTE, List.of(new ItemPedido(99L, 1))));

      assertTrue(e.getErrores().get("producto.99").contains("no existe"));
   }

   @Test
   @DisplayName("HU-CLI-05: registra el pedido y devuelve código de retiro, estado pendiente e importe")
   void registraPedidoValido() {
      when(repositorio.buscarProductos(any())).thenReturn(Map.of(1L, CAFE, 7L, SANDUCHE));
      when(repositorio.crearPedido(eq(CLIENTE), any())).thenReturn(ID_PEDIDO);
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.PENDIENTE)));

      Pedido creado = servicio.crear(CLIENTE, List.of(new ItemPedido(1L, 2), new ItemPedido(7L, 1)));

      assertEquals(ID_PEDIDO, creado.idPedido());
      assertEquals(EstadoPedido.PENDIENTE, creado.estado());
      assertEquals(CODIGO, creado.codigoRetiro());
      verify(repositorio).crearPedido(CLIENTE, Map.of(1L, 2, 7L, 1));
   }

   @Test
   @DisplayName("Si el mismo producto llega repetido, se suman sus cantidades en una sola línea")
   void consolidaProductosRepetidos() {
      when(repositorio.buscarProductos(Set.of(1L))).thenReturn(Map.of(1L, CAFE));
      when(repositorio.crearPedido(eq(CLIENTE), any())).thenReturn(ID_PEDIDO);
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.PENDIENTE)));

      servicio.crear(CLIENTE, List.of(new ItemPedido(1L, 2), new ItemPedido(1L, 1)));

      verify(repositorio).crearPedido(CLIENTE, Map.of(1L, 3));
   }

   @Test
   @DisplayName("Si un producto se deshabilita justo antes de guardar, se responde con conflicto (RN-NEG-02)")
   void productoDeshabilitadoEnCarrera() {
      when(repositorio.buscarProductos(any())).thenReturn(Map.of(1L, CAFE));
      when(repositorio.crearPedido(eq(CLIENTE), any())).thenThrow(
            new DataIntegrityViolationException("ERROR: El producto 1 no está disponible (RN-NEG-02)"));

      assertThrows(ConflictoException.class,
            () -> servicio.crear(CLIENTE, List.of(new ItemPedido(1L, 1))));
   }

   @Test
   @DisplayName("RN-NEG-03: el subtotal de un detalle es precio unitario × cantidad")
   void subtotalDetalle() {
      DetallePedido d = new DetallePedido(1L, "Café americano", new BigDecimal("1.25"), 3);
      assertEquals(new BigDecimal("3.75"), d.subtotal());
   }

   // ==================================================================
   // Consultas (HU-CLI-06, HU-PER-04)
   // ==================================================================

   @Test
   @DisplayName("HU-CLI-06: un cliente no puede ver el pedido de otro cliente")
   void clienteNoVePedidoAjeno() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.PENDIENTE)));

      assertThrows(NoEncontradoException.class, () -> servicio.obtenerDeCliente(ID_PEDIDO, OTRO_CLIENTE));
      assertEquals(ID_PEDIDO, servicio.obtenerDeCliente(ID_PEDIDO, CLIENTE).idPedido());
   }

   @Test
   @DisplayName("HU-PER-04: por defecto el personal ve los pedidos en curso, los más antiguos primero")
   void colaDelPersonalPorDefecto() {
      servicio.listarParaPersonal(null, null);

      verify(repositorio).listarPorEstados(EstadoPedido.ACTIVOS, true, 100);
   }

   @Test
   @DisplayName("HU-PER-04: filtra por estado y limita la cantidad de resultados a 500")
   void colaFiltradaYLimitada() {
      servicio.listarParaPersonal("pendiente", 10_000);

      verify(repositorio).listarPorEstados(List.of(EstadoPedido.PENDIENTE), true, 500);
   }

   @Test
   @DisplayName("Rechaza un estado desconocido al filtrar la cola")
   void rechazaEstadoDesconocido() {
      assertThrows(ValidacionException.class, () -> servicio.listarParaPersonal("cancelado", null));
   }

   // ==================================================================
   // Avance de estados (PN-02, RN-NEG-06)
   // ==================================================================

   @Test
   @DisplayName("HU-PER-05: un pedido pendiente pasa a en preparación")
   void iniciaPreparacion() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.PENDIENTE)));

      servicio.iniciarPreparacion(ID_PEDIDO, TRABAJADOR);

      verify(repositorio).registrarEstado(ID_PEDIDO, TRABAJADOR, EstadoPedido.EN_PREPARACION);
   }

   @Test
   @DisplayName("HU-PER-05: no se puede iniciar la preparación de un pedido que no está pendiente")
   void noIniciaPreparacionSiNoEstaPendiente() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.LISTO)));

      assertThrows(ConflictoException.class, () -> servicio.iniciarPreparacion(ID_PEDIDO, TRABAJADOR));
      verify(repositorio, never()).registrarEstado(anyLong(), anyLong(), any());
   }

   @Test
   @DisplayName("HU-PER-06: un pedido en preparación pasa a listo")
   void marcaListo() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.EN_PREPARACION)));

      servicio.marcarListo(ID_PEDIDO, TRABAJADOR);

      verify(repositorio).registrarEstado(ID_PEDIDO, TRABAJADOR, EstadoPedido.LISTO);
   }

   @Test
   @DisplayName("HU-PER-06 / RN-NEG-06: no se permite saltar de pendiente a listo")
   void noSaltaDePendienteAListo() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.PENDIENTE)));

      assertThrows(ConflictoException.class, () -> servicio.marcarListo(ID_PEDIDO, TRABAJADOR));
      verify(repositorio, never()).registrarEstado(anyLong(), anyLong(), any());
   }

   @Test
   @DisplayName("Si otro trabajador cambió el estado al mismo tiempo, se responde con conflicto")
   void conflictoPorConcurrencia() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.PENDIENTE)));
      doThrow(new DuplicateKeyException("ux_historial_pedido_estado"))
            .when(repositorio).registrarEstado(ID_PEDIDO, TRABAJADOR, EstadoPedido.EN_PREPARACION);

      ConflictoException e = assertThrows(ConflictoException.class,
            () -> servicio.iniciarPreparacion(ID_PEDIDO, TRABAJADOR));
      assertTrue(e.getMessage().contains("otro usuario"));
   }

   @Test
   @DisplayName("Un pedido inexistente responde 'no encontrado'")
   void pedidoInexistente() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.empty());

      assertThrows(NoEncontradoException.class, () -> servicio.iniciarPreparacion(ID_PEDIDO, TRABAJADOR));
   }

   // ==================================================================
   // Verificación del código y entrega (HU-PER-07, RN-NEG-07)
   // ==================================================================

   @Test
   @DisplayName("HU-PER-07: verifica el código ignorando mayúsculas y espacios")
   void verificaCodigo() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.LISTO)));

      assertTrue(servicio.verificarCodigo(ID_PEDIDO, " abc234 "));
      assertFalse(servicio.verificarCodigo(ID_PEDIDO, "XYZ789"));
      assertFalse(servicio.verificarCodigo(ID_PEDIDO, null));
   }

   @Test
   @DisplayName("HU-PER-07: entrega el pedido si está listo y el código coincide")
   void entregaPedido() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.LISTO)));

      servicio.entregar(ID_PEDIDO, TRABAJADOR, "abc234");

      verify(repositorio).registrarEstado(ID_PEDIDO, TRABAJADOR, EstadoPedido.ENTREGADO);
   }

   @Test
   @DisplayName("RN-NEG-07: no se entrega un pedido con código incorrecto")
   void noEntregaConCodigoIncorrecto() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.LISTO)));

      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.entregar(ID_PEDIDO, TRABAJADOR, "XYZ789"));

      assertTrue(e.getErrores().containsKey("codigoRetiro"));
      verify(repositorio, never()).registrarEstado(anyLong(), anyLong(), any());
   }

   @Test
   @DisplayName("RN-NEG-07: no se entrega un pedido que no está listo, aunque el código sea correcto")
   void noEntregaSiNoEstaListo() {
      when(repositorio.buscarPorId(ID_PEDIDO)).thenReturn(Optional.of(pedido(EstadoPedido.EN_PREPARACION)));

      assertThrows(ConflictoException.class, () -> servicio.entregar(ID_PEDIDO, TRABAJADOR, CODIGO));
      verify(repositorio, never()).registrarEstado(anyLong(), anyLong(), any());
   }

   @Test
   @DisplayName("RN-NEG-06: el estado se reconoce desde el texto de la base de datos")
   void estadoDesdeTexto() {
      assertEquals(EstadoPedido.EN_PREPARACION, EstadoPedido.desdeTexto(" EN_PREPARACION "));
      assertNull(EstadoPedido.desdeTexto("cancelado"));
   }
}
