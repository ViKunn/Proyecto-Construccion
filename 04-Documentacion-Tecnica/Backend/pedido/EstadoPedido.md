# `EstadoPedido` *(enum)*

**Paquete:** `g5.backend.cafeteria.pedido`

> Enumeración que modela los estados por los que transita un pedido en la cafetería. Refleja los valores del tipo 'estado_pedido_enum' en PostgreSQL y establece el único flujo permitido: PENDIENTE → EN_PREPARACION → LISTO → ENTREGADO (RN-NEG-06).

## Valores
| Constante | Descripción |
| :--- | :--- |
| `PENDIENTE` | Estado inicial del pedido tras ser registrado por el cliente. |
| `EN_PREPARACION` | Pedido en proceso de elaboración por parte del personal operativo. |
| `LISTO` | Pedido preparado y disponible en mostrador para su retiro. |
| `ENTREGADO` | Pedido retirado por el cliente tras validar el código de retiro. |

## Constantes y Métodos

### Constantes
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `List<EstadoPedido>` | `ACTIVOS` | Lista inmutable con los estados de pedidos en curso (`PENDIENTE`, `EN_PREPARACION`, `LISTO`) requeridos por el personal por defecto. |

### `valorBd()`
```java
public String valorBd()
```

Devuelve el valor representativo del estado para su persistencia en PostgreSQL.

### `desdeTexto(String valor)`
```java
public static EstadoPedido desdeTexto(String valor)
```

Convierte una representación textual a su constante de enumeración correspondiente. Devuelve `null` si el texto no corresponde a un estado válido.

* **Parámetros:**
  * `valor`: Cadena con el nombre del estado a evaluar.
