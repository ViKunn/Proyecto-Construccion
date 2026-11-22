package g5.backend.cafeteria.trabajador;

public record Trabajador(
      long idTrabajador,
      String nombre,
      String apellido,
      String cedula,
      String correo) {
}