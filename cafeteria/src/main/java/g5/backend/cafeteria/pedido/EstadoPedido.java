package g5.backend.cafeteria.pedido;

import com.fasterxml.jackson.annotation.JsonValue;
import java.util.List;

/** Coincide con estado_pedido_enum. El orden de declaración es el único flujo permitido (RN-NEG-06). */
public enum EstadoPedido {
   PENDIENTE("pendiente"),
   EN_PREPARACION("en_preparacion"),
   LISTO("listo"),
   ENTREGADO("entregado");

   /** Pedidos en curso: lo que el personal necesita ver por defecto. */
   public static final List<EstadoPedido> ACTIVOS = List.of(PENDIENTE, EN_PREPARACION, LISTO);

   private final String valorBd;

   EstadoPedido(String valorBd) {
      this.valorBd = valorBd;
   }

   @JsonValue
   public String valorBd() {
      return valorBd;
   }

   /** Devuelve null si el texto no corresponde a un estado válido. */
   public static EstadoPedido desdeTexto(String valor) {
      if (valor == null) {
         return null;
      }
      for (EstadoPedido e : values()) {
         if (e.valorBd.equalsIgnoreCase(valor.trim())) {
            return e;
         }
      }
      return null;
   }
}