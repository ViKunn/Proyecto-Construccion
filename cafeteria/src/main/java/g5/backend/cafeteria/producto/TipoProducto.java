package g5.backend.cafeteria.producto;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Coincide con tipo_producto_enum. El valor también es la subcarpeta de la
 * imagen.
 */
public enum TipoProducto {
   BEBIDA("bebida"),
   ALIMENTO("alimento");

   private final String valorBd;

   TipoProducto(String valorBd) {
      this.valorBd = valorBd;
   }

   @JsonValue
   public String valorBd() {
      return valorBd;
   }

   /** Devuelve null si el texto no corresponde a un tipo válido. */
   public static TipoProducto desdeTexto(String valor) {
      if (valor == null) {
         return null;
      }
      for (TipoProducto t : values()) {
         if (t.valorBd.equalsIgnoreCase(valor.trim())) {
            return t;
         }
      }
      return null;
   }
}