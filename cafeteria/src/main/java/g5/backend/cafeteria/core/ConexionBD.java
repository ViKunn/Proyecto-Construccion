package g5.backend.cafeteria.core;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ConexionBD implements CommandLineRunner {

   private static final Logger log = LoggerFactory.getLogger(ConexionBD.class);
   private final DataSource dataSource;

   public ConexionBD(DataSource dataSource) {
      this.dataSource = dataSource;
   }

   public boolean verificarConexion() {
      try (Connection conn = dataSource.getConnection()) {
         boolean valida = conn != null && !conn.isClosed() && conn.isValid(5);
         if (valida) {
            DatabaseMetaData meta = conn.getMetaData();
            log.info(
                  "\n\nConexión exitosa a {} ({}) - Usuario: {}",
                  meta.getDatabaseProductName(),
                  meta.getURL(),
                  meta.getUserName());
         }
         return valida;
      } catch (SQLException e) {
         log.error(
               "No se pudo conectar a la base de datos [SQLState={}, ErrorCode={}]: {}",
               e.getSQLState(),
               e.getErrorCode(),
               e.getMessage());
         return false;
      }
   }

   @Override 
   public void run (String ... args) {
      verificarConexion();
   }
}