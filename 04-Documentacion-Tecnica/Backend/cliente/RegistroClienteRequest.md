# `RegistroClienteRequest` *(record)*

**Paquete:** `g5.backend.cafeteria.cliente`

> Estructura de transferencia de datos (DTO) para la solicitud de registro de nuevos clientes. Encapsula los campos de formulario enviados al endpoint `POST /api/clientes/registro`.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `nombre` | `String` | Nombre de pila del cliente. |
| `apellido` | `String` | Apellido del cliente. |
| `cedula` | `String` | Número de cédula de identidad ecuatoriana. |
| `celular` | `String` | Número de teléfono celular nacional. |
| `correo` | `String` | Dirección de correo electrónico institucional o personal. |
| `contrasena` | `String` | Contraseña elegida por el cliente en texto plano. |
