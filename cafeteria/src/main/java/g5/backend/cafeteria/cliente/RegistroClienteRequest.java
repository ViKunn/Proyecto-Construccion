package g5.backend.cafeteria.cliente;

/**
 * DTO para la solicitud de registro de nuevos clientes.
 */
public record RegistroClienteRequest(
      String nombre,
      String apellido,
      String cedula,
      String celular,
      String correo,
      String contrasena) {
}