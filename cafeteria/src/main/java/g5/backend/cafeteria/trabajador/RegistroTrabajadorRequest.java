package g5.backend.cafeteria.trabajador;

/**
 * Cuerpo de POST /api/trabajadores. Todos los campos se validan en el servicio.
 */
public record RegistroTrabajadorRequest(
      String nombre,
      String apellido,
      String cedula,
      String correo,
      String contrasena) {
}