# Reporte de Análisis Estático del Código — Versión 2 (Segunda Ejecución)

**Proyecto:** Sistema de gestión de pedidos de una cafetería universitaria (`g5.backend:cafeteria`)  
**Versión del reporte:** 2.0 (Verificación posterior a correcciones — Release 1.0)  
**Fecha de 2.ª ejecución:** 26 de noviembre de 2026  
**Responsable:** Integrante 4  
**Colaboradores:** Integrante 1 e Integrante 2  
**Referencia de línea base:** [Reporte_Analisis_Estatico.md](Reporte_Analisis_Estatico.md) *(Versión 1 — 20 issues)*

---

## 1. Propósito de esta segunda ejecución

Este documento registra los resultados de la **segunda ejecución** de análisis estático con **SonarQube Community** tras aplicar las correcciones de accesibilidad, manejo de promesas y expresiones regulares en el Frontend Administrativo (`static/admin/`), permitiendo contrastar de forma directa la reducción de hallazgos frente a la Versión 1 (`Reporte_Analisis_Estatico.md`).

---

## 2. Comparativa directa: Versión 1 (Antes) vs Versión 2 (Después)

| Métrica en SonarQube | Versión 1 (23 nov 2026) | Versión 2 (26 nov 2026) | Variación |
| :--- | :---: | :---: | :---: |
| **Quality Gate** | Passed | **Passed** | Mantenido |
| **Total de issues abiertos** | 20 | **8** | **-12 (-60%)** |
| **New Code — Nuevos issues** | — | **0** | Limpio |
| **New Code — Duplicaciones** | — | **0.0%** | Limpio |
| **Reliability (Confiabilidad)** | 17 issues (C) | **5 issues (C)** | **-12 issues cerrados** |
| **Security (Seguridad)** | 3 issues (E) | **3 issues (E)** | Sin cambio *(backend)* |
| **Maintainability (Mantenibilidad)** | 2 issues (A) | **2 issues (A)** | Mantenido |
| **Issues en Frontend Admin (`static/admin/`)** | 12 issues | **0 issues** | **-12 (-100%)** |
| **Issues en Backend Java (`src/main/java/`)** | 8 issues | **8 issues** | Pendiente en backend |

---

## 3. Evidencias visuales de la Versión 2 (SonarQube Community)

### 3.1. Código nuevo (`New Code` — 0 issues nuevos, 0.0% duplicación)

![Resumen New Code v2](evidencias-v2/sonarqube-v2-01-new-code.png)

### 3.2. Resumen general (`Overall Code` — 8 issues totales)

![Resumen Overall Code v2](evidencias-v2/sonarqube-v2-02-overall.png)

### 3.3. Panel de salud y Seguridad (`Issues: 8`, `Security: 3`)

![Panel de salud y seguridad v2](evidencias-v2/sonarqube-v2-03-security.png)

### 3.4. Confiabilidad (`Reliability: 5 abiertos`, **`12 issues cerrados`**)

![Panel de confiabilidad v2 con 12 issues cerrados](evidencias-v2/sonarqube-v2-04-reliability.png)

### 3.5. Mantenibilidad (`Maintainability: 2 Low`, calificación **A**)

![Panel de mantenibilidad v2](evidencias-v2/sonarqube-v2-05-maintainability.png)

---

## 4. Detalle de los 12 issues resueltos entre Versión 1 y Versión 2

| Cantidad | Regla SonarQube | Archivos intervenidos | Corrección aplicada | Estado en v2 |
| :---: | :--- | :--- | :--- | :---: |
| **5** | `Web:InputWithoutLabelCheck` | `panel-administrador.html:119, 152`<br>`panel-trabajador.html:212, 213, 218` | Se creó la clase accesible `.sr-only` en `styles.css` y se asoció `<label for="...">` a cada campo de filtro/búsqueda. | **Cerrado (0)** |
| **6** | `javascript:S9383` | `administrador.js:333, 340, 346, 352, 358`<br>`trabajador.js:758` | Se antepuso el operador `void` en invocaciones de funciones `async` que ya manejan errores mediante `try/catch`. | **Cerrado (0)** |
| **1** | `javascript:S8786` | `validators.js:21` | Se reemplazó la expresión regular de correo por validación en tiempo lineal sin *backtracking* super-lineal. | **Cerrado (0)** |

---

## 5. Análisis técnico de los 8 issues remanentes (Falsos positivos y hallazgos no peligrosos en Backend Java)

Salida verificada de la API de SonarQube (`/api/issues/search?componentKeys=cafeteria&resolved=false`). Tras revisar cada hallazgo directamente contra el código fuente del backend, se confirma que **ninguno constituye una vulnerabilidad explotable ni un bug real en producción**:

| Severidad | Regla | Archivo y línea | Clasificación | Justificación técnica |
| :---: | :--- | :--- | :--- | :--- |
| **BLOCKER** | `java:S6437` | `auth/AuthServicio.java:32` | **Falso positivo** *(mejora opcional)* | No corresponde a la contraseña de ningún usuario. Es la cadena de relleno `"hash-falso-para-igualar-tiempos"` usada para calcular un hash BCrypt ficticio y mitigar *timing attacks* cuando un correo no existe. Como mejora de limpieza puede reemplazarse por `UUID.randomUUID().toString()`. |
| **MAJOR** | `java:S2077` ×2 | `historial/HistorialRepositorio.java:72`<br>`pedido/PedidoRepositorio.java:96` | **Falso positivo (Seguro)** | Los únicos fragmentos concatenados en la consulta son constantes internas del servidor (`where id_pedido = ?`, `?::estado_pedido_enum` y `asc`/`desc` obtenidos de un `boolean`). Todos los valores provenientes del usuario se pasan mediante parámetros `?` en `PreparedStatement`, evitando inyección SQL. |
| **MAJOR** | `java:S5998` ×2 | `core/ValidadorDatos.java:20, 22` | **Falso positivo práctico** | El riesgo de `StackOverflowError` solo ocurre con entradas muy extensas; aquí la longitud se valida **antes** de ejecutar las expresiones regulares (máx. 50 caracteres para nombres y 254 para correos), y los espacios separan las repeticiones. |
| **MAJOR** | `java:S5850` | `core/AlmacenImagenes.java:128` | **Cosmético** | La expresión `"^-+|-+$"` cumple exactamente la función de retirar guiones al inicio y al final; SonarQube solo recomienda agrupar la alternancia como `"(?:^-+)|(?:-+$)"`. |
| **MAJOR** | `java:S8786` ×2 | `core/AlmacenImagenes.java:128, 130` | **No explotable** | `slug()` colapsa previamente los separadores repetidos (`[^a-z0-9]+` → `"-"`) y el nombre de producto está acotado a un máximo de 60 caracteres, eliminando riesgo de *backtracking* significativo. |

---

## 6. Conclusiones

1. La segunda ejecución confirma una **reducción del 60% en el total de hallazgos** del proyecto (de **20** a **8** issues), cerrando el **100% de los hallazgos del Frontend Administrativo (`static/admin/`: 12 → 0)** y manteniendo **0 nuevos issues en `New Code`**.
2. El **Quality Gate** se mantiene en estado **Passed**, con **0.0% de duplicación en código nuevo** y calificación **A** en Mantenibilidad.
3. La revisión manual contra el código fuente demuestra que los **8 hallazgos remanentes del backend no representan vulnerabilidades ni errores funcionales reales** (6 son falsos positivos justificados por validaciones previas y consultas parametrizadas, y 2 son ajustes cosméticos/de limpieza opcionales).

