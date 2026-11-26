# `TipoUsuario` *(enum)*

**Paquete:** `g5.backend.cafeteria.auth`

> Enumeración que define los roles y categorías de usuarios admitidos en el sistema. Modela directamente los valores del tipo enumerado 'tipo_usuario_enum' de la base de datos PostgreSQL.

## Valores
| Constante | Descripción |
| :--- | :--- |
| `CLIENTE` | Rol asignado a clientes de la cafetería. |
| `TRABAJADOR` | Rol asignado al personal operativo y de atención de la cafetería. |
| `ADMINISTRADOR` | Rol asignado a administradores del sistema con privilegios globales. |

## Constantes y Métodos

### `valorBd()`
```java
public String valorBd()
```

Devuelve la representación textual del rol utilizada para la persistencia en la base de datos PostgreSQL.

### `desdeBd(String valor)`
```java
public static TipoUsuario desdeBd(String valor)
```

Convierte una representación textual proveniente de la base de datos a la constante enum homóloga.

* **Parámetros:**
  * `valor`: Cadena con el nombre del rol registrado en la base de datos.

* **Excepciones:**
  * `IllegalArgumentException`: Si el valor no coincide con ningún rol admitido.
