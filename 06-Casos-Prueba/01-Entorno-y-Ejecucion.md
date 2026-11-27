# Entorno y ejecución

[← Índice](README.md)

## Alcance y entorno

Se probaron las historias de usuario, las reglas de negocio RN-NEG-01 a 07 y requisitos no funcionales seleccionados.

| Elemento | Detalle |
|---|---|
| Código probado | Rama `main`, commit `aa1507f` |
| Aplicación | Spring Boot 4.2.0 sobre JDK 26 (el proyecto compila para Java 25) |
| Base de datos | PostgreSQL 17.12 local en Docker, cargada con los scripts de `07-Manual-Instalacion/sql` (se creó antes el esquema `extensions`, que Supabase ya incluye) |
| Navegador | Microsoft Edge, 1280 × 800 |
| Sistema operativo | Windows 11 |
| Datos | Cuentas y productos de prueba. La base compartida del equipo no se usó. |

### Cómo se ejecutaron

Los casos de interfaz se ejecutaron **de forma automatizada**: un script reproduce en Edge las acciones descritas en los pasos, comprueba el resultado en pantalla o en la base y guarda la captura. Cuando un caso necesita una situación previa (por ejemplo, un pedido existente o un cambio hecho por otro usuario), el script la prepara mediante la API. Los pasos permiten repetir cada caso a mano.

- Script: [evidencias/scripts/casos_interfaz.mjs](evidencias/scripts/casos_interfaz.mjs)
- Resultados: [evidencias/resultados_interfaz.json](evidencias/resultados_interfaz.json)

## Cómo repetir las pruebas

1. Iniciar un contenedor `postgres:17` llamado `cafeteria-pruebas`, con la base `cafeteria`.
2. Iniciar la aplicación en el puerto 8090 conectada a ese contenedor (variables `SPRING_DATASOURCE_*` y `SERVER_PORT`).
3. Ejecutar los scripts de `evidencias/scripts` con Node 22 o superior; los argumentos figuran en la cabecera de cada archivo.

Los scripts **borran y recargan** la base del contenedor y se detienen si la aplicación no está conectada a ella.
