package g5.backend.cafeteria.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import g5.backend.cafeteria.pedido.ItemPedido;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Pruebas unitarias de {@link ValidadorPedido}: RN-NEG-01 (al menos un producto y cantidades
 * enteras positivas), límites de cantidad y formato del código de retiro (RN-NEG-05).
 */
class ValidadorPedidoTest {

   private final ValidadorPedido sinLimite = new ValidadorPedido(-1);
   private final ValidadorPedido conLimite = new ValidadorPedido(5);

   // ---------------------------- RN-NEG-01 ----------------------------

   @Test
   @DisplayName("RN-NEG-01: un pedido sin productos (null o lista vacía) no es válido")
   void pedidoSinProductos() {
      assertTrue(sinLimite.errorItems(null).contains("al menos un producto"));
      assertTrue(sinLimite.errorItems(List.of()).contains("al menos un producto"));
   }

   @Test
   @DisplayName("RN-NEG-01: la cantidad debe ser un entero positivo (0, negativo o null se rechazan)")
   void cantidadNoPositiva() {
      assertTrue(sinLimite.errorItems(List.of(new ItemPedido(1L, 0))).contains("entero positivo"));
      assertTrue(sinLimite.errorItems(List.of(new ItemPedido(1L, -3))).contains("entero positivo"));
      assertTrue(sinLimite.errorItems(List.of(new ItemPedido(1L, null))).contains("entero positivo"));
   }

   @Test
   @DisplayName("Cada ítem debe tener un código de producto válido")
   void codigoProductoInvalido() {
      assertTrue(sinLimite.errorItems(List.of(new ItemPedido(null, 1))).contains("código de producto"));
      assertTrue(sinLimite.errorItems(List.of(new ItemPedido(0L, 1))).contains("código de producto"));
   }

   @Test
   @DisplayName("Un pedido con productos y cantidades positivas es válido")
   void pedidoValido() {
      assertNull(sinLimite.errorItems(List.of(new ItemPedido(1L, 2), new ItemPedido(7L, 1))));
   }

   @Test
   @DisplayName("No se aceptan más de 30 líneas distintas en un pedido")
   void demasiadasLineas() {
      List<ItemPedido> items = new ArrayList<>();
      for (long i = 1; i <= ValidadorPedido.MAX_LINEAS + 1; i++) {
         items.add(new ItemPedido(i, 1));
      }
      assertTrue(sinLimite.errorItems(items).contains("más de " + ValidadorPedido.MAX_LINEAS));
   }

   // ---------------------------- Límite de cantidad ----------------------------

   @Test
   @DisplayName("Sin límite configurado: se informa -1 y se acepta cualquier cantidad hasta el tope técnico")
   void sinLimiteConfigurado() {
      assertFalse(sinLimite.hayLimite());
      assertEquals(-1, sinLimite.limiteCantidad());
      assertNull(sinLimite.errorCantidad("Café americano", 200));
      assertTrue(sinLimite.errorCantidad("Café americano", ValidadorPedido.MAX_CANTIDAD_TECNICA + 1L)
            .contains("no puede superar"));
   }

   @Test
   @DisplayName("Con límite configurado: se rechaza la cantidad que lo supera")
   void conLimiteConfigurado() {
      assertTrue(conLimite.hayLimite());
      assertEquals(5, conLimite.limiteCantidad());
      assertNull(conLimite.errorCantidad("Humita", 5));
      assertTrue(conLimite.errorCantidad("Humita", 6).contains("hasta 5 unidades"));
   }

   // ---------------------------- Código de retiro ----------------------------

   @Test
   @DisplayName("El código de retiro se normaliza: sin espacios y en mayúsculas")
   void normalizaCodigo() {
      assertEquals("ABC234", sinLimite.normalizarCodigoRetiro("  abc234 "));
      assertEquals("", sinLimite.normalizarCodigoRetiro(null));
   }

   @Test
   @DisplayName("RN-NEG-05: el código tiene 6 caracteres del alfabeto sin I, O, 0 ni 1")
   void formatoCodigo() {
      assertTrue(sinLimite.formatoCodigoRetiroValido("ABC234"));
      assertTrue(sinLimite.formatoCodigoRetiroValido("ZZ9988"));
      assertFalse(sinLimite.formatoCodigoRetiroValido("ABC23"));      // corto
      assertFalse(sinLimite.formatoCodigoRetiroValido("ABC2345"));    // largo
      assertFalse(sinLimite.formatoCodigoRetiroValido("ABCI23"));     // contiene I
      assertFalse(sinLimite.formatoCodigoRetiroValido("ABC0O2"));     // contiene 0 y O
      assertFalse(sinLimite.formatoCodigoRetiroValido("abc234"));     // sin normalizar
   }
}
