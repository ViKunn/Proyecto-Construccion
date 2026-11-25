package g5.backend.cafeteria.trabajador;

import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/** 
 * Repositorio de acceso a datos para la administración de trabajadores.
*/
@Repository
public class TrabajadorRepositorio {

   private static final RowMapper<Trabajador> MAPPER = (rs, n) -> new Trabajador(
         rs.getLong("id_trabajador"),
         rs.getString("nombre"),
         rs.getString("apellido"),
         rs.getString("cedula"),
         rs.getString("correo"));

   private final JdbcTemplate jdbc;

   public TrabajadorRepositorio(JdbcTemplate jdbc) {
      this.jdbc = jdbc;
   }

   /** Usa la vista v_trabajadores (no expone la contraseña). */
   public List<Trabajador> listar() {
      return jdbc.query(
            "select id_trabajador, nombre, apellido, cedula, correo "
                  + "from v_trabajadores order by lower(apellido), lower(nombre)",
            MAPPER);
   }

   public boolean existePorCorreo(String correo) {
      return Boolean.TRUE.equals(jdbc.queryForObject(
            "select exists (select 1 from usuario where lower(correo) = lower(?))",
            Boolean.class, correo));
   }

   public boolean existePorCedula(String cedula) {
      return Boolean.TRUE.equals(jdbc.queryForObject(
            "select exists (select 1 from trabajador where cedula = ?)",
            Boolean.class, cedula));
   }

   /** Crea usuario + trabajador en una sola transacción. */
   @Transactional
   public Trabajador insertar(String correo, String contrasenaHash, String nombre,
         String apellido, String cedula) {
      Long idUsuario = jdbc.queryForObject(
            "insert into usuario (correo, contrasena_hash, tipo_usuario) "
                  + "values (?, ?, 'trabajador') returning id_usuario",
            Long.class, correo, contrasenaHash);

      Long idTrabajador = jdbc.queryForObject(
            "insert into trabajador (id_usuario, nombre, apellido, cedula) "
                  + "values (?, ?, ?, ?) returning id_trabajador",
            Long.class, idUsuario, nombre, apellido, cedula);

      return new Trabajador(idTrabajador, nombre, apellido, cedula, correo);
   }
}