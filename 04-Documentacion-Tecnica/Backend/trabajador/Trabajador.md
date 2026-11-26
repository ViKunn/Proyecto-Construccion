# `Trabajador` *(record)*

**Paquete:** `g5.backend.cafeteria.trabajador`

> Entidad de dominio que modela el perfil de un empleado de la cafetería. Proporciona acceso a la información personal e identificador operativo sin exponer datos sensibles de autenticación.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `idTrabajador` | `long` | Identificador primario en la tabla `trabajador`. |
| `nombre` | `String` | Nombre de pila del empleado. |
| `apellido` | `String` | Apellidos del empleado. |
| `cedula` | `String` | Número de cédula de identidad. |
| `correo` | `String` | Correo electrónico asociado a su cuenta de acceso. |
