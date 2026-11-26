# `ProductoControlador.CambioProductoRequest` *(record)*

**Paquete:** `g5.backend.cafeteria.producto`  
**Clase contenedora:** `ProductoControlador`

> DTO para la modificación parcial de atributos de un producto. Campos opcionales: solo se modifican los que vengan en el JSON.

## Componentes
| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `nombre` | `String` | Nuevo nombre comercial (opcional). |
| `precio` | `BigDecimal` | Nuevo precio unitario (opcional). |
| `disponible` | `Boolean` | Nuevo estado de disponibilidad (opcional). |
