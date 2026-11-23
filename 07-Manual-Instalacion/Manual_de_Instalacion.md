# Manual de Instalación

**Proyecto:** Sistema de gestión de pedidos de una cafetería universitaria (`g5.backend:cafeteria`)  
**Versión:** 1.0 (Release 1.0)  
**Fecha:** 22 de noviembre de 2026  
**Responsable:** Integrante 2  
**Colaboradores:** Integrante 1 e Integrante 4

---

## 1. Propósito

Este manual explica cómo instalar, configurar y ejecutar la aplicación desde cero: preparar la base de datos en Supabase, descargar el código, configurar la conexión, compilar, ejecutar las pruebas y comprobar que el sistema funciona. Está dirigido a cualquier persona del equipo o al docente que necesite levantar el Release 1.0 en su equipo.

## 2. Arquitectura resumida

| Componente | Tecnología | Ubicación |
| :--- | :--- | :--- |
| Servidor (API REST + páginas web) | Java 25, Spring Boot 4.2.0 | `cafeteria/` (rama `main` o `develop`) |
| Base de datos | PostgreSQL administrado por Supabase | Proyecto Supabase del equipo |
| Interfaz web | HTML, CSS y JavaScript | `cafeteria/src/main/resources/static/` (la sirve el mismo servidor) |

El navegador solo se comunica con el servidor (puerto 8080). El servidor es el único que se conecta a Supabase.

## 3. Requisitos previos

| Software | Versión | Comprobación |
| :--- | :--- | :--- |
| JDK (Temurin u OpenJDK) | **25** | `java -version` |
| Git | 2.40 o superior | `git --version` |
| Maven | No hace falta instalarlo: se usa el Maven Wrapper incluido (`mvnw`) | — |
| Navegador | Chrome, Edge o Firefox actualizados | — |
| Conexión a Internet | Necesaria para Supabase y para la primera descarga de dependencias | — |

Hardware mínimo: 4 GB de RAM y 1 GB libre en disco (dependencias de Maven incluidas).

**Variable `JAVA_HOME` (Windows):** Panel de control → Sistema → Configuración avanzada → Variables de entorno → crear `JAVA_HOME` con la carpeta del JDK 25 (por ejemplo `C:\Program Files\Eclipse Adoptium\jdk-25`) y agregar `%JAVA_HOME%\bin` al `Path`. Abrir una consola nueva y verificar con `java -version`.

## 4. Preparar la base de datos (Supabase)

Si el equipo ya tiene la base creada, este paso se omite y se usan sus credenciales (sección 6).

1. Ingresar a <https://supabase.com>, crear una cuenta y un proyecto nuevo (región sugerida: *East US*). Guardar la contraseña de la base de datos.
2. Abrir **SQL Editor → New query**, pegar el contenido de [`sql/cafeteria_schema.sql`](sql/cafeteria_schema.sql) y pulsar **Run**. El script crea los tipos, las tablas, los triggers con las reglas de negocio, la función `crear_pedido` y las vistas.
   > ⚠️ La sección 0 de este script **elimina las tablas y todos sus datos** antes de volver a crearlas. No ejecutarlo sobre una base con datos reales.
3. (Opcional, para pruebas) En una consulta nueva, ejecutar [`sql/insert_cafeteria.sql`](sql/insert_cafeteria.sql) **una sola vez**. Crea 1 administrador, 3 trabajadores, 6 clientes, 12 productos y 8 pedidos en distintos estados.
4. Comprobar los datos:
   ```sql
   select id_pedido, estado, codigo_retiro, importe_total from pedido order by id_pedido;
   ```
5. En **Project Settings → Database → Connection string → JDBC**, copiar los datos del *Session pooler*: host, puerto, usuario y contraseña.

**Cuentas de prueba** (todas con la contraseña `cafeteria123`):

| Tipo | Correo |
| :--- | :--- |
| Administrador | `admin@institucion.edu.ec` |
| Trabajador | `maria.lopez@institucion.edu.ec` |
| Cliente | `ana.torres@institucion.edu.ec` |

## 5. Obtener el código fuente

```bash
git clone https://github.com/ViKunn/Proyecto-Construccion.git
cd Proyecto-Construccion
git checkout main        # versión estable (usar develop para la versión en integración)
cd cafeteria
```

## 6. Configurar la conexión

