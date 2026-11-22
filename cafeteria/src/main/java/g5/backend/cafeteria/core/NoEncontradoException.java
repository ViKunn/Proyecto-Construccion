package g5.backend.cafeteria.core;

/** Recurso inexistente: se traduce a HTTP 404. */
public class NoEncontradoException extends RuntimeException {

   public NoEncontradoException(String mensaje) {
      super(mensaje);
   }
}