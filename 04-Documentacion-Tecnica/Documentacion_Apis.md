# Documentación de la API REST

**Gestión de pedidos de una cafetería universitaria**  
*Backend Spring Boot · Release 1.0*  

Este documento describe los endpoints expuestos por los controladores `auth`, `cliente`, `producto`, `pedido`, `trabajador` e `historial`: el método HTTP, los datos que reciben (con ejemplo) y los datos que devuelven (con ejemplo).

---

## 1. Información general

### 1.1 Convenciones
- **URL base (desarrollo):** `http://localhost:8080`. Todas las rutas de este documento son relativas a ella.
- **Formato:** JSON (`application/json`), salvo la creación de productos y el cambio de imagen, que usan `multipart/form-data`.
- **Autenticación:** Por sesión. Al iniciar sesión el servidor entrega la cookie `CAFETERIA_SESION` (`HttpOnly`, 8 horas). Todas las peticiones posteriores deben enviarla: en `fetch` con `credentials: 'include'` y en `axios` con `withCredentials: true`.
- **Identidad:** El `id_usuario`, el `codigo_cliente` y el `id_trabajador` se guardan solo en el servidor. El frontend nunca los envía: el servidor los toma de la sesión.
- **Dinero:** Los importes son números decimales con 2 decimales (por ejemplo `7.25`). Las fechas están en formato ISO 8601 (UTC).
- **Imágenes:** Los productos con imagen devuelven `imagenUrl` (por ejemplo `/imagenes/bebida/cafe-americano-1a2b3c4d.png`). Se obtienen con `GET` a esa ruta, anteponiendo la URL base.

### 1.2 Roles y permisos

| Rol | Descripción |
| :--- | :--- |
| **Público** | Sin sesión: puede iniciar sesión, registrarse como cliente. |
| **Cliente** | Registra pedidos y consulta los suyos. |
| **Trabajador** | Gestiona productos y menú, ve la cola de pedidos y avanza sus estados, verifica códigos y entrega. |
| **Administrador** | Crea y lista trabajadores, consulta el historial de pedidos y sus cambios de estado. Puede consultar productos y pedidos, pero no avanzar estados (no tiene `id_trabajador`). |

### 1.3 Códigos de respuesta

| Código | Significado |
| :--- | :--- |
| **200 OK** | Operación correcta con cuerpo de respuesta. |
| **201 Created** | Recurso creado. |
| **204 No Content** | Operación correcta sin cuerpo. |
| **400 Bad Request** | Datos inválidos (validaciones) o JSON mal formado. |
| **401 Unauthorized** | No hay sesión o las credenciales son incorrectas. |
| **403 Forbidden** | Hay sesión pero el rol no tiene permiso. |
| **404 Not Found** | El recurso no existe (o no pertenece al cliente). |
| **409 Conflict** | Dato duplicado o estado del pedido incompatible con la operación. |
| **413 Payload Too Large** | La imagen supera el tamaño máximo (2 MB). |

### 1.4 Formato de errores

Los errores de validación, conflicto y recurso inexistente usan un formato único:

#### 400 Bad Request (validación)
```json
{
  "mensaje": "Datos inválidos",
  "errores": {
    "cedula": "La cédula no es válida (dígito verificador incorrecto)",
    "celular": "El celular debe tener 10 dígitos y empezar con 09"
  }
}
```

#### 409 Conflict
```json
{
  "mensaje": "Ya existe una cuenta con este correo",
  "errores": { 
    "correo": "Ya existe una cuenta con este correo" 
  }
}
```

#### 404 Not Found
```json
{ 
  "mensaje": "Pedido no encontrado" 
}
```

Los errores 401 y 403 de los endpoints protegidos usan el formato estándar de Spring Boot, por ejemplo:
```json
{
  "timestamp": "2026-11-22T15:20:01.123+00:00",
  "status": 401,
  "error": "Unauthorized",
  "path": "/api/pedidos"
}
```
*Nota:* Solo `POST /api/auth/login` y `GET /api/auth/me` devuelven el 401 con el formato `{ "mensaje": "..." }`.

---

## 2. Resumen de endpoints

| Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Público | Iniciar sesión |
| `GET` | `/api/auth/me` | Con sesión | Restaurar sesión actual |
| `PUT` | `/api/auth/contrasena` | Con sesión | Cambiar contraseña |
| `POST` | `/api/auth/logout` | Con sesión | Cerrar sesión |
| `POST` | `/api/clientes/registro` | Público | Registrar un cliente |
| `GET` | `/api/productos/menu` | Trabajador, Cliente | Menú (solo disponibles) |
| `GET` | `/api/productos` | Trabajador | Catálogo completo con filtros |
| `GET` | `/api/productos/{codigo}` | Trabajador | Un producto |
| `POST` | `/api/productos` | Trabajador | Crear producto (con imagen) |
| `PATCH` | `/api/productos/{codigo}` | Trabajador | Cambiar nombre, precio, disponibilidad |
| `PUT` | `/api/productos/{codigo}/imagen` | Trabajador | Reemplazar imagen |
| `PUT` | `/api/productos/menu` | Trabajador | Armar el menú |
| `GET` | `/api/pedidos/configuracion` | Cliente, Trabajador | Reglas de pedido (cantidad máxima) |
| `POST` | `/api/pedidos` | Cliente | Confirmar un pedido |
| `GET` | `/api/pedidos/mis-pedidos` | Cliente | Pedidos del cliente |
| `GET` | `/api/pedidos/{id}` | Cliente, Trabajador | Un pedido |
| `GET` | `/api/pedidos` | Trabajador | Cola de pedidos por estado |
| `POST` | `/api/pedidos/{id}/iniciar-preparacion` | Trabajador | pendiente → en_preparacion |
| `POST` | `/api/pedidos/{id}/marcar-listo` | Trabajador | en_preparacion → listo |
| `POST` | `/api/pedidos/{id}/verificar-codigo` | Trabajador | Verificar código de retiro |
| `POST` | `/api/pedidos/{id}/entregar` | Trabajador | listo → entregado |
| `GET` | `/api/trabajadores` | Administrador | Listar trabajadores |
| `POST` | `/api/trabajadores` | Administrador | Crear trabajador |
| `GET` | `/api/historial-pedidos` | Administrador | Historial de cambios por pedido |
| `GET` | `/api/historial-pedidos/{idPedido}` | Administrador | Detalle de un pedido |

---

## 3. Autenticación (auth)

### `POST /api/auth/login`
Valida las credenciales e inicia la sesión. Si son correctas, el servidor responde con la cookie de sesión `CAFETERIA_SESION`. Por seguridad, cualquier fallo devuelve el mismo mensaje.

- **Acceso:** Público
- **Content-Type:** `application/json`

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `correo` | string | Sí | Correo registrado. No distingue mayúsculas de minúsculas. |
| `contrasena` | string | Sí | Contraseña en texto plano (se compara contra el hash BCrypt). |

#### Ejemplo de petición
```json
{
  "correo": "maria.perez@institucion.edu.ec",
  "contrasena": "Clave12345"
}
```

