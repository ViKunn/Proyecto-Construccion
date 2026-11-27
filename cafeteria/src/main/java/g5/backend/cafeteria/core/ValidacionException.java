package g5.backend.cafeteria.core;

import java.util.Map;

/**
 * Excepción lanzada cuando los datos suministrados por el cliente no satisfacen
 * las reglas de validación o formato.
 * Contiene un mapa asociativo con los errores específicos por campo y se
 * traduce a un código HTTP 400 (BAD REQUEST).
 */

public class ValidacionException extends RuntimeException {

   private final transient Map<String, String> errores;

   public ValidacionException(Map<String, String> errores) {
      super("Datos inválidos");
      this.errores = errores;
   }

   public Map<String, String> getErrores() {
      return errores;
   }
}