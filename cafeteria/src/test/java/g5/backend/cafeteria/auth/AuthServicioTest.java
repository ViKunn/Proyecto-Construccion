package g5.backend.cafeteria.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import g5.backend.cafeteria.auth.AuthRepositorio.RegistroLogin;
import g5.backend.cafeteria.core.NoEncontradoException;
import g5.backend.cafeteria.core.ValidacionException;
import g5.backend.cafeteria.core.ValidadorDatos;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Pruebas unitarias de {@link AuthServicio}: inicio de sesión y cambio de contraseña (HU-USU-01).
 * El repositorio se simula con Mockito; el codificador BCrypt es real (costo 4 para que sea rápido).
 */
class AuthServicioTest {

   private static final long ID_USUARIO = 7L;
   private static final String ACTUAL = "cafeteria123";
   private static final String NUEVA = "NuevaClave2026";

   private AuthRepositorio repositorio;
   private PasswordEncoder encoder;
   private AuthServicio servicio;
   private String hashActual;

   @BeforeEach
   void preparar() {
      repositorio = mock(AuthRepositorio.class);
      encoder = new BCryptPasswordEncoder(4);
      servicio = new AuthServicio(repositorio, encoder, new ValidadorDatos(new String[0]));
      hashActual = encoder.encode(ACTUAL);
   }

   // ------------------------------------------------------------------
   // Cambio de contraseña
   // ------------------------------------------------------------------

   @Test
   @DisplayName("Cambia la contraseña y guarda un hash BCrypt de la nueva, nunca el texto plano")
   void cambiaContrasenaCorrectamente() {
      when(repositorio.buscarHashPorId(ID_USUARIO)).thenReturn(Optional.of(hashActual));
      when(repositorio.actualizarContrasena(eq(ID_USUARIO), anyString())).thenReturn(true);

      servicio.cambiarContrasena(ID_USUARIO, ACTUAL, NUEVA);

      ArgumentCaptor<String> hash = ArgumentCaptor.forClass(String.class);
      verify(repositorio).actualizarContrasena(eq(ID_USUARIO), hash.capture());
      assertTrue(encoder.matches(NUEVA, hash.getValue()), "El hash guardado debe corresponder a la nueva");
      assertTrue(!hash.getValue().equals(NUEVA), "No se debe guardar la contraseña en texto plano");
   }

   @Test
   @DisplayName("Rechaza el cambio si la contraseña actual es incorrecta")
   void rechazaContrasenaActualIncorrecta() {
      when(repositorio.buscarHashPorId(ID_USUARIO)).thenReturn(Optional.of(hashActual));

      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.cambiarContrasena(ID_USUARIO, "otraClave99", NUEVA));

