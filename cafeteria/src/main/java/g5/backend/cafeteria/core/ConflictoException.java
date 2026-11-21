package g5.backend.cafeteria.core;

import java.util.Map;

/** Conflicto con datos existentes (duplicados): se traduce a HTTP 409. */
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