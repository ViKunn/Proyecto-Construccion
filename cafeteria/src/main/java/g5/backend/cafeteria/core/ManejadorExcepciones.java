package g5.backend.cafeteria.core;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Formato único de errores: {"mensaje": "...", "errores": {"campo": "detalle"}}
 */
@RestControllerAdvice
public class ManejadorExcepciones {

   @ExceptionHandler(ValidacionException.class)
   public ResponseEntity<Map<String, Object>> validacion(ValidacionException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("mensaje", "Datos inválidos", "errores", e.getErrores()));
   }

   @ExceptionHandler(ConflictoException.class)
   public ResponseEntity<Map<String, Object>> conflicto(ConflictoException e) {
      return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("mensaje", e.getMessage(), "errores", e.getErrores()));
   }

   @ExceptionHandler(NoEncontradoException.class)
   public ResponseEntity<Map<String, Object>> noEncontrado(NoEncontradoException e) {
      return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("mensaje", e.getMessage()));
   }

   @ExceptionHandler(MaxUploadSizeExceededException.class)
   public ResponseEntity<Map<String, Object>> archivoGrande(MaxUploadSizeExceededException e) {
      return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(Map.of("mensaje", "La imagen supera el tamaño máximo permitido",
                  "errores", Map.of("imagen", "La imagen supera el tamaño máximo permitido")));
   }

   @ExceptionHandler(HttpMessageNotReadableException.class)
   public ResponseEntity<Map<String, Object>> cuerpoInvalido(HttpMessageNotReadableException e) {
      return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("mensaje", "El cuerpo de la petición no es un JSON válido"));
   }
}