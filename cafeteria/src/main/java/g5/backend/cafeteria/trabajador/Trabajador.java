package g5.backend.cafeteria.trabajador;
/**
 * Entidad de dominio que modela el perfil de un empleado de la cafetería.
 */
public record Trabajador(
      long idTrabajador,
      String nombre,
      String apellido,
      String cedula,
      String correo) {
}