Editar `cafeteria/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://<HOST>:5432/postgres?sslmode=require
spring.datasource.username=<USUARIO>
spring.datasource.password=<CONTRASEÑA>

# Dominio de correo permitido para registrar clientes y trabajadores
app.correo.dominios-institucionales=institucion.edu.ec

# Carpeta donde se guardan las imágenes de productos (se crea sola)
app.imagenes.directorio=uploads/productos

# Máximo de unidades por producto en un pedido (-1 = sin límite)
app.pedidos.cantidad-maxima-por-producto=-1
```

> **Buena práctica:** no publicar la contraseña real en el repositorio. Spring Boot permite pasarla como variable de entorno, que tiene prioridad sobre el archivo:
> - Windows (PowerShell): `$env:SPRING_DATASOURCE_PASSWORD="<CONTRASEÑA>"`
> - Linux/macOS: `export SPRING_DATASOURCE_PASSWORD="<CONTRASEÑA>"`

## 7. Compilar, probar y ejecutar

Desde la carpeta `cafeteria`:

| Paso | Windows (PowerShell/CMD) | Linux / macOS |
| :--- | :--- | :--- |
| Compilar | `.\mvnw.cmd clean compile` | `./mvnw clean compile` |
| Pruebas unitarias (no usan la base de datos) | `.\mvnw.cmd test -Dtest="*Test"` | `./mvnw test -Dtest='*Test'` |
| Todas las pruebas (incluye `contextLoads`, que sí se conecta a Supabase) | `.\mvnw.cmd test` | `./mvnw test` |
| Ejecutar la aplicación | `.\mvnw.cmd spring-boot:run` | `./mvnw spring-boot:run` |
| Generar el ejecutable `.jar` | `.\mvnw.cmd clean package -DskipTests` | `./mvnw clean package -DskipTests` |
| Ejecutar el `.jar` | `java -jar target\cafeteria-0.0.1-SNAPSHOT.jar` | `java -jar target/cafeteria-0.0.1-SNAPSHOT.jar` |

La primera compilación descarga las dependencias y puede tardar varios minutos.

## 8. Verificar la instalación

1. En la consola debe aparecer `Conexión exitosa a PostgreSQL ...` (lo registra `ConexionBD` al iniciar) y `Tomcat started on port 8080`.
2. Abrir `http://localhost:8080/api/productos/menu`: debe mostrar en JSON los productos disponibles.
3. Abrir `http://localhost:8080/admin/index.html` e iniciar sesión con `maria.lopez@institucion.edu.ec` / `cafeteria123`: debe aparecer el panel del trabajador con la cola de pedidos.
4. Iniciar sesión con `admin@institucion.edu.ec`: debe aparecer el panel del administrador con la lista de trabajadores.

La referencia completa de los endpoints está en el documento *API REST – Cafetería*.

## 9. Problemas frecuentes

| Síntoma | Causa probable | Solución |
| :--- | :--- | :--- |
| `release version 25 not supported` o `invalid target release: 25` | El JDK activo no es el 25 | Instalar JDK 25 y corregir `JAVA_HOME` (sección 3) |
| `No se pudo conectar a la base de datos` o `Connection refused` | URL, usuario o contraseña incorrectos, o sin Internet | Revisar la sección 6; usar el *Session pooler* con `sslmode=require` |
| Error 500 con `relation "producto" does not exist` en la consola | No se ejecutó `cafeteria_schema.sql` | Ejecutar el script de la sección 4 |
| `Port 8080 was already in use` | Otra aplicación usa el puerto | Cerrarla o agregar `server.port=8081` en `application.properties` |
| `mvnw: Permission denied` (Linux/macOS) | El wrapper no tiene permiso de ejecución | `chmod +x mvnw` |
| Login correcto pero 401 en las siguientes peticiones | El navegador no envía la cookie `CAFETERIA_SESION` | Abrir la web desde `http://localhost:8080`, no desde el archivo HTML directamente |
| `duplicate key value violates unique constraint` al cargar datos | `insert_cafeteria.sql` ya se ejecutó antes | Volver a ejecutar `cafeteria_schema.sql` (borra todo) y luego el script de datos |

## 10. Desinstalación

Detener la aplicación con `Ctrl + C`, borrar la carpeta del repositorio y, si se desea, eliminar el proyecto en Supabase (**Project Settings → General → Delete project**).
