# `Cliente` *(record)*

**Paquete:** `g5.backend.cafeteria.cliente`

> Entidad de dominio que modela el perfil de un cliente en la cafetería. Asocia las credenciales de usuario con la información personal, identificación y canales de contacto.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `codigoCliente` | `long` | Identificador único del cliente en la base de datos (clave primaria en tabla `cliente`). |
| `idUsuario` | `long` | Identificador foráneo de la cuenta base en la tabla `usuario`. |
| `nombre` | `String` | Nombre de pila del cliente. |
| `apellido` | `String` | Apellidos del cliente. |
| `cedula` | `String` | Número de cédula de identidad del cliente. |
| `celular` | `String` | Número de contacto telefónico del cliente. |
| `correo` | `String` | Dirección de correo electrónico asociada a la cuenta del cliente. |
