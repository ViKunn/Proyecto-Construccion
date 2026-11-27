# Anexo A. Pruebas funcionales de la API

Complementan los casos de interfaz: verifican permisos, validaciones del servidor, concurrencia y la base de datos.
Script: [scripts/pruebas_funcionales.mjs](scripts/pruebas_funcionales.mjs).

- **Primera ejecución** (versión `aa1507f`): 56 casos, 55 aprobados, 1 fallido.
- **Nueva ejecución** (copia temporal con la solución de CP-35): 56 casos, 56 aprobados, 0 fallidos.

| ID | Caso | Requisito | Resultado esperado | Resultado obtenido (1.ª ejecución) | 1.ª | Nueva |
|---|---|---|---|---|---|---|
| CF-AUT-01 | Inicio de sesión de los tres tipos de usuario | HU-USU-02, RNF-02 | 200, tipo de usuario correcto y cookie de sesión HttpOnly | 200 cliente, HttpOnly / 200 trabajador, HttpOnly / 200 administrador, HttpOnly | Aprobado | Aprobado |
| CF-AUT-02 | Credenciales incorrectas no revelan si el correo existe | HU-USU-02 | 401 con el mismo mensaje en ambos casos | 401 «Correo o contraseña incorrectos» / 401 «Correo o contraseña incorrectos» | Aprobado | Aprobado |
| CF-AUT-03 | Operaciones protegidas sin sesión | HU-USU-02, RNF-02 | 401 en las cuatro | 401, 401, 401, 401 | Aprobado | Aprobado |
| CF-AUT-04 | Cada tipo de usuario solo accede a sus operaciones | HU-USU-02, HU-ADM-03 | 403 en las cinco | 403, 403, 403, 403, 403 | Aprobado | Aprobado |
| CF-AUT-05 | Cerrar sesión invalida el acceso | HU-USU-02 | 401 después de cerrar sesión | antes 200, logout 204, después 401 | Aprobado | Aprobado |
| CF-REG-01 | Registro de un cliente válido | HU-CLI-07 | 201 e inicio de sesión correcto | registro 201, inicio de sesión 200 | Aprobado | Aprobado |
| CF-REG-02 | Cédula con dígito verificador incorrecto | HU-CLI-07 | 400 con error en «cedula» y sin crear la cuenta | 400 «La cédula no es válida (dígito verificador incorrecto)» | Aprobado | Aprobado |
| CF-REG-03 | Correo fuera del dominio institucional | HU-CLI-07 | 400 con error en «correo» y sin crear la cuenta | 400 «Debe usar su correo institucional (@institucion.edu.ec)» | Aprobado | Aprobado |
| CF-REG-04 | Celular que no empieza con 09 | HU-CLI-07 | 400 con error en «celular» y sin crear la cuenta | 400 «El celular debe tener 10 dígitos y empezar con 09» | Aprobado | Aprobado |
| CF-REG-05 | Contraseña sin números | HU-CLI-07 | 400 con error en «contrasena» y sin crear la cuenta | 400 «La contraseña debe incluir al menos una letra y un número» | Aprobado | Aprobado |
| CF-REG-06 | Correo o cédula repetidos | HU-CLI-07 | 409 en ambos casos | 409 «Ya existe una cuenta con este correo» / 409 «Ya existe un cliente con esta cédula» | Aprobado | Aprobado |
| CF-REG-07 | La contraseña se guarda cifrada | RNF-02 | Hash BCrypt de costo 10, distinto de la contraseña | hash $2a$10$… de 60 caracteres | Aprobado | Aprobado |
| CF-PWD-01 | Cambio sin sesión | HU-USU-01 | 401 | 401 | Aprobado | Aprobado |
| CF-PWD-02 | Contraseña actual incorrecta | HU-USU-01 | 400 y la contraseña anterior sigue funcionando | 400 «La contraseña actual es incorrecta», inicio con la anterior 200 | Aprobado | Aprobado |
| CF-PWD-03 | Nueva contraseña igual a la actual o débil | HU-USU-01 | 400 en ambos casos | 400 «La nueva contraseña debe ser distinta de la actual» / 400 «La contraseña debe tener al menos 8 caracteres» | Aprobado | Aprobado |
| CF-PWD-04 | Cambio correcto | HU-USU-01 | 204; la anterior da 401 y la nueva 200 | cambio 204, anterior 401, nueva 200 | Aprobado | Aprobado |
| CF-MEN-01 | El menú muestra solo productos disponibles con su precio | HU-CLI-01, RN-NEG-02 | Los mismos productos disponibles; «Pastel de chocolate» (no disponible) no aparece | 11 productos, todos con precio; Pastel de chocolate no aparece | Aprobado | Aprobado |
| CF-PRO-01 | Registrar un producto | HU-PER-01, RU-06 | 201, disponible y visible en el menú | 201, disponible=true, en menú=true | Aprobado | Aprobado |
| CF-PRO-02 | Nombre de producto repetido | HU-PER-01 | 409 | 409 «Ya existe un producto con ese nombre» | Aprobado | Aprobado |
| CF-PRO-03 | Precios no válidos | HU-PER-01 | 400 en los cuatro y ningún producto creado | 400 «El precio debe ser mayor a 0» / 400 «El precio debe ser mayor a 0» / 400 «El precio admite como máximo 2 decimales» / 400 «El precio no puede superar 999.99» | Aprobado | Aprobado |
| CF-PRO-04 | Producto con imagen válida | HU-PER-01 | 201 y la imagen responde 200 | creación 201, imagen 200 | Aprobado | Aprobado |
| CF-PRO-05 | Imagen falsa o demasiado grande | HU-PER-01 | 400 para el falso y 413 para el grande | 400 «Formato de imagen no permitido (solo JPG, PNG o WEBP)» / 413 «La imagen supera el tamaño máximo permitido» | Aprobado | Aprobado |
| CF-PRO-06 | Actualizar nombre y precio | HU-PER-02 | 200 y el menú muestra los nuevos datos | 200; menú: Limonada natural a 1.8 | Aprobado | Aprobado |
| CF-PRO-07 | Cambiar la disponibilidad | HU-PER-03, RN-NEG-02 | Sale del menú y vuelve a aparecer | desactivar 200 (oculto=true), activar 200 (visible=true) | Aprobado | Aprobado |
| CF-PRO-08 | Armar el menú en lote | HU-PER-03 | Quedan disponibles solo los tres; las listas inválidas dan 400 sin cambios | 200, disponibles 1,2,3; vacía 400; inexistente 400; sin cambios=true | Aprobado | Aprobado |
| CF-PRO-09 | Un cliente no puede modificar el menú | HU-PER-02 | 403 en ambos | 403, 403 | Aprobado | Aprobado |
| CF-PED-01 | Confirmar un pedido válido | HU-CLI-02, HU-CLI-05, RN-NEG-03/05/06 | 201, estado pendiente, código de 6 caracteres y total = suma de precio × cantidad | 201, pendiente, código con formato válido=true, total 5.25 (esperado 5.25) | Aprobado | Aprobado |
| CF-PED-02 | Pedido sin productos | HU-CLI-04, RN-NEG-01 | 400 y ningún pedido creado | 400 «El pedido debe incluir al menos un producto (RN-NEG-01)»; pedidos creados: 0 | Aprobado | Aprobado |
| CF-PED-03 | Cantidad cero | HU-CLI-04, RN-NEG-01 | 400 y ningún pedido creado | 400 «La cantidad de cada producto debe ser un número entero positivo (RN-NEG-01)»; pedidos creados: 0 | Aprobado | Aprobado |
| CF-PED-04 | Cantidad negativa | HU-CLI-04, RN-NEG-01 | 400 y ningún pedido creado | 400 «La cantidad de cada producto debe ser un número entero positivo (RN-NEG-01)»; pedidos creados: 0 | Aprobado | Aprobado |
| CF-PED-05 | Cantidad decimal | HU-CLI-04, RN-NEG-01 | 400 y ningún pedido creado | 201; pedidos creados: 1 | Fallido | Aprobado |
| CF-PED-06 | Producto no disponible | HU-CLI-04, RN-NEG-02 | 400 y ningún pedido creado | 400 «El producto 'Pastel de chocolate' no está disponible (RN-NEG-02)»; pedidos creados: 0 | Aprobado | Aprobado |
| CF-PED-07 | Producto inexistente | HU-CLI-04 | 400 y ningún pedido creado | 400 «El producto 999999 no existe»; pedidos creados: 0 | Aprobado | Aprobado |
| CF-PED-08 | Más de 30 productos distintos | HU-CLI-04 | 400 y ningún pedido creado | 400 «El pedido no puede tener más de 30 productos distintos»; pedidos creados: 0 | Aprobado | Aprobado |
| CF-PED-09 | El servidor ignora precios enviados por el cliente | HU-CLI-03, RN-NEG-03 | El total se calcula con el precio del menú | 201, total 2.5 (precio del menú 1.25 × 2) | Aprobado | Aprobado |
| CF-PED-10 | Producto repetido en la selección | HU-CLI-02 | Una sola línea con 3 unidades | 201, 1 línea(s), cantidad 3 | Aprobado | Aprobado |
| CF-PED-11 | Códigos de retiro únicos | HU-CLI-05, RN-NEG-05 | Ningún código repetido y todos con el formato definido | 42 pedidos, 42 códigos distintos, 0 con formato inválido | Aprobado | Aprobado |
| CF-PED-12 | El precio de un pedido no cambia al cambiar el menú | RN-NEG-04 | El primero conserva precio y total; el nuevo usa el precio actualizado | anterior: 2.5 → 2.5; nuevo: 19 | Aprobado | Aprobado |
| CF-PED-13 | Consultar mis pedidos y su estado | HU-CLI-06, RU-05 | El dueño ve estado y código; el otro recibe 404 | 38 pedidos propios con estado y código; pedido ajeno 404 «Pedido no encontrado» | Aprobado | Aprobado |
| CF-PER-01 | Consultar pedidos pendientes sin ver los códigos | HU-PER-04, RN-NEG-07 | Solo pedidos pendientes y sin código de retiro en la respuesta | 41 pedidos, todos pendientes=true, con código: 0 | Aprobado | Aprobado |
| CF-PER-02 | No se pueden saltar estados | RN-NEG-06, RN-NEG-07 | 409 en ambos y sigue pendiente | 409 «El pedido está 'pendiente' y no puede pasar a 'listo'. Los pedidos solo avanzan en orden: pendiente → en_preparacion → listo → entregado» / 409 «Solo se puede entregar un pedido que está 'listo'. Estado actual: 'pendiente'»; estado pendiente | Aprobado | Aprobado |
| CF-PER-03 | Iniciar la preparación | HU-PER-05 | 200 y estado en_preparacion | 200, estado en_preparacion | Aprobado | Aprobado |
| CF-PER-04 | No se puede repetir ni retroceder un estado | RN-NEG-06 | 409 | 409 «El pedido está 'en_preparacion' y no puede pasar a 'en_preparacion'. Los pedidos solo avanzan en orden: pendiente → en_preparacion → listo → entregado» | Aprobado | Aprobado |
| CF-PER-05 | Marcar el pedido como listo | HU-PER-06 | 200 y estado listo | 200, estado listo | Aprobado | Aprobado |
| CF-PER-06 | Comprobar un código incorrecto | HU-PER-07, RN-NEG-07 | Respuesta válido=false y el estado no cambia | 200, válido=false, estado listo | Aprobado | Aprobado |
| CF-PER-07 | Entregar con código incorrecto, vacío o de otro pedido | HU-PER-07, RN-NEG-07 | 400 en los tres y sigue listo | 400 «El código de retiro no coincide» / 400 «El código de retiro no coincide» / 400 «El código de retiro no coincide»; estado listo | Aprobado | Aprobado |
| CF-PER-08 | Entregar con el código correcto | HU-PER-07, RN-NEG-07 | válido=true, 200 y estado entregado | válido=true, entrega 200, estado entregado | Aprobado | Aprobado |
| CF-PER-09 | No se puede entregar dos veces | RN-NEG-06/07 | 409 | 409 «Solo se puede entregar un pedido que está 'listo'. Estado actual: 'entregado'» | Aprobado | Aprobado |
| CF-PER-10 | Dos trabajadores cambian el mismo pedido a la vez | RNF-04 | En cada repetición: una respuesta 200, una 409 y un solo registro en el historial | 200+409: 20 veces | Aprobado | Aprobado |
| CF-ADM-01 | Crear una cuenta de trabajador | HU-ADM-01 | 201 y sesión de tipo trabajador | alta 201, sesión 200 trabajador | Aprobado | Aprobado |
| CF-ADM-02 | Datos de trabajador inválidos o repetidos | HU-ADM-01 | 400 y 409 | 400 «La cédula no es válida (dígito verificador incorrecto)» / 409 «Ya existe una cuenta con este correo» | Aprobado | Aprobado |
| CF-ADM-03 | Lista de trabajadores sin contraseñas | HU-ADM-02 | Incluye al nuevo trabajador y ningún campo de contraseña | 4 trabajadores; campos: idTrabajador, nombre, apellido, cedula, correo | Aprobado | Aprobado |
| CF-ADM-04 | Historial de cambios de estado | HU-ADM-03 | Cuatro cambios en orden, con el responsable en los tres hechos por personal | pendiente → en_preparacion → listo → entregado; con responsable: 3 | Aprobado | Aprobado |
| CF-BD-01 | La base rechaza saltar estados | RN-NEG-06, RNF-03 | La base devuelve error | Transición no permitida: pendiente -> entregado (RN-NEG-06 / RN-NEG-07) | Aprobado | Aprobado |
| CF-BD-02 | La base protege el precio registrado | RN-NEG-04, RNF-03 | La base devuelve error | El precio, el producto y el pedido de un detalle no se pueden modificar (RN-NEG-04) | Aprobado | Aprobado |
| CF-BD-03 | La base rechaza productos no disponibles | RN-NEG-02, RNF-03 | La base devuelve error | El producto 12 no está disponible (RN-NEG-02) | Aprobado | Aprobado |
