# `PedidoServicio`

**Paquete:** `g5.backend.cafeteria.pedido`  
**Estereotipo / Anotaciones:** `@Service`

> Servicio de lógica de negocio que orquesta la creación, consulta y transición de estados de pedidos.

## Dependencias (Constructor)
- `PedidoRepositorio repositorio`
- `ValidadorPedido validador`

## Métodos

### `cantidadMaximaPorProducto()`
```java
public int cantidadMaximaPorProducto()
```

Límite de unidades permitidas por producto (-1 = sin límite). El frontend puede consumirlo para limitar selectores de cantidad.

### `crear(long codigoCliente, List<ItemPedido> items)`
```java
public Pedido crear(long codigoCliente, List<ItemPedido> items)
```

Crea el pedido del cliente. El servidor recalcula y valida todo: precios y total provienen de la base de datos, nunca de los datos suministrados por el frontend.

* **Parámetros:**
  * `codigoCliente`: Identificador del cliente autenticado.
  * `items`: Líneas de productos solicitados.

### `obtenerCompleto(long idPedido)`
```java
public Pedido obtenerCompleto(long idPedido)
```

Recupera una orden de pedido completa incluyendo sus líneas de detalle.

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.

### `obtenerDeCliente(long idPedido, long codigoCliente)`
```java
public Pedido obtenerDeCliente(long idPedido, long codigoCliente)
```

Un cliente solo puede consultar sus propios pedidos; para los pedidos ajenos el sistema responde como si no existieran (mitigación de fuga de información).

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.
  * `codigoCliente`: Identificador del cliente en sesión.

### `listarDeCliente(long codigoCliente, Integer limite)`
```java
public List<Pedido> listarDeCliente(long codigoCliente, Integer limite)
```

Lista los pedidos de un cliente con sus respectivos detalles asociados.

* **Parámetros:**
  * `codigoCliente`: Clave primaria del cliente.
  * `limite`: Límite opcional de resultados.

### `listarParaPersonal(String estadoTexto, Integer limite)`
```java
public List<Pedido> listarParaPersonal(String estadoTexto, Integer limite)
```

Cola de atención para el personal de cafetería. Sin estado: retorna pedidos en curso (`PENDIENTE`, `EN_PREPARACION`, `LISTO`), priorizando los más antiguos primero. Con `estado = entregado`: retorna el histórico de pedidos ya despachados, priorizando los más recientes.

* **Parámetros:**
  * `estadoTexto`: Filtro textual de estado o null.
  * `limite`: Límite opcional de pedidos.

### `iniciarPreparacion(long idPedido, long idTrabajador)`
```java
public Pedido iniciarPreparacion(long idPedido, long idTrabajador)
```

Cambia el estado del pedido a 'en_preparacion' asociando al trabajador responsable.

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.
  * `idTrabajador`: Identificador del empleado asignado.

### `marcarListo(long idPedido, long idTrabajador)`
```java
public Pedido marcarListo(long idPedido, long idTrabajador)
```

Cambia el estado del pedido a 'listo'.

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.
  * `idTrabajador`: Identificador del empleado responsable.

### `verificarCodigo(long idPedido, String codigoIngresado)`
```java
public boolean verificarCodigo(long idPedido, String codigoIngresado)
```

Función 1: verifica que el código alfanumérico presentado coincida con el código de retiro registrado para el pedido. No altera el estado.

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.
  * `codigoIngresado`: Código de retiro provisto por el cliente en mostrador.

### `entregar(long idPedido, long idTrabajador, String codigoIngresado)`
```java
public Pedido entregar(long idPedido, long idTrabajador, String codigoIngresado)
```

Función 2: entrega el pedido. Exige que el pedido se encuentre en estado 'listo' (RN-NEG-07) y verifica el código de retiro antes de realizar la transición al estado 'entregado'.

* **Parámetros:**
  * `idPedido`: Clave primaria del pedido.
  * `idTrabajador`: Identificador del empleado que efectúa la entrega.
  * `codigoIngresado`: Código alfanumérico provisto por el cliente.
