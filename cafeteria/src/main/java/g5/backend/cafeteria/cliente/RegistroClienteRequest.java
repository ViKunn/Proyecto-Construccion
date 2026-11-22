package g5.backend.cafeteria.cliente;

/**
 * Cuerpo de POST /api/clientes/registro. Todos los campos se validan en el
 * servicio.
 */
public record RegistroClienteRequest(
      String nombre,
      String apellido,
      String cedula,
      String celular,
      String correo,
      String contrasena) {
}