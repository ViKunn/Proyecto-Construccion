package g5.backend.cafeteria.cliente;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repositorio de acceso a datos para la gestión y persistencia de clientes.
 * Proporciona métodos de verificación de unicidad y operaciones transaccionales
 * sobre las tablas 'usuario' y 'cliente' mediante {@link JdbcTemplate}.
 */

@Repository
public class ClienteRepositorio {

   private final JdbcTemplate jdbc;

   public ClienteRepositorio(JdbcTemplate jdbc) {
      this.jdbc = jdbc;
   }

   public boolean existePorCorreo(String correo) {
      return Boolean.TRUE.equals(jdbc.queryForObject(
            "select exists (select 1 from usuario where lower(correo) = lower(?))",
            Boolean.class, correo));
   }

   public boolean existePorCedula(String cedula) {
      return Boolean.TRUE.equals(jdbc.queryForObject(
            "select exists (select 1 from cliente where cedula = ?)",
            Boolean.class, cedula));
   }

   /**
    * Inserta de forma atómica y transaccional una nueva cuenta de usuario y su correspondiente perfil de cliente.
    * Si falla algo, toda la operación se deshace
    */
   @Transactional
   public Cliente insertar(String correo, String contrasenaHash, String nombre,
         String apellido, String cedula, String celular) {
      Long idUsuario = jdbc.queryForObject(
            "insert into usuario (correo, contrasena_hash, tipo_usuario) "
                  + "values (?, ?, 'cliente') returning id_usuario",
            Long.class, correo, contrasenaHash);

      Long codigoCliente = jdbc.queryForObject(
            "insert into cliente (id_usuario, nombre, apellido, cedula, celular) "
                  + "values (?, ?, ?, ?, ?) returning codigo_cliente",
            Long.class, idUsuario, nombre, apellido, cedula, celular);

      return new Cliente(codigoCliente, idUsuario, nombre, apellido, cedula, celular, correo);
   }
}