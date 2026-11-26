# `ValidadorDatos`

**Paquete:** `g5.backend.cafeteria.core`  
**Estereotipo / Anotaciones:** `@Component`

> Componente centralizado para la normalización y validación de datos personales y credenciales. Proporciona reglas estrictas para nombres, correos institucionales, números telefónicos móviles, validación algorítmica de cédula ecuatoriana (módulo 10) y políticas de complejidad de contraseñas.

## Dependencias (Constructor)
- `String[] dominios` (`@Value("${app.correo.dominios-institucionales:}")`)

## Métodos

### `normalizarTexto(String s)`
```java
public String normalizarTexto(String s)
```

Trim + espacios múltiples colapsados + normalización Unicode NFC. Devuelve cadena vacía si la entrada es `null`.

* **Parámetros:**
  * `s`: Texto a normalizar.

### `normalizarCorreo(String s)`
```java
public String normalizarCorreo(String s)
```

Normaliza una dirección de correo electrónico eliminando espacios y convirtiéndola a minúsculas.

* **Parámetros:**
  * `s`: Correo a normalizar.

### `normalizarNumero(String s)`
```java
public String normalizarNumero(String s)
```

Elimina cualquier caracter que no sea un dígito numérico (0-9).

* **Parámetros:**
  * `s`: Cadena a procesar.

### `errorNombre(String valor, String etiqueta)`
```java
public String errorNombre(String valor, String etiqueta)
```

Valida nombres y apellidos: exige entre 2 y 50 caracteres y restringe el uso exclusivo a letras y acentos comunes.

* **Parámetros:**
  * `valor`: Cadena del nombre o apellido a evaluar.
  * `etiqueta`: Etiqueta contextual para el mensaje de error ("El nombre", "El apellido").

### `errorCorreo(String valor)`
```java
public String errorCorreo(String valor)
```

Valida el formato sintáctico del correo electrónico y verifica que pertenezca a los dominios institucionales autorizados si se encuentran configurados.

* **Parámetros:**
  * `valor`: Dirección de correo a evaluar.

### `errorCelular(String valor)`
```java
public String errorCelular(String valor)
```

Valida que el número telefónico móvil cumpla con el estándar de Ecuador: exactamente 10 dígitos numéricos comenzando por el prefijo '09'.

* **Parámetros:**
  * `valor`: Cadena con el número celular.

### `errorCedula(String valor)`
```java
public String errorCedula(String valor)
```

Valida un número de cédula de identidad ecuatoriana aplicando verificación de código de provincia (01 a 24, o 30) y el algoritmo oficial de módulo 10.

* **Parámetros:**
  * `valor`: Número de cédula a verificar.

### `errorContrasena(String valor)`
```java
public String errorContrasena(String valor)
```

Aplica la política de seguridad para contraseñas: mínimo 8 caracteres, al menos una letra y un dígito numérico, y un máximo estricto de 72 bytes por requerimiento de BCrypt.

* **Parámetros:**
  * `valor`: Contraseña en texto plano a evaluar.
