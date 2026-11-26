package g5.backend.cafeteria.auth;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Enumeración que define los roles y categorías de usuarios admitidos en el sistema.
 * Modela directamente los valores del tipo enumerado 'tipo_usuario_enum' de la base de datos PostgreSQL.
 */

public enum TipoUsuario {
   CLIENTE("cliente"),
   TRABAJADOR("trabajador"),
   ADMINISTRADOR("administrador");

   private final String valorBd;

   TipoUsuario(String valorBd) {
      this.valorBd = valorBd;
   }

   @JsonValue
   public String valorBd() {
      return valorBd;
   }

   public static TipoUsuario desdeBd(String valor) {
      for (TipoUsuario t : values()) {
         if (t.valorBd.equalsIgnoreCase(valor)) {
            return t;
         }
      }
      throw new IllegalArgumentException("Tipo de usuario desconocido: " + valor);
   }
}