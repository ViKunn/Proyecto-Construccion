package g5.backend.cafeteria.historial;

import g5.backend.cafeteria.historial.PedidoDetalleAdmin.Linea;
import g5.backend.cafeteria.pedido.EstadoPedido;
import java.sql.PreparedStatement;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/** Lecturas sobre las vistas v_historial_pedidos y v_detalle_pedidos. */
@Repository
public class HistorialRepositorio {

   private record Fila(PedidoDetalleAdmin cabecera, Linea linea) {
   }

   private static final RowMapper<Fila> MAPPER_FILA = (rs, n) -> new Fila(
         new PedidoDetalleAdmin(
               rs.getLong("id_pedido"),
               rs.getObject("fecha_registro", OffsetDateTime.class),
               EstadoPedido.desdeTexto(rs.getString("estado_actual")),
               rs.getBigDecimal("importe_total"),
               rs.getString("cliente_nombre"),
               rs.getString("cliente_apellido"),
               rs.getString("cliente_celular"),
               List.of(),
               List.of()),
         new Linea(
               rs.getLong("id_detalle"),
               rs.getString("producto_nombre"),
               rs.getInt("cantidad"),
               rs.getBigDecimal("precio_unitario"),
               rs.getBigDecimal("subtotal")));

   private final JdbcTemplate jdbc;

   public HistorialRepositorio(JdbcTemplate jdbc) {
      this.jdbc = jdbc;
   }

   /** Cantidad de pedidos con historial (opcionalmente solo el indicado). */
   public long contarPedidos(Long idPedido) {
      if (idPedido == null) {
         Long total = jdbc.queryForObject("select count(distinct id_pedido) from v_historial_pedidos", Long.class);
         return total == null ? 0 : total;
      }
      Long total = jdbc.queryForObject(
            "select count(distinct id_pedido) from v_historial_pedidos where id_pedido = ?",
            Long.class, idPedido);
      return total == null ? 0 : total;
   }

   /** Página de ids de pedido, del más reciente al más antiguo. */
   public List<Long> idsPedidos(Long idPedido, int limite, long offset) {
      List<Object> params = new ArrayList<>();
      String where = "";
      if (idPedido != null) {
         where = " where id_pedido = ?";
         params.add(idPedido);
      }
      params.add(limite);
      params.add(offset);
      return jdbc.query(
            "select distinct id_pedido from v_historial_pedidos" + where
                  + " order by id_pedido desc limit ? offset ?",
            (rs, n) -> rs.getLong(1), params.toArray());
   }

   /** Cambios de estado de varios pedidos en una sola consulta, en orden cronológico. */
   public Map<Long, List<CambioEstado>> buscarCambios(Collection<Long> idsPedido) {
      Map<Long, List<CambioEstado>> resultado = new HashMap<>();
      if (idsPedido.isEmpty()) {
         return resultado;
      }
      jdbc.query(con -> {
         PreparedStatement ps = con.prepareStatement(
               "select id_pedido, id_historial, estado, fecha_cambio, trabajador_nombre, trabajador_apellido "
                     + "from v_historial_pedidos where id_pedido = any (?) order by id_pedido desc, id_historial");
         ps.setArray(1, con.createArrayOf("bigint", idsPedido.toArray()));
         return ps;
      }, (RowCallbackHandler) rs -> resultado
            .computeIfAbsent(rs.getLong("id_pedido"), k -> new ArrayList<>())
            .add(new CambioEstado(
                  rs.getLong("id_historial"),
                  EstadoPedido.desdeTexto(rs.getString("estado")),
                  rs.getObject("fecha_cambio", OffsetDateTime.class),
                  rs.getString("trabajador_nombre"),
                  rs.getString("trabajador_apellido"))));
      return resultado;
   }

   public Optional<PedidoDetalleAdmin> buscarDetalle(long idPedido) {
      List<Fila> filas = jdbc.query(
            "select id_pedido, fecha_registro, estado_actual, importe_total, "
                  + "cliente_nombre, cliente_apellido, cliente_celular, "
                  + "id_detalle, producto_nombre, cantidad, precio_unitario, subtotal "
                  + "from v_detalle_pedidos where id_pedido = ? order by id_detalle",
            MAPPER_FILA, idPedido);
      if (filas.isEmpty()) {
         return Optional.empty();
      }
      List<Linea> items = filas.stream().map(Fila::linea).toList();
      List<CambioEstado> cambios = buscarCambios(List.of(idPedido)).getOrDefault(idPedido, List.of());
      return Optional.of(filas.get(0).cabecera().con(items, cambios));
   }
}