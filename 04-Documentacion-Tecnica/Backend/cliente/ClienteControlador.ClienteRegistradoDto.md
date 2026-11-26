# `ClienteControlador.ClienteRegistradoDto` *(record)*

**Paquete:** `g5.backend.cafeteria.cliente`  
**Clase contenedora:** `ClienteControlador`

> Estructura de respuesta mínima devuelta tras el registro exitoso de un cliente. Omite datos sensibles como identificadores de base de datos, cédula o hashes de contraseñas.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `nombre` | `String` | Nombre del cliente registrado. |
| `apellido` | `String` | Apellidos del cliente registrado. |
| `correo` | `String` | Correo electrónico asignado a la cuenta. |
