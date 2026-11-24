package g5.backend.cafeteria.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Pruebas unitarias de {@link ValidadorDatos}: cédula ecuatoriana, celular, correo institucional,
 * nombres y política de contraseñas usada en el registro y en el cambio de contraseña.
 */
class ValidadorDatosTest {

   private final ValidadorDatos validador = new ValidadorDatos(new String[] {"institucion.edu.ec"});

   @Test
   @DisplayName("Acepta una cédula ecuatoriana con dígito verificador correcto")
   void cedulaValida() {
      assertNull(validador.errorCedula("1710034065"));
   }

   @Test
   @DisplayName("Rechaza cédulas con dígito verificador, provincia, tercer dígito o longitud inválidos")
   void cedulasInvalidas() {
      assertTrue(validador.errorCedula("1710034066").contains("dígito verificador"));
      assertTrue(validador.errorCedula("9910034065").contains("provincia"));
      assertTrue(validador.errorCedula("1770034065").contains("persona natural"));
      assertTrue(validador.errorCedula("171003406").contains("10 dígitos"));
      assertTrue(validador.errorCedula("17100340AB").contains("10 dígitos"));
      assertEquals("La cédula es obligatoria", validador.errorCedula(""));
   }

   @Test
   @DisplayName("El celular debe tener 10 dígitos y empezar con 09")
   void celular() {
      assertNull(validador.errorCelular("0991000001"));
      assertTrue(validador.errorCelular("0891000001").contains("09"));
      assertTrue(validador.errorCelular("099100000").contains("09"));
   }

   @Test
   @DisplayName("Solo se acepta el correo del dominio institucional configurado")
   void correoInstitucional() {
      assertNull(validador.errorCorreo("ana.torres@institucion.edu.ec"));
      assertTrue(validador.errorCorreo("ana.torres@gmail.com").contains("institucional"));
      assertTrue(validador.errorCorreo("sin-arroba").contains("formato"));
   }

   @Test
   @DisplayName("Los nombres solo admiten letras y se normalizan los espacios")
   void nombres() {
      assertNull(validador.errorNombre("María José", "El nombre"));
      assertTrue(validador.errorNombre("Ana2", "El nombre").contains("solo puede contener letras"));
      assertEquals("María José", validador.normalizarTexto("  María    José "));
   }

   @Test
   @DisplayName("Política de contraseñas: mínimo 8 caracteres, con letras y números, máximo 72 bytes")
   void contrasenas() {
      assertNull(validador.errorContrasena("cafeteria123"));
      assertTrue(validador.errorContrasena("abc12").contains("al menos 8"));
      assertTrue(validador.errorContrasena("solamenteletras").contains("una letra y un número"));
      assertTrue(validador.errorContrasena("12345678").contains("una letra y un número"));
      assertTrue(validador.errorContrasena("a1".repeat(40)).contains("demasiado larga"));
      assertEquals("La contraseña es obligatoria", validador.errorContrasena(null));
   }
}
