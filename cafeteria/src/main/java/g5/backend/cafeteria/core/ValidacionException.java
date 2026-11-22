package g5.backend.cafeteria.core;

import java.util.Map;

/** Datos inválidos: se traduce a HTTP 400 con el detalle por campo. */
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