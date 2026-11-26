package g5.backend.cafeteria.core;

import g5.backend.cafeteria.pedido.ItemPedido;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Componente de validación para las órdenes y pedidos de clientes.
 * Aplica reglas de negocio sobre la estructura de ítems, cantidades permitidas,
 * límites técnicos para evitar desbordamientos numéricos y validación del formato del código de retiro.
 */

@Component
public class ValidadorPedido {

   /** Tope de líneas por pedido (protección contra abuso). */
   public static final int MAX_LINEAS = 30;
   /**
    * Tope técnico por producto: evita desbordar numeric(10,2).
    */
   public static final int MAX_CANTIDAD_TECNICA = 9999;

   // Alfabeto de generar_codigo_retiro(): sin I, O, 0 ni 1
   private static final Pattern CODIGO_RETIRO = Pattern.compile("^[A-HJ-NP-Z2-9]{6}$");

   /**
    * Bandera de negocio: valor <= 0 = sin límite; valor > 0 = máximo de unidades
    * por producto.
    */
   private final int cantidadMaximaPorProducto;

   public ValidadorPedido(
         @Value("${app.pedidos.cantidad-maxima-por-producto:-1}") int cantidadMaximaPorProducto) {
      this.cantidadMaximaPorProducto = cantidadMaximaPorProducto;
   }

   public boolean hayLimite() {
      return cantidadMaximaPorProducto > 0;
   }

   /** Límite vigente; -1 si no hay límite (para exponerlo al frontend). */
   public int limiteCantidad() {
      return hayLimite() ? cantidadMaximaPorProducto : -1;
   }

   /** RN-NEG-01: al menos un producto y cada cantidad entera positiva. */
   public String errorItems(List<ItemPedido> items) {
      if (items == null || items.isEmpty()) {
         return "El pedido debe incluir al menos un producto (RN-NEG-01)";
      }
      if (items.size() > MAX_LINEAS) {
         return "El pedido no puede tener más de " + MAX_LINEAS + " productos distintos";
      }
      for (ItemPedido i : items) {
         if (i == null || i.codigoProducto() == null || i.codigoProducto() <= 0) {
            return "Cada ítem debe indicar un código de producto válido";
         }
         if (i.cantidad() == null || i.cantidad() <= 0) {
            return "La cantidad de cada producto debe ser un número entero positivo (RN-NEG-01)";
         }
      }
      return null;
   }

   /** Valida la cantidad TOTAL de un producto en el pedido (ya consolidada). */
   public String errorCantidad(String nombreProducto, long cantidadTotal) {
      if (hayLimite() && cantidadTotal > cantidadMaximaPorProducto) {
         return "Solo se permiten hasta " + cantidadMaximaPorProducto + " unidades de '"
               + nombreProducto + "' por pedido";
      }
      if (cantidadTotal > MAX_CANTIDAD_TECNICA) {
         return "La cantidad de '" + nombreProducto + "' no puede superar " + MAX_CANTIDAD_TECNICA;
      }
      return null;
   }

   public String normalizarCodigoRetiro(String codigo) {
      return codigo == null ? "" : codigo.trim().toUpperCase(Locale.ROOT);
   }

   public boolean formatoCodigoRetiroValido(String codigoNormalizado) {
      return CODIGO_RETIRO.matcher(codigoNormalizado).matches();
   }
}