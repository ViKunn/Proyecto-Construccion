package g5.backend.cafeteria.pedido;

import java.sql.PreparedStatement;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de acceso a datos para la persistencia y ciclo de vida de los pedidos.
 */
@Repository
public class PedidoRepositorio {

      /** Datos mínimos de un producto para validar un pedido. */
      public record ProductoPedido(long codigoProducto, String nombre, boolean disponible) {
      }

      private static final String SELECT_PEDIDO = "select p.id_pedido, p.codigo_cliente, p.codigo_retiro, p.estado::text as estado, "
                  + "p.fecha_registro, p.importe_total, c.nombre, c.apellido "
                  + "from pedido p join cliente c on c.codigo_cliente = p.codigo_cliente";

      private static final RowMapper<Pedido> MAPPER_PEDIDO = (rs, n) -> new Pedido(
                  rs.getLong("id_pedido"),
                  rs.getLong("codigo_cliente"),
                  rs.getString("codigo_retiro"),
                  EstadoPedido.desdeTexto(rs.getString("estado")),
                  rs.getObject("fecha_registro", OffsetDateTime.class),
                  rs.getBigDecimal("importe_total"),
                  rs.getString("nombre"),
                  rs.getString("apellido"),
                  List.of());

      private final JdbcTemplate jdbc;

      public PedidoRepositorio(JdbcTemplate jdbc) {
            this.jdbc = jdbc;
      }

      // ------------------------------------------------------------------
      // Creación (PN-01)
      // ------------------------------------------------------------------

      /**
       * Invoca la función PL/pgSQL 'crear_pedido' para insertar la cabecera y detalles en una sola transacción.
       * Llama a crear_pedido(): inserta pedido + detalles en una sola transacción.
       * Los triggers de la BD
       * congelan el precio (RN-NEG-04), calculan el total (RN-NEG-03), generan el
       * código único (RN-NEG-05)
       * y dejan el estado inicial en pendiente (RN-NEG-06).
       */
      public long crearPedido(long codigoCliente, Map<Long, Integer> items) {
            // Solo contiene números enteros generados por el servidor: no hay texto del
            // usuario en el JSON
            String json = items.entrySet().stream()
                        .map(e -> "{\"codigo_producto\":" + e.getKey() + ",\"cantidad\":" + e.getValue() + "}")
                        .collect(Collectors.joining(",", "[", "]"));
            Long id = jdbc.queryForObject(
                        "select o_id_pedido from crear_pedido(?, ?::jsonb)", Long.class, codigoCliente, json);
            return id;
      }

      public Map<Long, ProductoPedido> buscarProductos(Collection<Long> codigos) {
            List<ProductoPedido> productos = jdbc.query(con -> {
                  PreparedStatement ps = con.prepareStatement(
                              "select codigo_producto, nombre, disponible from producto where codigo_producto = any (?)");
                  ps.setArray(1, con.createArrayOf("bigint", codigos.toArray()));
                  return ps;
            }, (rs, n) -> new ProductoPedido(
                        rs.getLong("codigo_producto"), rs.getString("nombre"), rs.getBoolean("disponible")));
            return productos.stream().collect(Collectors.toMap(ProductoPedido::codigoProducto, Function.identity()));
      }

      // ------------------------------------------------------------------
      // Consultas
      // ------------------------------------------------------------------

      public Optional<Pedido> buscarPorId(long idPedido) {
            return jdbc.query(SELECT_PEDIDO + " where p.id_pedido = ?", MAPPER_PEDIDO, idPedido)
                        .stream().findFirst();
      }

      /** Cola del personal: filtra por estados; ascendente = más antiguos primero. */
      public List<Pedido> listarPorEstados(List<EstadoPedido> estados, boolean ascendente, int limite) {
            String marcadores = estados.stream().map(e -> "?::estado_pedido_enum").collect(Collectors.joining(", "));
            String sentido = ascendente ? "asc" : "desc";
            String sql = SELECT_PEDIDO + " where p.estado in (" + marcadores + ")"
                        + " order by p.fecha_registro " + sentido + ", p.id_pedido " + sentido + " limit ?";
            List<Object> params = new ArrayList<>(estados.stream().map(EstadoPedido::valorBd).toList());
            params.add(limite);
            return jdbc.query(sql, MAPPER_PEDIDO, params.toArray());
      }

      public List<Pedido> listarPorCliente(long codigoCliente, int limite) {
            return jdbc.query(
                        SELECT_PEDIDO
                                    + " where p.codigo_cliente = ? order by p.fecha_registro desc, p.id_pedido desc limit ?",
                        MAPPER_PEDIDO, codigoCliente, limite);
      }

      /** Detalles de varios pedidos en una sola consulta, agrupados por pedido. */
      public Map<Long, List<DetallePedido>> buscarDetalles(Collection<Long> idsPedido) {
            Map<Long, List<DetallePedido>> resultado = new HashMap<>();
            if (idsPedido.isEmpty()) {
                  return resultado;
            }
            jdbc.query(con -> {
                  PreparedStatement ps = con.prepareStatement(
                              "select d.id_pedido, d.codigo_producto, pr.nombre, d.precio_unitario, d.cantidad "
                                          + "from detalle_pedido d join producto pr on pr.codigo_producto = d.codigo_producto "
                                          + "where d.id_pedido = any (?) order by d.id_detalle");
                  ps.setArray(1, con.createArrayOf("bigint", idsPedido.toArray()));
                  return ps;
            }, (RowCallbackHandler) rs -> resultado
                        .computeIfAbsent(rs.getLong("id_pedido"), k -> new ArrayList<>())
                        .add(new DetallePedido(
                                    rs.getLong("codigo_producto"),
                                    rs.getString("nombre"),
                                    rs.getBigDecimal("precio_unitario"),
                                    rs.getInt("cantidad"))));
            return resultado;
      }

      // ------------------------------------------------------------------
      // Cambio de estado (PN-02)
      // ------------------------------------------------------------------

      /**
       * Registra el nuevo estado en el historial. Los triggers de la BD validan la
       * transición
       * (RN-NEG-06) y sincronizan pedido.estado.
       */
      public void registrarEstado(long idPedido, long idTrabajador, EstadoPedido nuevo) {
            jdbc.update(
                        "insert into historial_estado_pedido (id_pedido, id_trabajador, estado) "
                                    + "values (?, ?, ?::estado_pedido_enum)",
                        idPedido, idTrabajador, nuevo.valorBd());
      }
}