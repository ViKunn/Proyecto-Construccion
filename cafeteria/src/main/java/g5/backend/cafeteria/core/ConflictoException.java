package g5.backend.cafeteria.core;

import java.util.Map;

/**
 * Excepción lanzada cuando ocurre un conflicto con el estado actual de los
 * datos, tales como duplicados o carreras concurrentes.
 * Es capturada por el manejador global para traducirse en una respuesta HTTP
 * 409 (CONFLICT).
 */
public class ConflictoException extends RuntimeException {

   private final transient Map<String, String> errores;

   public ConflictoException(String campo, String mensaje) {
      super(mensaje);
      this.errores = Map.of(campo, mensaje);
   }

   public Map<String, String> getErrores() {
      return errores;
   }
}