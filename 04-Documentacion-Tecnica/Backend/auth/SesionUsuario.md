# `SesionUsuario`

**Paquete:** `g5.backend.cafeteria.auth`  
**Estereotipo / Anotaciones:** `@Component`

> Componente transversal para la gestión del estado y ciclo de vida de la sesión HTTP. Centraliza el acceso seguro a la identidad del usuario autenticado desde los controladores, garantizando que los identificadores de cliente y personal nunca provengan de datos manipulables por el cliente. Además, previene ataques de fijación de sesión (session fixation) y aplica control de acceso por roles.

## Constantes / Campos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `String` | `ATRIBUTO` | Nombre del atributo de sesión utilizado para almacenar la identidad del usuario (`"usuario"`). |

## Métodos

### `iniciar(HttpServletRequest request, UsuarioAutenticado usuario)`
```java
public void iniciar(HttpServletRequest request, UsuarioAutenticado usuario)
```

Inicia una nueva sesión HTTP en el servidor para el usuario autenticado, invalidando la sesión previa para mitigar ataques de fijación de sesión (session fixation).

* **Parámetros:**
  * `request`: Solicitud HTTP entrante.
  * `usuario`: Identidad del usuario autenticado que se almacenará en la sesión.

### `cerrar(HttpServletRequest request)`
```java
public void cerrar(HttpServletRequest request)
```

Cierra e invalida la sesión HTTP asociada a la solicitud si existe.

* **Parámetros:**
  * `request`: Solicitud HTTP cuya sesión será invalidada.

### `actual(HttpServletRequest request)`
```java
public Optional<UsuarioAutenticado> actual(HttpServletRequest request)
```

Recupera la identidad del usuario autenticado a partir de la sesión actual vinculada a la solicitud HTTP.

* **Parámetros:**
  * `request`: Solicitud HTTP entrante.

### `exigir(HttpServletRequest request, TipoUsuario... permitidos)`
```java
public UsuarioAutenticado exigir(HttpServletRequest request, TipoUsuario... permitidos)
```

Exige la existencia de una sesión autenticada y verifica que el rol del usuario figure entre los permitidos.

* **Parámetros:**
  * `request`: Solicitud HTTP entrante.
  * `permitidos`: Lista de roles (`TipoUsuario`) con autorización para ejecutar la acción. Si no se especifica ninguno, cualquier usuario autenticado es admitido.

* **Excepciones:**
  * `ResponseStatusException`: con estado 401 (UNAUTHORIZED) si no hay sesión, o 403 (FORBIDDEN) si el tipo de usuario no está autorizado.
