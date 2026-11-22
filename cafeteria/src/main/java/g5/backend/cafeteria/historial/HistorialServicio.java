package g5.backend.cafeteria.historial;

import g5.backend.cafeteria.core.NoEncontradoException;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class HistorialServicio {

   private static final int LIMITE_POR_DEFECTO = 50;
   private static final int LIMITE_MAXIMO = 200;

   /**
    * Página de historial: total = pedidos que cumplen el filtro (no filas de
    * cambios).
    */
   public record Pagina(long total, int pagina, int limite, List<HistorialPedido> pedidos) {
   }

   private final HistorialRepositorio repositorio;

   public HistorialServicio(HistorialRepositorio repositorio) {
      this.repositorio = repositorio;
   }

   /**
    * La paginación es por pedido, así que la línea de tiempo de un pedido nunca
    * queda partida entre páginas.
    */
   public Pagina listar(Long idPedido, Integer pagina, Integer limite) {
      int l = limite == null ? LIMITE_POR_DEFECTO : Math.max(1, Math.min(limite, LIMITE_MAXIMO));
      int p = pagina == null ? 0 : Math.max(0, pagina);

      long total = repositorio.contarPedidos(idPedido);
      List<Long> ids = repositorio.idsPedidos(idPedido, l, (long) p * l);
      Map<Long, List<CambioEstado>> cambios = repositorio.buscarCambios(ids);

      List<HistorialPedido> pedidos = ids.stream()
            .map(id -> new HistorialPedido(id, cambios.getOrDefault(id, List.of())))
            .toList();
      return new Pagina(total, p, l, pedidos);
   }

   public PedidoDetalleAdmin detalle(long idPedido) {
      return repositorio.buscarDetalle(idPedido)
            .orElseThrow(() -> new NoEncontradoException("Pedido no encontrado"));
   }
}