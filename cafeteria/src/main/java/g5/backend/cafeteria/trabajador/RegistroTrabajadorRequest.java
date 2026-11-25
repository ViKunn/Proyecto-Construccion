package g5.backend.cafeteria.trabajador;

/**
 * Estructura de transferencia de datos (DTO) para la creación de cuentas de
 * trabajadores.
 */
public record RegistroTrabajadorRequest(
            String nombre,
            String apellido,
            String cedula,
            String correo,
            String contrasena) {
}