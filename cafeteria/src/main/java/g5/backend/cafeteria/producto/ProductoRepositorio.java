package g5.backend.cafeteria.producto;

import java.math.BigDecimal;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de acceso a datos para la administración del catálogo de productos y menú.
 */

@Repository
public class ProductoRepositorio {

   private static final String COLUMNAS = "codigo_producto, nombre, precio, disponible, tipo_producto::text as tipo, ruta_imagen";

   private static final RowMapper<Producto> MAPPER = (rs, n) -> new Producto(
         rs.getLong("codigo_producto"),
         rs.getString("nombre"),
         rs.getBigDecimal("precio"),
         rs.getBoolean("disponible"),
         TipoProducto.desdeTexto(rs.getString("tipo")),
         rs.getString("ruta_imagen"));

   private final JdbcTemplate jdbc;

   public ProductoRepositorio(JdbcTemplate jdbc) {
      this.jdbc = jdbc;
   }

   /** Filtros opcionales (null = sin filtrar). Orden: tipo (enum) y nombre. */
   public List<Producto> listar(TipoProducto tipo, Boolean disponible) {
      StringBuilder sql = new StringBuilder("select " + COLUMNAS + " from producto where 1 = 1");
      List<Object> params = new ArrayList<>();
      if (tipo != null) {
         sql.append(" and tipo_producto = ?::tipo_producto_enum");
         params.add(tipo.valorBd());
      }
      if (disponible != null) {
         sql.append(" and disponible = ?");
         params.add(disponible);
      }
      sql.append(" order by producto.tipo_producto, lower(nombre)");
      return jdbc.query(sql.toString(), MAPPER, params.toArray());
   }

   public Optional<Producto> buscarPorCodigo(long codigo) {
      return jdbc.query("select " + COLUMNAS + " from producto where codigo_producto = ?",
            MAPPER, codigo).stream().findFirst();
   }

   /**
    * excluirCodigo: se ignora ese producto (para editar sin chocar consigo mismo);
    * null = ninguno.
    */
   public boolean existePorNombre(String nombre, Long excluirCodigo) {
      return Boolean.TRUE.equals(jdbc.queryForObject(
            "select exists (select 1 from producto "
                  + "where lower(nombre) = lower(?) and codigo_producto <> ?)",
            Boolean.class, nombre, excluirCodigo == null ? 0L : excluirCodigo));
   }

   public Producto insertar(String nombre, BigDecimal precio, TipoProducto tipo, String rutaImagen) {
      return jdbc.queryForObject(
            "insert into producto (nombre, precio, disponible, tipo_producto, ruta_imagen) "
                  + "values (?, ?, true, ?::tipo_producto_enum, ?::text) returning " + COLUMNAS,
            MAPPER, nombre, precio, tipo.valorBd(), rutaImagen);
   }

   /** Actualización parcial: los parámetros null conservan el valor actual. */
   public Optional<Producto> actualizar(long codigo, String nombre, BigDecimal precio, Boolean disponible) {
      return jdbc.query(
            "update producto set nombre = coalesce(?::text, nombre), "
                  + "precio = coalesce(?::numeric, precio), "
                  + "disponible = coalesce(?::boolean, disponible) "
                  + "where codigo_producto = ? returning " + COLUMNAS,
            MAPPER, nombre, precio, disponible, codigo).stream().findFirst();
   }

   public void actualizarRutaImagen(long codigo, String rutaImagen) {
      jdbc.update("update producto set ruta_imagen = ? where codigo_producto = ?", rutaImagen, codigo);
   }

   /** Devuelve cuáles de los códigos indicados existen. */
   public Set<Long> buscarExistentes(Collection<Long> codigos) {
      return new HashSet<>(jdbc.query(con -> {
         PreparedStatement ps = con.prepareStatement(
               "select codigo_producto from producto where codigo_producto = any (?)");
         ps.setArray(1, con.createArrayOf("bigint", codigos.toArray()));
         return ps;
      }, (rs, n) -> rs.getLong(1)));
   }

   /**
    * Deja disponibles exactamente los productos indicados y no disponibles todos
    * los demás (una sola sentencia).
    */
   public void fijarMenu(Collection<Long> codigos) {
      jdbc.update(con -> {
         PreparedStatement ps = con.prepareStatement(
               "update producto set disponible = (codigo_producto = any (?)) "
                     + "where disponible is distinct from (codigo_producto = any (?))");
         Object[] arreglo = codigos.toArray();
         ps.setArray(1, con.createArrayOf("bigint", arreglo));
         ps.setArray(2, con.createArrayOf("bigint", arreglo));
         return ps;
      });
   }
}