# `RegistroTrabajadorRequest` *(record)*

**Paquete:** `g5.backend.cafeteria.trabajador`

> Estructura de transferencia de datos (DTO) para la creación de cuentas de trabajadores. Encapsula la información enviada por el administrador en `POST /api/trabajadores`.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `nombre` | `String` | Nombre de pila del trabajador. |
| `apellido` | `String` | Apellido del trabajador. |
| `cedula` | `String` | Número de cédula de identidad ecuatoriana. |
| `correo` | `String` | Correo electrónico laboral o personal. |
| `contrasena` | `String` | Contraseña inicial establecida para el acceso del trabajador. |