      assertEquals("La contraseña actual es incorrecta", e.getErrores().get("contrasenaActual"));
      verify(repositorio, never()).actualizarContrasena(anyLong(), anyString());
   }

   @Test
   @DisplayName("Rechaza una nueva contraseña que no cumple la política (muy corta)")
   void rechazaNuevaContrasenaCorta() {
      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.cambiarContrasena(ID_USUARIO, ACTUAL, "abc1"));

      assertTrue(e.getErrores().get("contrasenaNueva").contains("al menos 8"));
      verify(repositorio, never()).actualizarContrasena(anyLong(), anyString());
   }

   @Test
   @DisplayName("Rechaza una nueva contraseña sin números")
   void rechazaNuevaContrasenaSinNumeros() {
      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.cambiarContrasena(ID_USUARIO, ACTUAL, "soloLetrasAqui"));

      assertTrue(e.getErrores().containsKey("contrasenaNueva"));
   }

   @Test
   @DisplayName("Rechaza que la nueva contraseña sea igual a la actual")
   void rechazaNuevaIgualALaActual() {
      when(repositorio.buscarHashPorId(ID_USUARIO)).thenReturn(Optional.of(hashActual));

      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.cambiarContrasena(ID_USUARIO, ACTUAL, ACTUAL));

      assertEquals("La nueva contraseña debe ser distinta de la actual", e.getErrores().get("contrasenaNueva"));
      verify(repositorio, never()).actualizarContrasena(anyLong(), anyString());
   }

   @Test
   @DisplayName("Informa ambos campos cuando faltan la contraseña actual y la nueva")
   void informaCamposFaltantes() {
      ValidacionException e = assertThrows(ValidacionException.class,
            () -> servicio.cambiarContrasena(ID_USUARIO, null, null));

      assertTrue(e.getErrores().containsKey("contrasenaActual"));
      assertTrue(e.getErrores().containsKey("contrasenaNueva"));
   }

   @Test
   @DisplayName("Responde 'no encontrado' si el usuario de la sesión ya no existe")
   void usuarioInexistente() {
      when(repositorio.buscarHashPorId(ID_USUARIO)).thenReturn(Optional.empty());

      assertThrows(NoEncontradoException.class,
            () -> servicio.cambiarContrasena(ID_USUARIO, ACTUAL, NUEVA));
   }

   // ------------------------------------------------------------------
   // Inicio de sesión
   // ------------------------------------------------------------------

   @Test
   @DisplayName("Autentica a un trabajador con credenciales correctas")
   void autenticaConCredencialesCorrectas() {
      when(repositorio.buscarPorCorreo("maria.lopez@institucion.edu.ec")).thenReturn(Optional.of(
            new RegistroLogin(2L, "maria.lopez@institucion.edu.ec", hashActual,
                  TipoUsuario.TRABAJADOR, 1L, "María", "López")));

      Optional<UsuarioAutenticado> u = servicio.autenticar(" maria.lopez@institucion.edu.ec ", ACTUAL);

      assertTrue(u.isPresent());
      assertEquals(TipoUsuario.TRABAJADOR, u.get().tipo());
      assertEquals(1L, u.get().idTrabajador());
   }

   @Test
   @DisplayName("No autentica con contraseña incorrecta ni con correo inexistente")
   void noAutenticaCredencialesIncorrectas() {
      when(repositorio.buscarPorCorreo("ana.torres@institucion.edu.ec")).thenReturn(Optional.of(
            new RegistroLogin(5L, "ana.torres@institucion.edu.ec", hashActual,
                  TipoUsuario.CLIENTE, 1L, "Ana", "Torres")));
      when(repositorio.buscarPorCorreo("nadie@institucion.edu.ec")).thenReturn(Optional.empty());

      assertTrue(servicio.autenticar("ana.torres@institucion.edu.ec", "incorrecta1").isEmpty());
      assertTrue(servicio.autenticar("nadie@institucion.edu.ec", ACTUAL).isEmpty());
   }

   @Test
   @DisplayName("Después de cambiar la contraseña, la anterior ya no sirve para iniciar sesión")
   void contrasenaAnteriorDejaDeFuncionar() {
      when(repositorio.buscarHashPorId(ID_USUARIO)).thenReturn(Optional.of(hashActual));
      when(repositorio.actualizarContrasena(eq(ID_USUARIO), anyString())).thenReturn(true);
      servicio.cambiarContrasena(ID_USUARIO, ACTUAL, NUEVA);

      ArgumentCaptor<String> hash = ArgumentCaptor.forClass(String.class);
      verify(repositorio).actualizarContrasena(eq(ID_USUARIO), hash.capture());
      when(repositorio.buscarPorCorreo("admin@institucion.edu.ec")).thenReturn(Optional.of(
            new RegistroLogin(ID_USUARIO, "admin@institucion.edu.ec", hash.getValue(),
                  TipoUsuario.ADMINISTRADOR, null, null, null)));

      assertTrue(servicio.autenticar("admin@institucion.edu.ec", ACTUAL).isEmpty());
      assertTrue(servicio.autenticar("admin@institucion.edu.ec", NUEVA).isPresent());
   }
}
