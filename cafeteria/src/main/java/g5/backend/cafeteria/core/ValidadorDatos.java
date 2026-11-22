package g5.backend.cafeteria.core;

import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Validaciones y normalización de datos de personas, reutilizables por cualquier módulo
 * (cliente, trabajador, ...). Cada método "errorXxx" devuelve el mensaje de error,
 * o null si el valor es válido, para poder acumular todos los errores de un formulario.
 */
@Component
public class ValidadorDatos {

   private static final Pattern SOLO_LETRAS = Pattern.compile("^\\p{L}+(?: \\p{L}+)*$");
   private static final Pattern CORREO = Pattern.compile(
         "^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*\\.[A-Za-z]{2,}$");
   private static final Pattern DIEZ_DIGITOS = Pattern.compile("^[0-9]{10}$");
   private static final Pattern CELULAR = Pattern.compile("^09[0-9]{8}$");

   private static final int MIN_TEXTO = 2;
   private static final int MAX_TEXTO = 50;
   private static final int MAX_CORREO = 254;
   private static final int MIN_CONTRASENA = 8;
   private static final int MAX_CONTRASENA_BYTES = 72;   // límite de BCrypt

   /** Dominios institucionales permitidos (vacío = cualquier dominio). */
   private final List<String> dominios;

   public ValidadorDatos(
         @Value("${app.correo.dominios-institucionales:}") String[] dominios) {
      this.dominios = Arrays.stream(dominios)
            .map(d -> d.trim().toLowerCase(Locale.ROOT))
            .filter(d -> !d.isEmpty())
            .toList();
   }

   // ------------------------------------------------------------------
   // Normalización
   // ------------------------------------------------------------------

   /** Trim + espacios múltiples colapsados + NFC. Devuelve "" si es null. */
   public String normalizarTexto(String s) {
      if (s == null) {
         return "";
      }
      return Normalizer.normalize(s, Normalizer.Form.NFC).trim().replaceAll("\\s+", " ");
   }

   public String normalizarCorreo(String s) {
      return s == null ? "" : s.trim().toLowerCase(Locale.ROOT);
   }

   public String normalizarNumero(String s) {
      return s == null ? "" : s.trim();
   }

   // ------------------------------------------------------------------
   // Validaciones (null = válido)
   // ------------------------------------------------------------------

   public String errorNombre(String valor, String etiqueta) {
      if (valor.isEmpty()) {
         return etiqueta + " es obligatorio";
      }
      if (valor.length() < MIN_TEXTO || valor.length() > MAX_TEXTO) {
         return etiqueta + " debe tener entre " + MIN_TEXTO + " y " + MAX_TEXTO + " caracteres";
      }
      if (!SOLO_LETRAS.matcher(valor).matches()) {
         return etiqueta + " solo puede contener letras (sin números ni símbolos)";
      }
      return null;
   }

   public String errorCorreo(String valor) {
      if (valor.isEmpty()) {
         return "El correo es obligatorio";
      }
      if (valor.length() > MAX_CORREO || !CORREO.matcher(valor).matches()
            || valor.indexOf('@') > 64) {
         return "El correo no tiene un formato válido";
      }
      if (!dominios.isEmpty() && dominios.stream().noneMatch(d -> valor.endsWith("@" + d))) {
         return "Debe usar su correo institucional (@" + String.join(", @", dominios) + ")";
      }
      return null;
   }

   public String errorCelular(String valor) {
      if (valor.isEmpty()) {
         return "El celular es obligatorio";
      }
      if (!CELULAR.matcher(valor).matches()) {
         return "El celular debe tener 10 dígitos y empezar con 09";
      }
      return null;
   }

   /** Cédula ecuatoriana de persona natural: provincia, tercer dígito y verificador (módulo 10). */
   public String errorCedula(String valor) {
      if (valor.isEmpty()) {
         return "La cédula es obligatoria";
      }
      if (!DIEZ_DIGITOS.matcher(valor).matches()) {
         return "La cédula debe tener exactamente 10 dígitos numéricos";
      }
      int provincia = Integer.parseInt(valor.substring(0, 2));
      if (!((provincia >= 1 && provincia <= 24) || provincia == 30)) {
         return "La cédula tiene un código de provincia inválido";
      }
      if (valor.charAt(2) - '0' > 5) {
         return "La cédula no corresponde a una persona natural";
      }
      int suma = 0;
      for (int i = 0; i < 9; i++) {
         int d = valor.charAt(i) - '0';
         int p = (i % 2 == 0) ? d * 2 : d;
         suma += (p > 9) ? p - 9 : p;
      }
      int verificador = (10 - suma % 10) % 10;
      if (verificador != valor.charAt(9) - '0') {
         return "La cédula no es válida (dígito verificador incorrecto)";
      }
      return null;
   }

   public String errorContrasena(String valor) {
      if (valor == null || valor.isEmpty()) {
         return "La contraseña es obligatoria";
      }
      if (valor.length() < MIN_CONTRASENA) {
         return "La contraseña debe tener al menos " + MIN_CONTRASENA + " caracteres";
      }
      if (valor.getBytes(StandardCharsets.UTF_8).length > MAX_CONTRASENA_BYTES) {
         return "La contraseña es demasiado larga (máximo " + MAX_CONTRASENA_BYTES + " bytes)";
      }
      boolean letra = valor.chars().anyMatch(Character::isLetter);
      boolean digito = valor.chars().anyMatch(Character::isDigit);
      if (!letra || !digito) {
         return "La contraseña debe incluir al menos una letra y un número";
      }
      return null;
   }
}