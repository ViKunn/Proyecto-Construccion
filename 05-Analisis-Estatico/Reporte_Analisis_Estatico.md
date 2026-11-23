# Reporte de Análisis Estático del Código

**Proyecto:** Sistema de gestión de pedidos de una cafetería universitaria (`g5.backend:cafeteria`)  
**Versión:** 1.0 (Línea base — Release 1.0)  
**Fecha de 1.ª ejecución:** 22 de noviembre de 2026  
**Responsable:** Integrante 4  
**Colaboradores:** Integrante 1 e Integrante 2  

---

## 1. Propósito y alcance

Este reporte documenta la configuración, ejecución y análisis de los resultados obtenidos mediante herramientas de análisis estático sobre el código fuente del proyecto (Backend Spring Boot en Java 25 y Frontend Administrativo en HTML5/CSS3/JavaScript ES6+), con el objetivo de detectar defectos tempranos, problemas de estilo y malas prácticas antes del Release 1.0.

---

## 2. Herramientas seleccionadas y comandos de ejecución

| Capa | Herramienta | Versión | Alcance analizado | Reglas / Archivo de configuración |
| :--- | :--- | :--- | :--- | :--- |
| **Backend (Java 25)** | `maven-checkstyle-plugin` | 3.6.0 | 46 clases Java (`src/main` y `src/test`) | `cafeteria/config/checkstyle/checkstyle.xml` (convenciones de nombres, longitud máx. 120, imports limpios, llaves) |
| **Backend (Java 25)** | `maven-pmd-plugin` (PMD) | 3.28.0 (PMD 7.17.0) | 46 clases Java | Reglas estándar de buenas prácticas, código muerto y complejidad |
| **Backend (Java 25)** | `spotbugs-maven-plugin` | 4.9.8.0 | Bytecode compilado (`target/classes`) | Detección de defectos (`effort=Max`, `threshold=Low`) |
| **Frontend (JS)** | ESLint | Flat Config | 12 módulos en `static/admin/js/**/*.js` | `cafeteria/eslint.config.mjs` (`no-undef`, `no-unused-vars`, `eqeqeq`, `no-var`, `curly`) |
| **Frontend (HTML)** | HTMLHint | CLI | 3 vistas en `static/admin/*.html` | `cafeteria/.htmlhintrc` (`doctype-first`, `tag-pair`, `id-unique`, `attr-value-double-quotes`) |

### Comandos reproducibles

- **Backend (dentro de `cafeteria/` con JDK 25):**
  ```powershell
  .\mvnw.cmd clean compile checkstyle:check pmd:check spotbugs:check
  ```
- **Frontend (dentro de `cafeteria/`):**
  ```powershell
  npx eslint src/main/resources/static/admin/js
  npx htmlhint src/main/resources/static/admin/*.html
  ```

---

## 3. Primera ejecución (Línea base — 22 de noviembre de 2026)

### 3.1. Resumen cuantitativo general

| Herramienta | Archivos analizados | Errores Críticos / Altos | Hallazgos Medios / Advertencias | Hallazgos Bajos | Estado |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Checkstyle** | 46 clases Java | 0 | 9 advertencias | 0 | Con advertencias de estilo |
| **PMD** | 46 clases Java | 0 | 0 | 0 | Limpio |
| **SpotBugs** | 46 clases Java | 0 | 37 | 4 | Requiere revisión en backend |
| **ESLint** | 12 archivos JS | 0 | 0 | 0 | Limpio |
| **HTMLHint** | 3 archivos HTML | 0 | 0 | 0 | Limpio |

---

### 3.2. Detalle de hallazgos — Checkstyle (9 advertencias)

| Archivo | Línea | Regla | Descripción | Responsable sugerido |
| :--- | :---: | :--- | :--- | :--- |
| `auth/AuthServicio.java` | 13 | `ConstantName` | El nombre `log` no sigue el patrón de constantes `MAYUSCULAS`. | Integrante 1 |
| `core/AlmacenImagenes.java` | 27 | `ConstantName` | El nombre `log` no sigue el patrón de constantes `MAYUSCULAS`. | Integrante 1 |
| `core/ConexionBD.java` | 15 | `ConstantName` | El nombre `log` no sigue el patrón de constantes `MAYUSCULAS`. | Integrante 1 |
| `pedido/PedidoRepositorio.java` | 25, 71, 102, 115 | `LineLength` | 4 líneas superan los 120 caracteres (entre 122 y 133). | Integrante 2 |
| `pedido/PedidoServicio.java` | 158 | `LineLength` | Línea supera los 120 caracteres (121). | Integrante 2 |
| `producto/ProductoRepositorio.java` | 18 | `LineLength` | Línea supera los 120 caracteres (130). | Integrante 1 |

---

### 3.3. Detalle de hallazgos — SpotBugs (41 hallazgos: 37 Medios, 4 Bajos)

#### A. Hallazgos técnicos prioritarios (corrección recomendada)

