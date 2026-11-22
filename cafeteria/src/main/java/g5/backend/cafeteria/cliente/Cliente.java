package g5.backend.cafeteria.cliente;

public record Cliente(
      long codigoCliente,
      long idUsuario,
      String nombre,
      String apellido,
      String cedula,
      String celular,
      String correo) {
}