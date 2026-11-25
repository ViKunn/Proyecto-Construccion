package g5.backend.cafeteria.auth;

import java.io.Serializable;

/**
 * Identidad del usuario autenticado. Se guarda SOLO en el servidor
 * (HttpSession);
 * el navegador únicamente conserva la cookie de sesión (HttpOnly).
 *
 * @param idUsuario usuario.id_usuario
 * @param tipo      cliente | trabajador | administrador
 * @param idPerfil  cliente.codigo_cliente (CLIENTE) o trabajador.id_trabajador
 *                  (TRABAJADOR);
 *                  null para ADMINISTRADOR
 */
public record UsuarioAutenticado(
      long idUsuario,
      TipoUsuario tipo,
      Long idPerfil,
      String correo,
      String nombre,
      String apellido) implements Serializable {

   public long codigoCliente() {
      if (tipo != TipoUsuario.CLIENTE || idPerfil == null) {
         throw new IllegalStateException("El usuario autenticado no es un cliente");
      }
      return idPerfil;
   }

   public long idTrabajador() {
      if (tipo != TipoUsuario.TRABAJADOR || idPerfil == null) {
         throw new IllegalStateException("El usuario autenticado no es un trabajador");
      }
      return idPerfil;
   }
}