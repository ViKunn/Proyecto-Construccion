package g5.backend.cafeteria.cliente;

/**
 * Entidad de dominio que modela el perfil de un cliente en la cafetería.
 */
public record Cliente(
      long codigoCliente,
      long idUsuario,
      String nombre,
      String apellido,
      String cedula,
      String celular,
      String correo) {
}