#### Respuesta 200 OK
`tipo` es `cliente`, `trabajador` o `administrador`. Para el administrador, `nombre` y `apellido` son `null`.
```json
{
  "tipo": "cliente",
  "nombre": "María José",
  "apellido": "Pérez",
  "correo": "maria.perez@institucion.edu.ec"
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `401` | Correo o contraseña incorrectos: `{ "mensaje": "Correo o contraseña incorrectos" }`. |
| `400` | El cuerpo no es un JSON válido. |

---

### `GET /api/auth/me`
Devuelve los datos de la sesión actual. Permite al frontend restaurar la sesión al recargar la página.

- **Acceso:** Cualquier usuario con sesión
- **Content-Type:** No aplica (sin cuerpo)

#### Respuesta 200 OK
```json
{
  "tipo": "trabajador",
  "nombre": "Ana",
  "apellido": "Loor",
  "correo": "ana.loor@institucion.edu.ec"
}
```

#### Respuesta 401 Unauthorized
```json
{ 
  "mensaje": "Sesión no iniciada" 
}
```

---

### `PUT /api/auth/contrasena`
Permite a un usuario autenticado cambiar su contraseña de acceso. Verifica que la contraseña actual coincida con la registrada en la base de datos y valida que la nueva contraseña cumpla con las políticas de seguridad del sistema.

- **Acceso:** Con sesión (Cualquier usuario con sesión)
- **Content-Type:** `application/json`

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `contrasenaActual` | string | Sí | Contraseña vigente en texto plano para verificar la identidad. |
| `contrasenaNueva` | string | Sí | Nueva contraseña (mínimo 8 caracteres, al menos una letra y un número, máximo 72 bytes). |

#### Ejemplo de petición
```json
{
  "contrasenaActual": "Clave12345",
  "contrasenaNueva": "NuevaClave2026"
}
```

#### Respuesta 204 No Content
Sin cuerpo.

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | Algún campo no cumple las reglas de validación o la contraseña actual es errónea: `{ "mensaje": "Datos inválidos", "errores": { "contrasenaActual": "La contraseña actual es incorrecta" } }`. |
| `401` | No hay sesión activa. |
| `400` | El cuerpo no es un JSON válido o faltan campos obligatorios. |

#### Ejemplo de error 400 al cambiar contraseña
```json
{
  "mensaje": "Datos inválidos",
  "errores": {
    "contrasenaActual": "La contraseña actual es incorrecta",
    "contrasenaNueva": "La contraseña debe tener al menos 8 caracteres y contener una letra y un número"
  }
}
```

---

### `POST /api/auth/logout`
Cierra la sesión e invalida la cookie en el servidor.

- **Acceso:** Con sesión
- **Content-Type:** No aplica (sin cuerpo)

#### Respuesta 204 No Content
Sin cuerpo.

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `401` | No hay sesión iniciada. |

---

## 4. Clientes (cliente)

### `POST /api/clientes/registro`
Registra un cliente: crea el usuario y su perfil en una sola transacción. No inicia sesión automáticamente; el frontend debe llevar al usuario al login.

- **Acceso:** Público
- **Content-Type:** `application/json`

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `nombre` | string | Sí | Solo letras (con tildes y ñ). Se admiten varias palabras separadas por espacio. De 2 a 50 caracteres. |
| `apellido` | string | Sí | Mismas reglas que el nombre. |
| `cedula` | string | Sí | Cédula ecuatoriana de 10 dígitos, con provincia, tercer dígito y dígito verificador válidos. |
| `celular` | string | Sí | 10 dígitos que empiezan con 09. |
| `correo` | string | Sí | Formato de correo válido. Se guarda en minúsculas. Debe ser único. Si se configuran dominios institucionales, debe pertenecer a uno. |
| `contrasena` | string | Sí | Mínimo 8 caracteres, al menos una letra y un número, máximo 72 bytes. |

#### Ejemplo de petición
```json
{
  "nombre": "María José",
  "apellido": "Pérez",
  "cedula": "1710034065",
  "celular": "0991234567",
  "correo": "maria.perez@institucion.edu.ec",
  "contrasena": "Clave12345"
}
```

#### Respuesta 201 Created
No se devuelven ids internos, cédula ni contraseña.
```json
{
  "nombre": "María José",
  "apellido": "Pérez",
  "correo": "maria.perez@institucion.edu.ec"
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | Algún campo no cumple las reglas. Se informan todos los errores juntos. |
| `409` | El correo o la cédula ya están registrados. |
| `400` | El cuerpo no es un JSON válido. |

---

## 5. Productos (producto)

Todos los endpoints de productos devuelven el mismo objeto Producto. No existe borrado: retirar un producto del menú equivale a ponerlo en `disponible: false`.

### Objeto Producto
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `codigoProducto` | number | Identificador del producto. |
| `nombre` | string | Nombre (único, sin distinguir mayúsculas). |
| `precio` | number | Precio vigente, con 2 decimales. |
| `tipoProducto` | string | `bebida` o `alimento`. |
| `disponible` | boolean | `true` si aparece en el menú y puede pedirse. |
| `imagenUrl` | string \| null | Ruta relativa de la imagen, o `null` si no tiene. |

---

### `GET /api/productos/menu`
Menú que ven los usuarios: solo productos disponibles, ordenados por tipo y nombre.

- **Acceso:** Trabajador, Cliente
- **Content-Type:** No aplica (sin cuerpo)

#### Respuesta 200 OK
```json
[
  {
    "codigoProducto": 1,
    "nombre": "Café americano",
    "precio": 1.00,
    "tipoProducto": "bebida",
    "disponible": true,
    "imagenUrl": "/imagenes/bebida/cafe-americano-1a2b3c4d.png"
  },
  {
    "codigoProducto": 3,
    "nombre": "Sánduche de pollo",
    "precio": 2.75,
    "tipoProducto": "alimento",
    "disponible": true,
    "imagenUrl": null
  }
]
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no tiene permiso (requiere rol Cliente o Trabajador). |

---

### `GET /api/productos`
Catálogo completo (disponibles y no disponibles) con filtros opcionales.

- **Acceso:** Trabajador
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de consulta (query)
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `tipo` | string | No | `bebida` o `alimento`. |
| `disponible` | boolean | No | `true` o `false`. |

#### Ejemplo de petición
```http
GET /api/productos?tipo=bebida&disponible=false
```

#### Respuesta 200 OK
Lista de objetos Producto.
```json
[
  {
    "codigoProducto": 2,
    "nombre": "Jugo de naranja",
    "precio": 1.50,
    "tipoProducto": "bebida",
    "disponible": false,
    "imagenUrl": null
  }
]
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | El valor de tipo no es `bebida` ni `alimento`. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador ni administrador. |

---

### `GET /api/productos/{codigo}`
Devuelve un producto por su código.

- **Acceso:** Trabajador
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `codigo` | number | Sí | Código del producto. |

#### Respuesta 200 OK
```json
{
  "codigoProducto": 1,
  "nombre": "Café americano",
  "precio": 1.00,
  "tipoProducto": "bebida",
  "disponible": true,
  "imagenUrl": "/imagenes/bebida/cafe-americano-1a2b3c4d.png"
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `404` | El producto no existe. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador ni administrador. |

---

### `POST /api/productos`
Crea un producto, inicialmente disponible. Si se adjunta imagen, se guarda en la carpeta de su tipo (`bebida/` o `alimento/`) con un nombre generado por el servidor.

- **Acceso:** Trabajador
- **Content-Type:** `multipart/form-data`

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `nombre` | string | Sí | De 2 a 60 caracteres: letras, números y signos comunes (`. , ' ( ) & % + / -`). Debe ser único. |
| `precio` | string (número) | Sí | Mayor a 0, máximo 2 decimales, hasta 999.99. Acepta punto o coma decimal. |
| `tipo` | string | Sí | `bebida` o `alimento`. No se puede cambiar después. |
| `imagen` | archivo | No | JPG, PNG o WEBP de hasta 2 MB. El formato se verifica por el contenido del archivo. |

#### Ejemplo de petición
```text
nombre: Té frío
precio: 1.25
tipo: bebida
imagen: (archivo te-frio.png)
```

#### Respuesta 201 Created
```json
{
  "codigoProducto": 5,
  "nombre": "Té frío",
  "precio": 1.25,
  "tipoProducto": "bebida",
  "disponible": true,
  "imagenUrl": "/imagenes/bebida/te-frio-9f8e7d6c.png"
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | Nombre, precio, tipo o imagen inválidos (se informan todos juntos). |
| `409` | Ya existe un producto con ese nombre. |
| `413` | La imagen supera el tamaño máximo. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador ni administrador. |

---

### `PATCH /api/productos/{codigo}`
Modifica nombre, precio y/o disponibilidad. Solo se cambian los campos enviados y debe venir al menos uno. Un cambio de precio no afecta a los pedidos ya registrados, que conservan su precio.

- **Acceso:** Trabajador
- **Content-Type:** `application/json`

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `codigo` | number | Sí | Código del producto. |

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `nombre` | string | No | Mismas reglas que al crear. |
| `precio` | number | No | Mayor a 0, máximo 2 decimales, hasta 999.99. |
| `disponible` | boolean | No | `true` para mostrarlo en el menú; `false` para retirarlo. |

#### Ejemplo de petición
```json
{
  "precio": 1.25,
  "disponible": false
}
```

#### Respuesta 200 OK
Producto actualizado.
```json
{
  "codigoProducto": 1,
  "nombre": "Café americano",
  "precio": 1.25,
  "tipoProducto": "bebida",
  "disponible": false,
  "imagenUrl": "/imagenes/bebida/cafe-americano-1a2b3c4d.png"
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | No se envió ningún campo, o algún valor es inválido. |
| `404` | El producto no existe. |
| `409` | Ya existe otro producto con ese nombre. |
| `400` | El cuerpo no es un JSON válido. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador ni administrador. |

---

### `PUT /api/productos/{codigo}/imagen`
Reemplaza la imagen del producto. La imagen anterior se elimina del servidor.

- **Acceso:** Trabajador
- **Content-Type:** `multipart/form-data`

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `codigo` | number | Sí | Código del producto. |

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `imagen` | archivo | Sí | JPG, PNG o WEBP de hasta 2 MB. |

#### Ejemplo de petición
```text
imagen: (archivo cafe-nuevo.jpg)
```

#### Respuesta 200 OK
Producto con la nueva `imagenUrl`.
```json
{
  "codigoProducto": 1,
  "nombre": "Café americano",
  "precio": 1.25,
  "tipoProducto": "bebida",
  "disponible": true,
  "imagenUrl": "/imagenes/bebida/cafe-americano-5c4b3a2d.jpg"
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | No se adjuntó imagen o el formato no es válido. |
| `404` | El producto no existe. |
| `413` | La imagen supera el tamaño máximo. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador ni administrador. |

---

### `PUT /api/productos/menu`
Arma el menú: quedan disponibles exactamente los productos indicados y no disponibles todos los demás. La lista no puede estar vacía.

- **Acceso:** Trabajador
- **Content-Type:** `application/json`

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `codigos` | number[] | Sí | Códigos de los productos que formarán el menú. Deben existir. |

#### Ejemplo de petición
```json
{
  "codigos": [1, 3, 4]
}
```

#### Respuesta 200 OK
Menú resultante (productos disponibles).
```json
[
  {
    "codigoProducto": 1,
    "nombre": "Café americano",
    "precio": 1.00,
    "tipoProducto": "bebida",
    "disponible": true,
    "imagenUrl": "/imagenes/bebida/cafe-americano-1a2b3c4d.png"
  },
  {
    "codigoProducto": 3,
    "nombre": "Sánduche de pollo",
    "precio": 2.75,
    "tipoProducto": "alimento",
    "disponible": true,
    "imagenUrl": null
  },
  {
    "codigoProducto": 4,
    "nombre": "Empanada de queso",
    "precio": 1.25,
    "tipoProducto": "alimento",
    "disponible": true,
    "imagenUrl": null
  }
]
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | Lista vacía o con códigos inexistentes (ej.: `"No existen los productos: [99]"`). |
| `400` | El cuerpo no es un JSON válido. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador ni administrador. |

---

## 6. Pedidos (pedido)

Flujo de estados: `pendiente` → `en_preparacion` → `listo` → `entregado`. No se puede saltar ni retroceder. El precio y el total siempre los calcula el servidor; el frontend solo envía código de producto y cantidad.

### Objeto Pedido
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idPedido` | number | Identificador del pedido. |
| `estado` | string | `pendiente`, `en_preparacion`, `listo` o `entregado`. |
| `fechaRegistro` | string (fecha ISO) | Momento de confirmación del pedido. |
| `importeTotal` | number | Suma de precio unitario × cantidad de todos los ítems. |
| `codigoRetiro` | string | Código de 6 caracteres. Solo lo recibe el cliente; el personal no lo ve. |
| `cliente` | objeto | `{ nombre, apellido }`. Solo lo reciben el personal y el administrador. |
| `items` | array | Cada ítem: `codigoProducto`, `nombre`, `precioUnitario`, `cantidad`, `subtotal`. |

---

### `GET /api/pedidos/configuracion`
Reglas de negocio que el frontend puede necesitar para limitar el selector de cantidad. `-1` significa que no hay límite.

- **Acceso:** Cliente, Trabajador
- **Content-Type:** No aplica (sin cuerpo)

#### Respuesta 200 OK
```json
{ 
  "cantidadMaximaPorProducto": -1 
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no tiene permiso (requiere rol Cliente o Trabajador). |

---

### `POST /api/pedidos`
Confirma un pedido (PN-01). El cliente se toma de la sesión. El servidor valida productos y cantidades, congela los precios, calcula el total y genera un código de retiro único. El pedido nace en estado pendiente.

- **Acceso:** Cliente
- **Content-Type:** `application/json`

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `items` | array | Sí | Entre 1 y 30 ítems. |
| `items[].codigoProducto` | number | Sí | Código de un producto existente y disponible. |
| `items[].cantidad` | number (entero) | Sí | Entero positivo. Si el mismo producto se repite, las cantidades se suman. Si `app.pedidos.cantidad-maxima-por-producto` es positivo, no puede superarlo (máximo técnico 9999). |

#### Ejemplo de petición
```json
{
  "items": [
    { "codigoProducto": 1, "cantidad": 2 },
    { "codigoProducto": 3, "cantidad": 1 },
    { "codigoProducto": 4, "cantidad": 2 }
  ]
}
```

#### Respuesta 201 Created
```json
{
  "idPedido": 12,
  "estado": "pendiente",
  "fechaRegistro": "2026-11-22T15:15:30.512341Z",
  "importeTotal": 7.25,
  "codigoRetiro": "K7M3QX",
  "items": [
    {
      "codigoProducto": 1,
      "nombre": "Café americano",
      "precioUnitario": 1.00,
      "cantidad": 2,
      "subtotal": 2.00
    },
    {
      "codigoProducto": 3,
      "nombre": "Sánduche de pollo",
      "precioUnitario": 2.75,
      "cantidad": 1,
      "subtotal": 2.75
    },
    {
      "codigoProducto": 4,
      "nombre": "Empanada de queso",
      "precioUnitario": 1.25,
      "cantidad": 2,
      "subtotal": 2.50
    }
  ]
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | Lista vacía, cantidad inválida, producto inexistente o no disponible, o cantidad sobre el máximo permitido. Los errores por producto usan la clave `producto.<codigo>`. |
| `409` | Un producto dejó de estar disponible justo mientras se confirmaba el pedido. |
| `400` | El cuerpo no es un JSON válido. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es cliente. |

#### Ejemplo de error 400 al crear un pedido
```json
{
  "mensaje": "Datos inválidos",
  "errores": {
    "producto.3": "El producto 'Sánduche de pollo' no está disponible (RN-NEG-02)",
    "producto.4": "Solo se permiten hasta 10 unidades de 'Empanada de queso' por pedido"
  }
}
```

---

### `GET /api/pedidos/mis-pedidos`
Pedidos del cliente autenticado, del más reciente al más antiguo.

- **Acceso:** Cliente
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de consulta (query)
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `limite` | number | No | Cantidad máxima de pedidos (por defecto 100, máximo 500). |

#### Respuesta 200 OK
Lista de objetos Pedido (versión cliente, con `codigoRetiro`).
```json
[
  {
    "idPedido": 12,
    "estado": "listo",
    "fechaRegistro": "2026-11-22T15:15:30.512341Z",
    "importeTotal": 7.25,
    "codigoRetiro": "K7M3QX",
    "items": [
      {
        "codigoProducto": 1,
        "nombre": "Café americano",
        "precioUnitario": 1.00,
        "cantidad": 2,
        "subtotal": 2.00
      },
      {
        "codigoProducto": 3,
        "nombre": "Sánduche de pollo",
        "precioUnitario": 2.75,
        "cantidad": 1,
        "subtotal": 2.75
      },
      {
        "codigoProducto": 4,
        "nombre": "Empanada de queso",
        "precioUnitario": 1.25,
        "cantidad": 2,
        "subtotal": 2.50
      }
    ]
  }
]
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es cliente. |

---

### `GET /api/pedidos/{id}`
Devuelve un pedido. El cliente recibe la versión con `codigoRetiro`; el personal recibe la versión con los datos del cliente y sin código.

- **Acceso:** Cliente, Trabajador
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | number | Sí | Identificador del pedido. |

#### Respuesta 200 OK (cliente)
```json
{
  "idPedido": 12,
  "estado": "pendiente",
  "fechaRegistro": "2026-11-22T15:15:30.512341Z",
  "importeTotal": 7.25,
  "codigoRetiro": "K7M3QX",
  "items": [
    {
      "codigoProducto": 1,
      "nombre": "Café americano",
      "precioUnitario": 1.00,
      "cantidad": 2,
      "subtotal": 2.00
    },
    {
      "codigoProducto": 3,
      "nombre": "Sánduche de pollo",
      "precioUnitario": 2.75,
      "cantidad": 1,
      "subtotal": 2.75
    },
    {
      "codigoProducto": 4,
      "nombre": "Empanada de queso",
      "precioUnitario": 1.25,
      "cantidad": 2,
      "subtotal": 2.50
    }
  ]
}
```

#### Respuesta 200 OK (trabajador)
```json
{
  "idPedido": 12,
  "estado": "pendiente",
  "fechaRegistro": "2026-11-22T15:15:30.512341Z",
  "importeTotal": 7.25,
  "cliente": { 
    "nombre": "María José", 
    "apellido": "Pérez" 
  },
  "items": [
    {
      "codigoProducto": 1,
      "nombre": "Café americano",
      "precioUnitario": 1.00,
      "cantidad": 2,
      "subtotal": 2.00
    },
    {
      "codigoProducto": 3,
      "nombre": "Sánduche de pollo",
      "precioUnitario": 2.75,
      "cantidad": 1,
      "subtotal": 2.75
    },
    {
      "codigoProducto": 4,
      "nombre": "Empanada de queso",
      "precioUnitario": 1.25,
      "cantidad": 2,
      "subtotal": 2.50
    }
  ]
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `404` | El pedido no existe, o no pertenece al cliente que lo consulta. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no tiene permiso. |

---

### `GET /api/pedidos`
Cola de pedidos. Sin estado devuelve los pedidos en curso (`pendiente`, `en_preparacion` y `listo`), los más antiguos primero. Con `estado=entregado` devuelve el registro histórico, los más recientes primero.

- **Acceso:** Trabajador
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de consulta (query)
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `estado` | string | No | `pendiente`, `en_preparacion`, `listo` o `entregado`. |
| `limite` | number | No | Cantidad máxima de pedidos (por defecto 100, máximo 500). |

#### Ejemplo de petición
```http
GET /api/pedidos?estado=pendiente
```

#### Respuesta 200 OK
Lista de objetos Pedido (versión personal, sin `codigoRetiro`).
```json
[
  {
    "idPedido": 12,
    "estado": "pendiente",
    "fechaRegistro": "2026-11-22T15:15:30.512341Z",
    "importeTotal": 7.25,
    "cliente": { 
      "nombre": "María José", 
      "apellido": "Pérez" 
    },
    "items": [
      {
        "codigoProducto": 1,
        "nombre": "Café americano",
        "precioUnitario": 1.00,
        "cantidad": 2,
        "subtotal": 2.00
      },
      {
        "codigoProducto": 3,
        "nombre": "Sánduche de pollo",
        "precioUnitario": 2.75,
        "cantidad": 1,
        "subtotal": 2.75
      },
      {
        "codigoProducto": 4,
        "nombre": "Empanada de queso",
        "precioUnitario": 1.25,
        "cantidad": 2,
        "subtotal": 2.50
      }
    ]
  }
]
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | El valor de estado no es válido. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador ni administrador. |

---

### `POST /api/pedidos/{id}/iniciar-preparacion`
Cambia el pedido de `pendiente` a `en_preparacion` y registra al trabajador en el historial.

- **Acceso:** Trabajador
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | number | Sí | Identificador del pedido. |

#### Respuesta 200 OK
Pedido actualizado (versión personal).
```json
{
  "idPedido": 12,
  "estado": "en_preparacion",
  "fechaRegistro": "2026-11-22T15:15:30.512341Z",
  "importeTotal": 7.25,
  "cliente": { 
    "nombre": "María José", 
    "apellido": "Pérez" 
  },
  "items": [
    {
      "codigoProducto": 1,
      "nombre": "Café americano",
      "precioUnitario": 1.00,
      "cantidad": 2,
      "subtotal": 2.00
    },
    {
      "codigoProducto": 3,
      "nombre": "Sánduche de pollo",
      "precioUnitario": 2.75,
      "cantidad": 1,
      "subtotal": 2.75
    },
    {
      "codigoProducto": 4,
      "nombre": "Empanada de queso",
      "precioUnitario": 1.25,
      "cantidad": 2,
      "subtotal": 2.50
    }
  ]
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `404` | El pedido no existe. |
| `409` | El pedido no está en estado `pendiente`, o fue modificado por otro trabajador al mismo tiempo. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador (el administrador no puede cambiar estados). |

---

### `POST /api/pedidos/{id}/marcar-listo`
Cambia el pedido de `en_preparacion` a `listo`.

- **Acceso:** Trabajador
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | number | Sí | Identificador del pedido. |

#### Respuesta 200 OK
Pedido actualizado (versión personal).
```json
{
  "idPedido": 12,
  "estado": "listo",
  "fechaRegistro": "2026-11-22T15:15:30.512341Z",
  "importeTotal": 7.25,
  "cliente": { 
    "nombre": "María José", 
    "apellido": "Pérez" 
  },
  "items": [
    {
      "codigoProducto": 1,
      "nombre": "Café americano",
      "precioUnitario": 1.00,
      "cantidad": 2,
      "subtotal": 2.00
    },
    {
      "codigoProducto": 3,
      "nombre": "Sánduche de pollo",
      "precioUnitario": 2.75,
      "cantidad": 1,
      "subtotal": 2.75
    },
    {
      "codigoProducto": 4,
      "nombre": "Empanada de queso",
      "precioUnitario": 1.25,
      "cantidad": 2,
      "subtotal": 2.50
    }
  ]
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `404` | El pedido no existe. |
| `409` | El pedido no está en estado `en_preparacion`, o fue modificado por otro trabajador al mismo tiempo. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador. |

---

### `POST /api/pedidos/{id}/verificar-codigo`
Comprueba si el código presentado por el cliente coincide con el del pedido. No modifica nada. Ignora mayúsculas/minúsculas y espacios alrededor; un código con formato incorrecto devuelve `false`.

- **Acceso:** Trabajador
- **Content-Type:** `application/json`

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | number | Sí | Identificador del pedido. |

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `codigoRetiro` | string | Sí | Código que muestra el cliente (6 caracteres). |

#### Ejemplo de petición
```json
{ 
  "codigoRetiro": "K7M3QX" 
}
```

#### Respuesta 200 OK
```json
{ 
  "valido": true 
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `404` | El pedido no existe. |
| `400` | El cuerpo no es un JSON válido. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador. |

---

### `POST /api/pedidos/{id}/entregar`
Entrega el pedido (RN-NEG-07): exige que esté en estado `listo`, verifica nuevamente el código y recién entonces lo pasa a `entregado`.

- **Acceso:** Trabajador
- **Content-Type:** `application/json`

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | number | Sí | Identificador del pedido. |

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `codigoRetiro` | string | Sí | Código que muestra el cliente. |

#### Ejemplo de petición
```json
{ 
  "codigoRetiro": "K7M3QX" 
}
```

#### Respuesta 200 OK
Pedido entregado (versión personal).
```json
{
  "idPedido": 12,
  "estado": "entregado",
  "fechaRegistro": "2026-11-22T15:15:30.512341Z",
  "importeTotal": 7.25,
  "cliente": { 
    "nombre": "María José", 
    "apellido": "Pérez" 
  },
  "items": [
    {
      "codigoProducto": 1,
      "nombre": "Café americano",
      "precioUnitario": 1.00,
      "cantidad": 2,
      "subtotal": 2.00
    },
    {
      "codigoProducto": 3,
      "nombre": "Sánduche de pollo",
      "precioUnitario": 2.75,
      "cantidad": 1,
      "subtotal": 2.75
    },
    {
      "codigoProducto": 4,
      "nombre": "Empanada de queso",
      "precioUnitario": 1.25,
      "cantidad": 2,
      "subtotal": 2.50
    }
  ]
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | El código no coincide: `{ "mensaje": "Datos inválidos", "errores": { "codigoRetiro": "El código de retiro no coincide" } }`. |
| `404` | El pedido no existe. |
| `409` | El pedido no está en estado `listo`, o ya fue modificado por otro trabajador. |
| `400` | El cuerpo no es un JSON válido. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es trabajador. |

---

## 7. Trabajadores (trabajador)

### `GET /api/trabajadores`
Lista los trabajadores de la cafetería, ordenados por apellido y nombre. No expone contraseñas.

- **Acceso:** Administrador
- **Content-Type:** No aplica (sin cuerpo)

#### Respuesta 200 OK
```json
[
  {
    "idTrabajador": 1,
    "nombre": "Ana",
    "apellido": "Loor",
    "cedula": "1713175071",
    "correo": "ana.loor@institucion.edu.ec"
  }
]
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es administrador. |

---

### `POST /api/trabajadores`
Crea la cuenta de un trabajador (usuario y perfil en una sola transacción). El administrador define la contraseña inicial.

- **Acceso:** Administrador
- **Content-Type:** `application/json`

#### Datos que recibe
| Campo | Tipo | Obligatorio | Descripción y reglas |
| :--- | :--- | :--- | :--- |
| `nombre` | string | Sí | Solo letras (con tildes y ñ), de 2 a 50 caracteres. |
| `apellido` | string | Sí | Mismas reglas que el nombre. |
| `cedula` | string | Sí | Cédula ecuatoriana válida de 10 dígitos. Única entre trabajadores. |
| `correo` | string | Sí | Correo válido y único. |
| `contrasena` | string | Sí | Mínimo 8 caracteres, al menos una letra y un número, máximo 72 bytes. |

#### Ejemplo de petición
```json
{
  "nombre": "Ana",
  "apellido": "Loor",
  "cedula": "1713175071",
  "correo": "ana.loor@institucion.edu.ec",
  "contrasena": "Clave12345"
}
```

#### Respuesta 201 Created
```json
{
  "idTrabajador": 1,
  "nombre": "Ana",
  "apellido": "Loor",
  "cedula": "1713175071",
  "correo": "ana.loor@institucion.edu.ec"
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `400` | Algún campo no cumple las reglas. |
| `409` | El correo o la cédula ya están registrados. |
| `400` | El cuerpo no es un JSON válido. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es administrador. |

---

## 8. Historial de pedidos (historial)

El administrador consulta primero el historial (lista de pedidos con sus cambios de estado) y luego selecciona un pedido para ver su detalle.

### `GET /api/historial-pedidos`
Historial agrupado por pedido, del más reciente al más antiguo. La paginación es por pedido: `total` cuenta pedidos (no filas de cambios) y la línea de tiempo de un pedido nunca se parte entre páginas. En el estado inicial (`pendiente`) los datos del trabajador son `null`.

- **Acceso:** Administrador
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de consulta (query)
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `idPedido` | number | No | Filtra por un pedido específico. |
| `pagina` | number | No | Número de página, desde 0 (por defecto 0). |
| `limite` | number | No | Pedidos por página (por defecto 50, máximo 200). |

#### Ejemplo de petición
```http
GET /api/historial-pedidos?pagina=0&limite=50
```

#### Respuesta 200 OK
```json
{
  "total": 25,
  "pagina": 0,
  "limite": 50,
  "pedidos": [
    {
      "idPedido": 12,
      "cambios": [
        {
          "idHistorial": 31,
          "estado": "pendiente",
          "fechaCambio": "2026-11-22T15:15:30.512341Z",
          "trabajadorNombre": null,
          "trabajadorApellido": null
        },
        {
          "idHistorial": 32,
          "estado": "en_preparacion",
          "fechaCambio": "2026-11-22T15:17:02.118220Z",
          "trabajadorNombre": "Ana",
          "trabajadorApellido": "Loor"
        }
      ]
    }
  ]
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es administrador. |

---

### `GET /api/historial-pedidos/{idPedido}`
Detalle del pedido seleccionado en el historial: datos del pedido, del cliente, productos con subtotal y cambios de estado. Incluye el código de retiro.

- **Acceso:** Administrador
- **Content-Type:** No aplica (sin cuerpo)

#### Parámetros de ruta
| Parámetro | Tipo | Obligatorio | Descripción |
| :--- | :--- | :--- | :--- |
| `idPedido` | number | Sí | Identificador del pedido. |

#### Respuesta 200 OK
```json
{
  "idPedido": 12,
  "codigoRetiro": "K7M3QX",
  "fechaRegistro": "2026-11-22T15:15:30.512341Z",
  "estadoActual": "entregado",
  "importeTotal": 7.25,
  "clienteNombre": "María José",
  "clienteApellido": "Pérez",
  "clienteCelular": "0991234567",
  "items": [
    {
      "idDetalle": 30,
      "productoNombre": "Café americano",
      "cantidad": 2,
      "precioUnitario": 1.00,
      "subtotal": 2.00
    },
    {
      "idDetalle": 31,
      "productoNombre": "Sánduche de pollo",
      "cantidad": 1,
      "precioUnitario": 2.75,
      "subtotal": 2.75
    },
    {
      "idDetalle": 32,
      "productoNombre": "Empanada de queso",
      "cantidad": 2,
      "precioUnitario": 1.25,
      "subtotal": 2.50
    }
  ],
  "cambios": [
    {
      "idHistorial": 31,
      "estado": "pendiente",
      "fechaCambio": "2026-11-22T15:15:30.512341Z",
      "trabajadorNombre": null,
      "trabajadorApellido": null
    },
    {
      "idHistorial": 32,
      "estado": "en_preparacion",
      "fechaCambio": "2026-11-22T15:17:02.118220Z",
      "trabajadorNombre": "Ana",
      "trabajadorApellido": "Loor"
    },
    {
      "idHistorial": 33,
      "estado": "listo",
      "fechaCambio": "2026-11-22T15:24:40.904117Z",
      "trabajadorNombre": "Ana",
      "trabajadorApellido": "Loor"
    },
    {
      "idHistorial": 34,
      "estado": "entregado",
      "fechaCambio": "2026-11-22T15:31:12.337560Z",
      "trabajadorNombre": "Ana",
      "trabajadorApellido": "Loor"
    }
  ]
}
```

#### Errores posibles
| Código | Cuándo ocurre |
| :--- | :--- |
| `404` | El pedido no existe. |
| `401` | No hay sesión iniciada. |
| `403` | El usuario autenticado no es administrador. |

---

## Anexo A. Reglas de validación

| Dato | Regla |
| :--- | :--- |
| **Nombre y apellido (personas)** | Solo letras (incluye tildes, ñ y ü); varias palabras separadas por un espacio; de 2 a 50 caracteres. Se eliminan espacios sobrantes. |
| **Cédula** | 10 dígitos; provincia 01–24 o 30; tercer dígito 0–5; dígito verificador correcto (módulo 10). Única por tipo de perfil. |
| **Celular** | 10 dígitos que empiezan con 09. |
| **Correo** | Formato válido (máx. 254 caracteres), único, se guarda en minúsculas. Opcionalmente restringido a dominios institucionales (`app.correo.dominios-institucionales`). |
| **Contraseña** | Mínimo 8 caracteres, al menos una letra y un número, máximo 72 bytes. Se guarda como hash BCrypt. |
| **Nombre de producto** | De 2 a 60 caracteres: letras, números y signos comunes; único sin distinguir mayúsculas. |
| **Precio** | Mayor a 0, máximo 2 decimales, hasta 999.99. |
| **Imagen** | JPG, PNG o WEBP, hasta 2 MB, verificada por su contenido. |
| **Pedido** | Entre 1 y 30 ítems; cantidades enteras positivas (máx. 9999); productos existentes y disponibles; límite configurable por producto con `app.pedidos.cantidad-maxima-por-producto` (negativo o 0 = sin límite). |
| **Código de retiro** | 6 caracteres del alfabeto `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (sin I, O, 0, 1). Único. |