| Severidad | Regla SpotBugs | Ubicación | Descripción y recomendación | Responsable |
| :---: | :--- | :--- | :--- | :--- |
| **Medio** | `NP_NULL_ON_SOME_PATH_FROM_RETURN_VALUE` | `core/AlmacenImagenes.java:77` | Posible `NullPointerException` al invocar método sobre un valor de retorno que puede ser `null`. Agregar validación explícita de nulidad. | Integrante 1 |
| **Medio** | `CT_CONSTRUCTOR_THROW` | `core/AlmacenImagenes.java:40` | El constructor lanza una excepción dejando el objeto parcialmente inicializado. Marcar la clase como `final` o inicializar el directorio en un método `@PostConstruct`. | Integrante 1 |
| **Medio** | `BX_UNBOXING_IMMEDIATELY_REBOXED` | `producto/ProductoRepositorio.java:63` | Conversión innecesaria de tipo primitivo/envoltura (unboxing y reboxing inmediato). Simplificar expresión. | Integrante 1 |
| **Medio** | `OBL_UNSATISFIED_OBLIGATION_EXCEPTION_EDGE` | `historial/HistorialRepositorio.java:84`<br>`pedido/PedidoRepositorio.java:70, 113`<br>`producto/ProductoRepositorio.java:90, 103` | 5 lambdas de `PreparedStatementCreator` donde un `PreparedStatement` podría quedar sin cerrarse si ocurre una excepción verificada antes de retornarlo a `JdbcTemplate`. Capturar excepción para cerrar `ps` o usar `NamedParameterJdbcTemplate`. | Integrante 1 y 2 |

#### B. Hallazgos de encapsulación y severidad baja (evaluación técnica)

| Severidad | Regla SpotBugs | Cantidad | Clases afectadas | Análisis técnico |
| :---: | :--- | :---: | :--- | :--- |
| **Medio** | `EI_EXPOSE_REP` / `EI_EXPOSE_REP2` | 29 | DTOs/Records con `List`/`Map` (`Pedido`, `PedidoControlador`, `ProductoControlador`, `HistorialPedido`, `PedidoDetalleAdmin`, `ValidacionException`) y servicios/repositorios con inyección Spring (`JdbcTemplate`, `DataSource`, repositorios). | En beans inyectados por Spring (`JdbcTemplate`, `DataSource`), corresponde a un patrón estándar del framework (falso positivo aceptado). En records/DTOs con colecciones (`List`), se recomienda aplicar `List.copyOf(...)` en constructores compactos. |
| **Bajo** | `SE_TRANSIENT_FIELD_NOT_RESTORED` | 2 | `core/ConflictoException.java`, `core/ValidacionException.java` | Campo `errores` marcado como `transient` en excepciones no serializadas vía Java Serialization (riesgo bajo). |
| **Bajo** | `THROWS_METHOD_THROWS_RUNTIMEEXCEPTION` | 2 | `producto/ProductoServicio.java:100, 161` | Métodos que lanzan `RuntimeException` genérica; se recomienda usar una excepción específica del dominio. |

---

### 3.4. Detalle de hallazgos — Frontend Administrativo (ESLint + HTMLHint)

- **ESLint (`src/main/resources/static/admin/js/**/*.js`):** 0 errores, 0 advertencias en los 12 módulos (`config.js`, `httpClient.js`, servicios, utilidades y controladores de página).
- **HTMLHint (`src/main/resources/static/admin/*.html`):** 0 errores, 0 advertencias en `index.html`, `panel-trabajador.html` y `panel-administrador.html` (`Scanned 3 files, no errors found`).

---

## 4. Plan de correcciones (coordinado con Integrantes 1 y 2)

1. **Integrante 1 (`auth`, `core`, `producto`, `historial`):**
   - Corregir posible `NullPointerException` en `AlmacenImagenes.java:77` y manejo de constructor en `AlmacenImagenes.java:40`.
   - Simplificar boxing/unboxing en `ProductoRepositorio.java:63`.
   - Renombrar constante `log` a `LOG` (o ajustar regla) en `AuthServicio`, `AlmacenImagenes` y `ConexionBD`, y dividir línea > 120 caracteres en `ProductoRepositorio.java:18`.
   - Revisar cierre seguro de `PreparedStatement` en lambdas de `ProductoRepositorio` y `HistorialRepositorio`.
2. **Integrante 2 (`pedido`):**
   - Dividir las 5 líneas mayores a 120 caracteres en `PedidoRepositorio.java` y `PedidoServicio.java`.
   - Revisar cierre seguro de `PreparedStatement` en lambdas de `PedidoRepositorio.java:70, 113`.
3. **Integrante 4 (Frontend Administrativo y re-auditoría):**
   - Mantener 0 errores en ESLint/HTMLHint y ejecutar la 2.ª auditoría completa una vez aplicadas las correcciones en `develop`.

---

## 5. Segunda ejecución (Verificación final — Pendiente de correcciones en `develop`)

*Esta sección se completará antes del Release 1.0 (26 de noviembre de 2026) tras incorporar las correcciones de Integrantes 1 y 2 en `develop`, incluyendo la tabla comparativa Antes vs Después.*

| Herramienta | Línea base (22 nov) | Ejecución final (26 nov) | Variación |
| :--- | :---: | :---: | :---: |
| **Checkstyle** | 9 advertencias | *Pendiente* | — |
| **PMD** | 0 violaciones | *Pendiente* | — |
| **SpotBugs (Prioritarios)** | 8 hallazgos | *Pendiente* | — |
| **ESLint (Frontend Admin)** | 0 errores | *Pendiente* | — |
| **HTMLHint (Frontend Admin)** | 0 errores | *Pendiente* | — |
