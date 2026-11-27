package g5.backend.cafeteria.core;

/**
 * Excepción lanzada cuando una entidad o recurso solicitado no existe en la base de datos o el sistema.
 * Es capturada por el manejador global para responder con un código de estado HTTP 404 (NOT_FOUND).
 */

public class NoEncontradoException extends RuntimeException {

   public NoEncontradoException(String mensaje) {
      super(mensaje);
   }
}