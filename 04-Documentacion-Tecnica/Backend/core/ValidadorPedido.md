# `ValidadorPedido`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** `@Component`

> Componente de validación para las órdenes y pedidos de clientes. Aplica reglas de negocio sobre la estructura de ítems, cantidades permitidas, límites técnicos para evitar desbordamientos numéricos y validación del formato del código de retiro.

## Dependencias (Constructor)
- `int cantidadMaximaPorProducto` (`@Value("${app.pedidos.cantidad-maxima-por-producto:-1}")`)

## Constantes / Campos
| Tipo | Nombre | Descripción |
| :--- | :--- | :--- |
| `int` | `MAX_LINEAS` | Tope de líneas por pedido (30) como medida de protección contra abuso. |
| `int` | `MAX_CANTIDAD_TECNICA` | Tope técnico por producto (9999) para evitar desbordamiento en tipo `numeric(10,2)`. |

## Métodos

### `hayLimite()`
```java
public boolean hayLimite()
```

Indica si el sistema tiene configurado un límite operativo de unidades máximas por producto.

### `limiteCantidad()`
```java
public int limiteCantidad()
```

Retorna el límite vigente de unidades por producto; `-1` si no existe restricción (utilizado para exponerlo al frontend).

### `errorItems(List<ItemPedido> items)`
```java
public String errorItems(List<ItemPedido> items)
```

RN-NEG-01: Exige al menos un producto en la orden y que cada cantidad sea un entero estrictamente positivo.

* **Parámetros:**
  * `items`: Lista de ítems solicitados en el pedido.

### `errorCantidad(String nombreProducto, long cantidadTotal)`
```java
public String errorCantidad(String nombreProducto, long cantidadTotal)
```

Valida la cantidad TOTAL consolidada de un producto en el pedido respecto a límites técnicos y operativos configurados.

* **Parámetros:**
  * `nombreProducto`: Nombre descriptivo del producto.
  * `cantidadTotal`: Suma total de unidades de dicho producto.

### `normalizarCodigoRetiro(String codigo)`
```java
public String normalizarCodigoRetiro(String codigo)
```

Normaliza el código alfanumérico de retiro eliminando espacios en blanco y convirtiéndolo a mayúsculas.

* **Parámetros:**
  * `codigo`: Código recibido en mostrador.

### `formatoCodigoRetiroValido(String codigoNormalizado)`
```java
public boolean formatoCodigoRetiroValido(String codigoNormalizado)
```

Comprueba si el código normalizado cumple con la expresión regular y longitud del formato de retiro generado por la cafetería.

* **Parámetros:**
  * `codigoNormalizado`: Código previamente normalizado.
