package g5.backend.cafeteria.auth;

import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Repositorio de acceso a datos para la autenticación de usuarios.
 * Ejecuta consultas directas sobre la base de datos mediante {@link JdbcTemplate}
 * para recuperar credenciales, datos de perfil y roles asociados.
 */

@Repository
public class AuthRepositorio {

   /**
    * Fila cruda para el login. Incluye el hash: nunca debe salir de la capa de
    * servicio.
    */
   public record RegistroLogin(
         long idUsuario,
         String correo,
         String contrasenaHash,
         TipoUsuario tipo,
         Long idPerfil,
         String nombre,
         String apellido) {
   }

   // usuario -> (cliente | trabajador). El administrador no tiene perfil (campos
   // null).
   // Usa ux_usuario_correo (lower(correo)).
   private static final String SQL_POR_CORREO = """
         select u.id_usuario,
                u.correo,
                u.contrasena_hash,
                u.tipo_usuario::text                       as tipo_usuario,
                coalesce(c.codigo_cliente, t.id_trabajador) as id_perfil,
                coalesce(c.nombre,   t.nombre)              as nombre,
                coalesce(c.apellido, t.apellido)            as apellido
           from usuario u
           left join cliente    c on c.id_usuario = u.id_usuario
           left join trabajador t on t.id_usuario = u.id_usuario
          where lower(u.correo) = lower(?)
         """;

   private final JdbcTemplate jdbc;

   public AuthRepositorio(JdbcTemplate jdbc) {
      this.jdbc = jdbc;
   }

   public Optional<RegistroLogin> buscarPorCorreo(String correo) {
      List<RegistroLogin> filas = jdbc.query(SQL_POR_CORREO, (rs, n) -> {
         long idPerfil = rs.getLong("id_perfil");
         Long perfil = rs.wasNull() ? null : idPerfil;
         return new RegistroLogin(
               rs.getLong("id_usuario"),
               rs.getString("correo"),
               rs.getString("contrasena_hash"),
               TipoUsuario.desdeBd(rs.getString("tipo_usuario")),
               perfil,
               rs.getString("nombre"),
               rs.getString("apellido"));
      }, correo);
      return filas.stream().findFirst();
   }

   public Optional<String> buscarHashPorId(long idUsuario) {
      List<String> filas = jdbc.query(
            "select contrasena_hash from usuario where id_usuario = ?",
            (rs, n) -> rs.getString("contrasena_hash"), idUsuario);
      return filas.stream().findFirst();
   }

   public boolean actualizarContrasena(long idUsuario, String nuevoHash) {
      return jdbc.update("update usuario set contrasena_hash = ? where id_usuario = ?",
            nuevoHash, idUsuario) == 1;
   }
}