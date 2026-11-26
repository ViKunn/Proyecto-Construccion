# Documentación técnica de la base de datos

**Proyecto:** Sistema de Gestión de Pedidos de Cafetería Universitaria  
**Motor:** PostgreSQL (Supabase) · esquema `public`  
**Versión:** 1.0

---

## Contenido

1. [Enumerados](#1-enumerados)
2. [Tablas](#2-tablas)
3. [Vistas](#3-vistas)
4. [Funciones](#4-funciones)
5. [Triggers](#5-triggers)
6. [Índices](#6-índices)
7. [Seguridad a nivel de fila (RLS)](#7-seguridad-a-nivel-de-fila-rls)
8. [Extensiones y datos iniciales](#8-extensiones-y-datos-iniciales)
9. [Flujos clave](#9-flujos-clave)
10. [Trazabilidad con el backend](#10-trazabilidad-con-el-backend)

### Convenciones de este documento

- **Restricciones explícitas e implícitas:** Las restricciones críticas de dominio e integridad cuentan con identificadores explícitos (por ejemplo, `ck_usuario_correo`). Las demás (claves primarias, claves foráneas y restricciones `UNIQUE` o `CHECK` en línea) utilizan identificadores generados automáticamente por PostgreSQL y se referencian por su función.
- **Reglas de negocio:** Los códigos `RN-NEG-xx` identifican las reglas de negocio del sistema aplicadas directamente a nivel de motor de base de datos.
- **Uso en el backend:** Indica si el servidor Spring Boot consulta u opera el objeto directamente. Los triggers y valores por defecto actúan de forma automática ante cualquier operación sobre las tablas.

---

## 1. Enumerados

El orden de los valores importa en `estado_pedido_enum`, ya que representa el flujo secuencial del pedido.

| Enumerado | Valores (en orden) | Se usa en | Clase en el backend |
|---|---|---|---|
| `tipo_usuario_enum` | `cliente`, `trabajador`, `administrador` | `usuario.tipo_usuario` | `TipoUsuario` |
| `tipo_producto_enum` | `bebida`, `alimento` | `producto.tipo_producto` | `TipoProducto` |
| `estado_pedido_enum` | `pendiente`, `en_preparacion`, `listo`, `entregado` | `pedido.estado`, `historial_estado_pedido.estado` | `EstadoPedido` |

**Qué evitan:** Que se almacene un rol, tipo de producto o estado inválido (por ejemplo, `"cancelado"`). Cualquier valor fuera del dominio es rechazado por el motor de base de datos.

---

## 2. Tablas

### Relaciones entre tablas

| Relación | Cardinalidad | Comportamiento al borrar |
|---|---|---|
| `usuario` → `cliente` | 1 a 0..1 | `RESTRICT`: no se puede borrar un usuario con perfil |
| `usuario` → `trabajador` | 1 a 0..1 | `RESTRICT` |
| `cliente` → `pedido` | 1 a N | `RESTRICT`: no se puede borrar un cliente con pedidos |
| `pedido` → `detalle_pedido` | 1 a N | `CASCADE`: al borrar el pedido se borran sus líneas |
| `producto` → `detalle_pedido` | 1 a N | `RESTRICT`: no se puede borrar un producto ya pedido |
| `pedido` → `historial_estado_pedido` | 1 a N (máximo 4) | `CASCADE` |
| `trabajador` → `historial_estado_pedido` | 1 a N | `RESTRICT` |

El administrador es un `usuario` sin perfil asociado: no posee registro en `cliente` ni en `trabajador`.

---

### 2.1 `usuario`

Cuenta de acceso al sistema. Almacena las credenciales y el rol; los datos personales residen en `cliente` o `trabajador`.

| Columna | Tipo de dato | Restricciones |
|---|---|---|
| `id_usuario` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `correo` | `text` | `NOT NULL`, `ck_usuario_correo`, único sin distinguir mayúsculas (`ux_usuario_correo`) |
| `contrasena_hash` | `text` | `NOT NULL` |
| `tipo_usuario` | `tipo_usuario_enum` | `NOT NULL` |

| Constraint | Tipo | Qué hace | Qué evita |
|---|---|---|---|
| Clave primaria (`id_usuario`) | PK | Identifica cada cuenta; el valor lo genera la base de datos. | Identificadores repetidos. Con `GENERATED ALWAYS` también impide inserciones manuales de ID. |
| `ck_usuario_correo` | CHECK | Exige formato de correo válido: un solo `@`, sin espacios y con al menos un punto después del `@`. | Correos mal formados como `juan`, `juan@`, `juan@dominio`, `juan perez@x.com` o `a@@b.com`. |
| `ux_usuario_correo` | Índice único sobre `lower(correo)` | Garantiza un solo usuario por correo, ignorando mayúsculas. | Duplicados como `Ana@x.com` y `ana@x.com`. |
| `NOT NULL` en `contrasena_hash` | NOT NULL | Obliga a almacenar siempre un hash. | Cuentas sin contraseña. |

Expresión del `CHECK` (comparación insensible a mayúsculas, operador `~*`):

```text
^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$
```

> La columna guarda **únicamente el hash BCrypt** (`$2a$`, costo 10), nunca la contraseña en texto plano. La base de datos no valida la estructura del hash; es responsabilidad del backend generarlo mediante `BCryptPasswordEncoder`.

---

### 2.2 `cliente`

Perfil de los usuarios con rol `cliente`.

| Columna | Tipo de dato | Restricciones |
|---|---|---|
| `codigo_cliente` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `id_usuario` | `bigint` | `NOT NULL`, `UNIQUE`, FK → `usuario(id_usuario)` `ON DELETE RESTRICT` |
| `nombre` | `text` | `NOT NULL`, `CHECK (btrim(nombre) <> '')` |
| `apellido` | `text` | `NOT NULL`, `CHECK (btrim(apellido) <> '')` |
| `cedula` | `varchar(10)` | `NOT NULL`, `UNIQUE`, `CHECK` de 10 dígitos |
| `celular` | `varchar(10)` | `NOT NULL`, `CHECK` formato `09XXXXXXXX` |

| Constraint | Tipo | Qué hace | Qué evita |
|---|---|---|---|
| Clave primaria (`codigo_cliente`) | PK | Identifica al cliente; es el valor que el backend almacena en la sesión. | Identificadores repetidos. |
| `id_usuario` único | UNIQUE | Asegura que cada usuario tenga como máximo un perfil de cliente. | Dos perfiles de cliente asociados a la misma cuenta. |
| `id_usuario` → `usuario` | FK `RESTRICT` | Obliga a que el perfil pertenezca a un usuario existente. | Perfiles huérfanos y eliminación de cuentas con perfil activo. |
| `nombre` / `apellido` no vacíos | CHECK | Rechaza textos vacíos o compuestos solo por espacios (`btrim` elimina espacios en los extremos). | Valores como `''` o `'   '`. |
| `cedula` solo dígitos | CHECK | Exige exactamente 10 caracteres numéricos (`^[0-9]{10}$`). | Cédulas con letras, guiones o longitud distinta de 10. |
| `cedula` única | UNIQUE | Impide registrar dos clientes con la misma cédula. | Clientes duplicados. |
| `celular` | CHECK | Exige 10 dígitos que inicien con `09` (`^09[0-9]{8}$`). | Números con prefijos inválidos, letras o longitud incorrecta. |

El trigger `trg_cliente_tipo_usuario` complementa estas restricciones (ver [sección 5](#5-triggers)).

---

### 2.3 `trabajador`

Perfil de los usuarios con rol `trabajador`.

| Columna | Tipo de dato | Restricciones |
|---|---|---|
| `id_trabajador` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `id_usuario` | `bigint` | `NOT NULL`, `UNIQUE`, FK → `usuario(id_usuario)` `ON DELETE RESTRICT` |
| `nombre` | `text` | `NOT NULL`, `CHECK (btrim(nombre) <> '')` |
| `apellido` | `text` | `NOT NULL`, `CHECK (btrim(apellido) <> '')` |
| `cedula` | `varchar(10)` | `NOT NULL`, `UNIQUE`, `CHECK` de 10 dígitos |

| Constraint | Tipo | Qué hace | Qué evita |
|---|---|---|---|
| Clave primaria (`id_trabajador`) | PK | Identifica al trabajador; es el valor registrado en la auditoría de cambios de estado. | Identificadores repetidos. |
| `id_usuario` único | UNIQUE | Un usuario tiene como máximo un perfil de trabajador. | Dos perfiles para la misma cuenta. |
| `id_usuario` → `usuario` | FK `RESTRICT` | Obliga a que el perfil pertenezca a un usuario existente. | Perfiles huérfanos y borrado de cuentas con perfil. |
| `nombre` / `apellido` no vacíos | CHECK | Rechaza textos vacíos o solo con espacios. | Valores como `''` o `'   '`. |
| `cedula` solo dígitos | CHECK | Exige exactamente 10 caracteres numéricos. | Cédulas con letras o longitud distinta de 10. |
| `cedula` única | UNIQUE | Impide registrar dos trabajadores con la misma cédula. | Trabajadores duplicados. |

El trigger `trg_trabajador_tipo_usuario` complementa estas restricciones (ver [sección 5](#5-triggers)).

---

### 2.4 `producto`

Catálogo de bebidas y alimentos. Un producto no se elimina físicamente para preservar la integridad histórica: se retira del menú mediante `disponible = false`.

| Columna | Tipo de dato | Restricciones |
|---|---|---|
| `codigo_producto` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `nombre` | `text` | `NOT NULL`, `CHECK (btrim(nombre) <> '')`, único sin distinguir mayúsculas (`ux_producto_nombre`) |
| `precio` | `numeric(10,2)` | `NOT NULL`, `CHECK (precio > 0)` |
| `disponible` | `boolean` | `NOT NULL`, `DEFAULT true` |
| `tipo_producto` | `tipo_producto_enum` | `NOT NULL` |
| `ruta_imagen` | `text` | Admite `NULL`, `ck_producto_ruta_imagen` |

| Constraint | Tipo | Qué hace | Qué evita |
|---|---|---|---|
| Clave primaria (`codigo_producto`) | PK | Identifica al producto. | Identificadores repetidos. |
| `nombre` no vacío | CHECK | Rechaza nombres vacíos o con solo espacios. | Productos sin nombre visible. |
| `ux_producto_nombre` | Índice único sobre `lower(nombre)` | Garantiza nombres únicos ignorando mayúsculas. | Duplicados como `Café` y `café`. |
| `precio > 0` | CHECK | Exige un precio positivo con dos decimales (`numeric(10,2)`, hasta `99 999 999.99`). | Productos gratuitos, precios negativos o decimales excesivos. |
| `disponible` por defecto `true` | DEFAULT | Todo producto nuevo aparece activo en el menú. | Productos nuevos con estado indefinido. |
| `ck_producto_ruta_imagen` | CHECK | Si existe imagen, exige una ruta **relativa** con segmentos alfanuméricos (`_`, `-`) separados por `/` y extensión `.jpg`, `.jpeg`, `.png` o `.webp`. Admite `NULL`. | Rutas absolutas (`/etc/x.png`), saltos de directorio (`../`), URLs externas o archivos no permitidos. |

Expresión de `ck_producto_ruta_imagen` (insensible a mayúsculas):

```text
^[a-z0-9_-]+(/[a-z0-9_-]+)*\.(jpg|jpeg|png|webp)$
```

Ejemplo válido: `bebida/cafe-americano-1a2b3c4d.png`.

---

### 2.5 `pedido`

Cabecera de cada pedido. El cliente solo aporta su identificador; el código de retiro, el estado inicial y el importe total los controla la base de datos.

| Columna | Tipo de dato | Restricciones |
|---|---|---|
| `id_pedido` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `codigo_cliente` | `bigint` | `NOT NULL`, FK → `cliente(codigo_cliente)` `ON DELETE RESTRICT` |
| `codigo_retiro` | `varchar(6)` | `NOT NULL`, `UNIQUE`, `DEFAULT generar_codigo_retiro()` |
| `estado` | `estado_pedido_enum` | `NOT NULL`, `DEFAULT 'pendiente'` |
| `fecha_registro` | `timestamptz` | `NOT NULL`, `DEFAULT now()` |
| `importe_total` | `numeric(10,2)` | `NOT NULL`, `DEFAULT 0`, `CHECK (importe_total >= 0)` |

| Constraint | Tipo | Qué hace | Qué evita |
|---|---|---|---|
| Clave primaria (`id_pedido`) | PK | Identifica al pedido. | Identificadores repetidos. |
| `codigo_cliente` → `cliente` | FK `RESTRICT` | Obliga a que el pedido pertenezca a un cliente existente. | Pedidos sin dueño y borrado de clientes con historial de pedidos. |
| `codigo_retiro` único | UNIQUE | Garantiza un código distinto por pedido (`RN-NEG-05`). | Colisiones de códigos y entregas cruzadas en mostrador. |
| `codigo_retiro` por defecto | DEFAULT | Genera el código automáticamente mediante `generar_codigo_retiro()`. | Dependencia del cliente o del backend para generar códigos. |
| `estado` por defecto `'pendiente'` | DEFAULT | Todo pedido nace en estado `pendiente` (`RN-NEG-06`). | Pedidos creados en estados intermedios o finales. |
| `fecha_registro` por defecto `now()` | DEFAULT | Registra la marca de tiempo exacta del servidor. | Fechas manipuladas desde el cliente. |
| `importe_total >= 0` | CHECK | Impide totales negativos (recalculado automáticamente por trigger). | Importes inválidos. |

---

### 2.6 `detalle_pedido`

Líneas de detalle de un pedido con su cantidad y el **precio congelado** al momento de la compra.

| Columna | Tipo de dato | Restricciones |
|---|---|---|
| `id_detalle` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `id_pedido` | `bigint` | `NOT NULL`, FK → `pedido(id_pedido)` `ON DELETE CASCADE` |
| `codigo_producto` | `bigint` | `NOT NULL`, FK → `producto(codigo_producto)` `ON DELETE RESTRICT` |
| `precio_unitario` | `numeric(10,2)` | `NOT NULL`, `CHECK (precio_unitario > 0)` |
| `cantidad` | `integer` | `NOT NULL`, `CHECK (cantidad > 0)` |

| Constraint | Tipo | Qué hace | Qué evita |
|---|---|---|---|
| Clave primaria (`id_detalle`) | PK | Identifica cada línea del pedido. | Identificadores repetidos. |
| `id_pedido` → `pedido` | FK `CASCADE` | Vincula la línea al pedido; si se elimina el pedido, se eliminan sus líneas. | Líneas huérfanas. |
| `codigo_producto` → `producto` | FK `RESTRICT` | Vincula la línea a un producto existente. | Líneas con productos inexistentes y eliminación física de productos con historial. |
| `precio_unitario > 0` | CHECK | Exige un precio positivo. | Líneas con precio cero o negativo. |
| `cantidad > 0` | CHECK | Exige cantidades enteras positivas (`RN-NEG-01`). | Cantidades de 0 o negativas. |
| `ux_detalle_pedido_producto` | UNIQUE (`id_pedido`, `codigo_producto`) | Impide duplicar el mismo producto en líneas separadas dentro de un pedido. | Fragmentación de ítems idénticos en un mismo pedido. |

---

### 2.7 `historial_estado_pedido`

Registro de auditoría de las transiciones de estado. Cada pedido contiene una fila por cada estado alcanzado (máximo cuatro).

| Columna | Tipo de dato | Restricciones |
|---|---|---|
| `id_historial` | `bigint` | PK, `GENERATED ALWAYS AS IDENTITY` |
| `id_pedido` | `bigint` | `NOT NULL`, FK → `pedido(id_pedido)` `ON DELETE CASCADE` |
| `id_trabajador` | `bigint` | Admite `NULL`, FK → `trabajador(id_trabajador)` `ON DELETE RESTRICT` |
| `estado` | `estado_pedido_enum` | `NOT NULL` |
| `fecha_cambio` | `timestamptz` | `NOT NULL`, `DEFAULT now()` |

| Constraint | Tipo | Qué hace | Qué evita |
|---|---|---|---|
| Clave primaria (`id_historial`) | PK | Identifica cada transición; su secuencia refleja el orden cronológico. | Identificadores repetidos. |
| `id_pedido` → `pedido` | FK `CASCADE` | Vincula el evento de auditoría a un pedido. | Registros sin pedido. |
| `id_trabajador` → `trabajador` | FK `RESTRICT` | Si se asigna un trabajador, valida su existencia e impide borrarlo si tiene historial. | Responsables inexistentes y pérdida de trazabilidad de auditoría. |
| `ck_historial_trabajador` | CHECK | El estado `pendiente` exige `id_trabajador IS NULL` (generado por el sistema); los demás estados exigen `id_trabajador IS NOT NULL`. | Cambios operativos anónimos o trabajadores atribuidos al estado inicial. |
| `ux_historial_pedido_estado` | UNIQUE (`id_pedido`, `estado`) | Garantiza que un pedido pase por cada estado una única vez. | Estados duplicados o retrocesos en el flujo. |

---

## 3. Vistas

Todas las vistas están configuradas con `security_invoker = true`, ejecutándose con los privilegios del usuario que realiza la consulta para respetar las políticas de seguridad de las tablas subyacentes.

| Vista | Qué muestra | Usada por el backend |
|---|---|---|
| `v_trabajadores` | Lista de trabajadores con su correo electrónico | Sí: `TrabajadorRepositorio` |
| `v_historial_pedidos` | Línea cronológica de cambios de estado por pedido | Sí: `HistorialRepositorio` |
| `v_detalle_pedidos` | Desglose de productos por pedido con datos del cliente | Sí: `HistorialRepositorio` |

### 3.1 `v_trabajadores`

Lista de personal operativo para el administrador. Une `trabajador` con `usuario` exponiendo el correo **sin incluir `contrasena_hash`**.

| Columna | Origen |
|---|---|
| `id_trabajador` | `trabajador.id_trabajador` |
| `nombre` | `trabajador.nombre` |
| `apellido` | `trabajador.apellido` |
| `cedula` | `trabajador.cedula` |
| `correo` | `usuario.correo` |

### 3.2 `v_historial_pedidos`

Transiciones de estado de los pedidos, ordenadas por pedido (descendente) y por identificador de historial. Emplea `LEFT JOIN` con `trabajador`, de modo que el estado inicial `pendiente` retorna `NULL` en los campos del trabajador.

| Columna | Origen |
|---|---|
| `id_pedido` | `historial_estado_pedido.id_pedido` |
| `id_historial` | `historial_estado_pedido.id_historial` |
| `estado` | `historial_estado_pedido.estado` |
| `fecha_cambio` | `historial_estado_pedido.fecha_cambio` |
| `trabajador_nombre` | `trabajador.nombre` (`NULL` en el estado inicial) |
| `trabajador_apellido` | `trabajador.apellido` (`NULL` en el estado inicial) |

### 3.3 `v_detalle_pedidos`

Detalle completo de un pedido con una fila por producto. Une `pedido`, `cliente`, `detalle_pedido` y `producto` mediante `INNER JOIN`, calculando el subtotal por línea.

| Columna | Origen |
|---|---|
| `id_pedido` | `pedido.id_pedido` |
| `codigo_retiro` | `pedido.codigo_retiro` |
| `fecha_registro` | `pedido.fecha_registro` |
| `estado_actual` | `pedido.estado` |
| `importe_total` | `pedido.importe_total` |
| `cliente_nombre` | `cliente.nombre` |
| `cliente_apellido` | `cliente.apellido` |
| `cliente_celular` | `cliente.celular` |
| `id_detalle` | `detalle_pedido.id_detalle` |
| `producto_nombre` | `producto.nombre` |
| `cantidad` | `detalle_pedido.cantidad` |
| `precio_unitario` | `detalle_pedido.precio_unitario` |
| `subtotal` | `cantidad * precio_unitario` (calculado) |

---

## 4. Funciones

### 4.1 `generar_codigo_retiro()`

| Propiedad | Valor |
|---|---|
| Retorna | `text` |
| Lenguaje | PL/pgSQL |
| Regla | `RN-NEG-05` |
| Uso | Valor por defecto (`DEFAULT`) de `pedido.codigo_retiro` |

**Funcionamiento:**

1. Genera una cadena aleatoria de 6 caracteres utilizando el alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 símbolos).
2. Verifica si el código ya existe en la tabla `pedido`; en caso afirmativo, repite la generación hasta obtener uno disponible.
3. Retorna el código único.

**Qué evita:**

- Errores de lectura visual en mostrador, al excluir los caracteres ambiguos `0`, `O`, `1` e `I`.
- Colisiones de códigos entre pedidos activos o históricos (espacio de $32^6 \approx 1\,073$ millones de combinaciones).

### 4.2 `crear_pedido(p_codigo_cliente bigint, p_items jsonb)`

| Propiedad | Valor |
|---|---|
| Retorna | Tabla con `o_id_pedido bigint`, `o_codigo_retiro text`, `o_importe_total numeric` |
| Lenguaje | PL/pgSQL |
| Requisito | `PN-01` · reglas `RN-NEG-01` a `RN-NEG-05` |
| Usada por el backend | Sí: `PedidoRepositorio.crearPedido` |

**Parámetros:**

| Parámetro | Descripción |
|---|---|
| `p_codigo_cliente` | Identificador `codigo_cliente` del cliente que realiza la orden |
| `p_items` | Arreglo JSON con los productos y cantidades solicitadas |

Formato esperado de `p_items`:

```json
[{"codigo_producto": 1, "cantidad": 2}, {"codigo_producto": 5, "cantidad": 1}]
```

**Funcionamiento:**

1. Valida que `p_items` sea un arreglo JSON no vacío; de lo contrario lanza `El pedido debe incluir al menos un producto (RN-NEG-01)`.
2. Inserta la cabecera en `pedido` con el `codigo_cliente` recibido.
3. Inserta una fila en `detalle_pedido` por cada elemento del arreglo (los triggers asignan el precio vigente y recalculan el total).
4. Retorna el identificador, el código de retiro y el importe total generado.

**Qué evita:**

- Pedidos inconsistentes o incompletos: toda la operación es atómica dentro de la llamada a la función.
- Manipulación de precios, totales, estados o códigos de retiro desde capas externas.

> El backend utiliza `o_id_pedido` para recuperar posteriormente la entidad completa del pedido recién creado.

### 4.3 Funciones de trigger

Las funciones `trg_*` son invocadas exclusivamente por sus triggers asociados (detallados en la [sección 5](#5-triggers)):

| Función | Trigger asociado |
|---|---|
| `trg_validar_tipo_usuario_perfil()` | `trg_cliente_tipo_usuario`, `trg_trabajador_tipo_usuario` |
| `trg_detalle_validar()` | `trg_detalle_validar` |
| `trg_detalle_recalcular_total()` | `trg_detalle_recalcular_total` |
| `trg_pedido_before_insert()` | `trg_pedido_before_insert` |
| `trg_pedido_after_insert()` | `trg_pedido_after_insert` |
| `trg_pedido_exigir_detalle()` | `ctg_pedido_exigir_detalle` |
| `trg_pedido_before_update()` | `trg_pedido_before_update` |
| `trg_historial_validar()` | `trg_historial_validar` |
| `trg_historial_sincronizar()` | `trg_historial_sincronizar` |
| `trg_historial_inmutable()` | `trg_historial_inmutable` |

---

## 5. Triggers

### 5.1 Resumen

Todos los triggers operan a nivel de fila (`FOR EACH ROW`).

| Trigger | Tabla | Momento y evento | Función | Regla |
|---|---|---|---|---|
| `trg_cliente_tipo_usuario` | `cliente` | `BEFORE INSERT OR UPDATE OF id_usuario` | `trg_validar_tipo_usuario_perfil` | Consistencia rol-perfil |
| `trg_trabajador_tipo_usuario` | `trabajador` | `BEFORE INSERT OR UPDATE OF id_usuario` | `trg_validar_tipo_usuario_perfil` | Consistencia rol-perfil |
| `trg_detalle_validar` | `detalle_pedido` | `BEFORE INSERT OR UPDATE` | `trg_detalle_validar` | `RN-NEG-02`, `03`, `04` |
| `trg_detalle_recalcular_total` | `detalle_pedido` | `AFTER INSERT OR UPDATE OR DELETE` | `trg_detalle_recalcular_total` | `RN-NEG-03` |
| `trg_pedido_before_insert` | `pedido` | `BEFORE INSERT` | `trg_pedido_before_insert` | `RN-NEG-06` |
| `trg_pedido_after_insert` | `pedido` | `AFTER INSERT` | `trg_pedido_after_insert` | `RN-NEG-06` |
| `ctg_pedido_exigir_detalle` | `pedido` | `AFTER INSERT` (diferido al `COMMIT`) | `trg_pedido_exigir_detalle` | `RN-NEG-01` |
| `trg_pedido_before_update` | `pedido` | `BEFORE UPDATE` | `trg_pedido_before_update` | Inmutabilidad de cabecera |
| `trg_historial_validar` | `historial_estado_pedido` | `BEFORE INSERT` | `trg_historial_validar` | `RN-NEG-06`, `07` |
| `trg_historial_sincronizar` | `historial_estado_pedido` | `AFTER INSERT` | `trg_historial_sincronizar` | `RN-NEG-06` |
| `trg_historial_inmutable` | `historial_estado_pedido` | `BEFORE UPDATE` | `trg_historial_inmutable` | Inmutabilidad de auditoría |

---

### 5.2 `trg_cliente_tipo_usuario` y `trg_trabajador_tipo_usuario`

**Función:** `trg_validar_tipo_usuario_perfil()`

- **Qué hacen:** Al insertar o actualizar `id_usuario` en un perfil, verifican que `usuario.tipo_usuario` coincida con la tabla destino (`cliente` o `trabajador`).
- **Qué evitan:** Perfiles cruzados (por ejemplo, asignar un perfil de cliente a una cuenta de trabajador o administrador).
- **Error:** `El usuario X es de tipo "Y" y no puede tener perfil de Z`.

### 5.3 `trg_detalle_validar`

**Función:** `trg_detalle_validar()` · **Reglas:** `RN-NEG-02`, `RN-NEG-03`, `RN-NEG-04`

- **Qué hace:**
  1. Permite insertar o actualizar líneas únicamente si el pedido se encuentra en estado `pendiente`.
  2. En `INSERT`: verifica que el producto exista y tenga `disponible = true`, y **copia el precio vigente del catálogo** a `precio_unitario`, sobrescribiendo cualquier valor externo.
  3. En `UPDATE`: impide modificar `precio_unitario`, `codigo_producto` o `id_pedido`.
- **Qué evita:**
  - Compra de productos inexistentes o no disponibles (`RN-NEG-02`).
  - Manipulación de precios por línea (`RN-NEG-03`).
  - Alteración retrospectiva de pedidos históricos cuando cambia el precio de un producto (`RN-NEG-04`).
- **Errores:** `Solo se puede modificar el detalle de un pedido en estado pendiente`, `El producto X no existe`, `El producto X no está disponible (RN-NEG-02)`, `El precio, el producto y el pedido de un detalle no se pueden modificar (RN-NEG-04)`.

### 5.4 `trg_detalle_recalcular_total`

**Función:** `trg_detalle_recalcular_total()` · **Regla:** `RN-NEG-03`

- **Qué hace:** Tras cualquier `INSERT`, `UPDATE` o `DELETE` en `detalle_pedido`, recalcula `pedido.importe_total` como $\sum (\text{precio\_unitario} \times \text{cantidad})$ del pedido.
- **Qué evita:** Descuadres entre las líneas de detalle y el total de la cabecera.

### 5.5 `trg_pedido_before_insert`

**Función:** `trg_pedido_before_insert()` · **Regla:** `RN-NEG-06`

- **Qué hace:** Antes de insertar un pedido, fuerza `estado = 'pendiente'` e `importe_total = 0`.
- **Qué evita:** Creación de pedidos en estados avanzados o con totales arbitrarios.

### 5.6 `trg_pedido_after_insert`

**Función:** `trg_pedido_after_insert()` · **Regla:** `RN-NEG-06`

- **Qué hace:** Inserta automáticamente el primer registro en `historial_estado_pedido` con estado `pendiente` e `id_trabajador = NULL`.
- **Qué evita:** Pedidos sin registro inicial en la línea de tiempo de auditoría.

### 5.7 `ctg_pedido_exigir_detalle`

**Función:** `trg_pedido_exigir_detalle()` · **Regla:** `RN-NEG-01`

*Constraint trigger* configurado como `DEFERRABLE INITIALLY DEFERRED`: se evalúa **al confirmar la transacción (`COMMIT`)**.

- **Qué hace:** Comprueba que el pedido recién creado tenga al menos un registro asociado en `detalle_pedido`.
- **Qué evita:** Persistencia de pedidos vacíos (sin productos), permitiendo insertar primero la cabecera y luego sus detalles dentro de la misma transacción.
- **Error:** `El pedido X debe incluir al menos un producto (RN-NEG-01)`.

### 5.8 `trg_pedido_before_update`

**Función:** `trg_pedido_before_update()`

- **Qué hace:**
  1. Bloquea cualquier cambio sobre `codigo_cliente`, `codigo_retiro` y `fecha_registro`.
  2. Permite actualizar `estado` únicamente si coincide con el último estado insertado en `historial_estado_pedido` para ese pedido.
- **Qué evita:** Alteración de metadatos inmutables del pedido y cambios directos de estado sin registro en el historial.
- **Errores:** `El cliente, el código de retiro y la fecha de registro no se pueden modificar`, `El estado del pedido solo cambia registrando una fila en historial_estado_pedido`.

### 5.9 `trg_historial_validar`

**Función:** `trg_historial_validar()` · **Reglas:** `RN-NEG-06`, `RN-NEG-07`

- **Qué hace:**
  1. Adquiere un bloqueo exclusivo a nivel de fila sobre el pedido (`SELECT ... FOR UPDATE`).
  2. Acepta `pendiente` solo como primer registro del pedido.
  3. Valida que toda transición posterior siga estrictamente la máquina de estados:

     | Estado actual | Estado nuevo permitido |
     |---|---|
     | `pendiente` | `en_preparacion` |
     | `en_preparacion` | `listo` |
     | `listo` | `entregado` |

- **Qué evita:** Saltos de estado, retrocesos, entregas sin preparación previa (`RN-NEG-07`) y condiciones de carrera cuando dos trabajadores intentan actualizar el mismo pedido simultáneamente.
- **Errores:** `El pedido X ya tiene un estado inicial`, `Transición no permitida: A -> B (RN-NEG-06 / RN-NEG-07)`.

### 5.10 `trg_historial_sincronizar`

**Función:** `trg_historial_sincronizar()` · **Regla:** `RN-NEG-06`

- **Qué hace:** Actualiza automáticamente `pedido.estado` tras cada inserción válida en `historial_estado_pedido`.
- **Qué evita:** Desincronización entre el estado actual del pedido y su historial de eventos.

### 5.11 `trg_historial_inmutable`

**Función:** `trg_historial_inmutable()`

- **Qué hace:** Rechaza cualquier sentencia `UPDATE` sobre `historial_estado_pedido`.
- **Qué evita:** Manipulación de registros históricos de auditoría (estados, fechas o responsables).

---

## 6. Índices

### 6.1 Índices explícitos

| Índice | Tabla | Columnas | Tipo | Propósito |
|---|---|---|---|---|
| `ux_usuario_correo` | `usuario` | `lower(correo)` | Único | Unicidad de correo insensible a mayúsculas y búsqueda rápida en el login |
| `ux_producto_nombre` | `producto` | `lower(nombre)` | Único | Unicidad de nombre de producto insensible a mayúsculas |
| `ix_pedido_cliente` | `pedido` | `codigo_cliente`, `fecha_registro DESC` | B-Tree | Consulta de historial de pedidos del cliente ordenado del más reciente al más antiguo |
| `ix_pedido_estado` | `pedido` | `estado`, `fecha_registro` | B-Tree | Cola operativa de pedidos filtrada por estado y ordenada cronológicamente |
| `ix_detalle_producto` | `detalle_pedido` | `codigo_producto` | B-Tree | Optimización de joins e integridad referencial hacia `producto` |
| `ix_historial_trabajador` | `historial_estado_pedido` | `id_trabajador` | B-Tree | Consultas de auditoría por trabajador e integridad referencial |
| `ix_producto_disponible` | `producto` | `disponible` (`WHERE disponible = true`) | Parcial | Lectura rápida del menú activo excluyendo productos retirados |

### 6.2 Índices implícitos

PostgreSQL mantiene índices únicos automáticos para todas las claves primarias y restricciones `UNIQUE`: `cliente.id_usuario`, `cliente.cedula`, `trabajador.id_usuario`, `trabajador.cedula`, `pedido.codigo_retiro`, `ux_detalle_pedido_producto` y `ux_historial_pedido_estado`.

---

## 7. Seguridad a nivel de fila (RLS)

Debido a que Supabase expone el esquema `public` mediante su API REST (PostgREST), se encuentra activado **Row Level Security (RLS)** en las 7 tablas del sistema:

`usuario`, `cliente`, `trabajador`, `producto`, `pedido`, `detalle_pedido`, `historial_estado_pedido`.

- **Configuración aplicada:** RLS habilitado sin políticas permisivas para los roles públicos de Supabase (`anon` y `authenticated`).
- **Qué evita:** Acceso directo de lectura o escritura desde clientes externos utilizando la clave pública (`anon key`) del proyecto, protegiendo datos sensibles como correos y hashes de contraseñas.
- **Acceso del backend:** La aplicación Spring Boot se conecta mediante un rol privilegiado (`postgres` / `service_role`) que omite RLS, centralizando toda la autorización en la capa de servicios y sesiones del servidor.

---

## 8. Extensiones y datos iniciales

- **Extensión `pgcrypto` (opcional para aprovisionamiento SQL):** Permite generar hashes BCrypt compatibilizados con `BCryptPasswordEncoder` de Spring Security (`$2a$`) mediante `crypt(..., gen_salt('bf'))` al aprovisionar usuarios directamente en SQL.
- **Aprovisionamiento inicial:** Para la puesta en marcha en un entorno limpio se requiere registrar al menos una cuenta base con `tipo_usuario = 'administrador'` en la tabla `usuario` (sin perfil asociado) y poblar el catálogo inicial en `producto`.

---

## 9. Flujos clave

### 9.1 Creación transaccional de un pedido

1. El backend valida los datos de entrada y ejecuta `crear_pedido(codigo_cliente, items)`.
2. `crear_pedido` verifica que exista al menos un producto en el arreglo JSON.
3. Se inserta la cabecera en `pedido`: `generar_codigo_retiro()` asigna el código único y `trg_pedido_before_insert` fija `estado = 'pendiente'` e `importe_total = 0`.
4. `trg_pedido_after_insert` registra el estado inicial `pendiente` en `historial_estado_pedido` con trabajador `NULL`.
5. Por cada ítem se inserta un registro en `detalle_pedido`: `trg_detalle_validar` verifica disponibilidad y congela el precio vigente, mientras `trg_detalle_recalcular_total` actualiza `pedido.importe_total`.
6. Al confirmar la transacción (`COMMIT`), `ctg_pedido_exigir_detalle` verifica que exista al menos una línea de detalle. Ante cualquier fallo, se revierte toda la operación.

### 9.2 Transición de estado de un pedido

1. El backend (`PedidoServicio`) verifica reglas previas (como el código de retiro en entregas) e inserta una nueva fila en `historial_estado_pedido` con el `id_trabajador` autenticado.
2. `ck_historial_trabajador` valida la presencia del trabajador.
3. `trg_historial_validar` bloquea el pedido (`FOR UPDATE`) y verifica que la transición respete el flujo secuencial.
4. `ux_historial_pedido_estado` garantiza que el estado no haya sido registrado previamente para ese pedido.
5. `trg_historial_sincronizar` actualiza `pedido.estado` y `trg_pedido_before_update` confirma la consistencia con el historial.

Si dos trabajadores intentan avanzar simultáneamente el mismo pedido, el bloqueo `FOR UPDATE` serializa las operaciones y rechaza la segunda con un error de transición no permitida (que el backend traduce a HTTP `409 Conflict`).

---

## 10. Trazabilidad con el backend

| Objeto de base de datos | Clase del backend que lo utiliza |
|---|---|
| `usuario`, `cliente`, `trabajador` (lectura de credenciales y perfil) | `AuthRepositorio` |
| `usuario`, `cliente` (registro y validación de unicidad) | `ClienteRepositorio` |
| `usuario`, `trabajador` (registro y validación de unicidad) | `TrabajadorRepositorio` |
| `v_trabajadores` | `TrabajadorRepositorio` |
| `producto` | `ProductoRepositorio`, `PedidoRepositorio` |
| `crear_pedido()` | `PedidoRepositorio` |
| `pedido`, `cliente`, `detalle_pedido` (consultas) | `PedidoRepositorio` |
| `historial_estado_pedido` (inserción de cambios de estado) | `PedidoRepositorio` |
| `v_historial_pedidos`, `v_detalle_pedidos` | `HistorialRepositorio` |
| `generar_codigo_retiro()` y triggers | Ejecución automática a nivel de motor |

Los tipos enumerados (`tipo_usuario_enum`, `tipo_producto_enum`, `estado_pedido_enum`) se mapean a texto mediante `::text` en consultas de lectura y mediante conversión explícita (`::estado_pedido_enum`, `::tipo_producto_enum`) en sentencias de escritura.