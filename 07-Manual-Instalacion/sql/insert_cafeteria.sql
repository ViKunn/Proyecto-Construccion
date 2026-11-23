-- =====================================================================
-- Cafetería universitaria - Datos de prueba
-- Ejecutar DESPUÉS de cafeteria_schema.sql, en una base vacía y UNA sola vez.
--
-- Credenciales de prueba (todas las cuentas usan la misma contraseña):
--     Contraseña:cafeteria123 
--     Administrador: admin@institucion.edu.ec
--     Trabajadores:  maria.lopez@institucion.edu.ec, jorge.salas@institucion.edu.ec,
--                    paula.ruiz@institucion.edu.ec
--     Clientes:      ana.torres@institucion.edu.ec, bruno.vera@institucion.edu.ec, ...
--
-- Para borrar todo y empezar de nuevo (descomentar):
-- truncate historial_estado_pedido, detalle_pedido, pedido, producto,
--          cliente, trabajador, usuario restart identity cascade;
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;


-- =====================================================================
-- 1. USUARIOS (1 administrador, 3 trabajadores, 6 clientes)
--    Hash BCrypt ($2a$, costo 10) compatible con BCryptPasswordEncoder de Spring.
-- =====================================================================
insert into usuario (correo, contrasena_hash, tipo_usuario)
select v.correo,
       extensions.crypt('cafeteria123', extensions.gen_salt('bf', 10)),
       v.tipo::tipo_usuario_enum
  from (values
    ('admin@institucion.edu.ec',        'administrador'),
    ('maria.lopez@institucion.edu.ec',  'trabajador'),
    ('jorge.salas@institucion.edu.ec',  'trabajador'),
    ('paula.ruiz@institucion.edu.ec',   'trabajador'),
    ('ana.torres@institucion.edu.ec',   'cliente'),
    ('bruno.vera@institucion.edu.ec',   'cliente'),
    ('carla.mena@institucion.edu.ec',   'cliente'),
    ('diego.paredes@institucion.edu.ec','cliente'),
    ('elena.cruz@institucion.edu.ec',   'cliente'),
    ('felipe.andrade@institucion.edu.ec','cliente')
  ) as v(correo, tipo);


-- =====================================================================
-- 2. TRABAJADORES
-- =====================================================================
insert into trabajador (id_usuario, nombre, apellido, cedula)
select u.id_usuario, v.nombre, v.apellido, v.cedula
  from (values
    ('maria.lopez@institucion.edu.ec', 'María', 'López', '1700000101'),
    ('jorge.salas@institucion.edu.ec', 'Jorge', 'Salas', '1700000102'),
    ('paula.ruiz@institucion.edu.ec',  'Paula', 'Ruiz',  '1700000103')
  ) as v(correo, nombre, apellido, cedula)
  join usuario u on u.correo = v.correo;


-- =====================================================================
-- 3. CLIENTES
-- =====================================================================
insert into cliente (id_usuario, nombre, apellido, cedula, celular)
select u.id_usuario, v.nombre, v.apellido, v.cedula, v.celular
  from (values
    ('ana.torres@institucion.edu.ec',     'Ana',    'Torres',   '1712345001', '0991000001'),
    ('bruno.vera@institucion.edu.ec',     'Bruno',  'Vera',     '1712345002', '0991000002'),
    ('carla.mena@institucion.edu.ec',     'Carla',  'Mena',     '1712345003', '0991000003'),
    ('diego.paredes@institucion.edu.ec',  'Diego',  'Paredes',  '1712345004', '0991000004'),
    ('elena.cruz@institucion.edu.ec',     'Elena',  'Cruz',     '1712345005', '0991000005'),
    ('felipe.andrade@institucion.edu.ec', 'Felipe', 'Andrade',  '1712345006', '0991000006')
  ) as v(correo, nombre, apellido, cedula, celular)
  join usuario u on u.correo = v.correo;


-- =====================================================================
-- 4. PRODUCTOS (menú). El último está no disponible para probar RN-NEG-02.
-- =====================================================================
insert into producto (nombre, precio, disponible, tipo_producto) values
  ('Café americano',        1.00, true,  'bebida'),
  ('Café con leche',        1.50, true,  'bebida'),
  ('Jugo de naranja',       1.75, true,  'bebida'),
  ('Batido de fresa',       2.25, true,  'bebida'),
  ('Agua mineral',          0.75, true,  'bebida'),
  ('Té helado',             1.25, true,  'bebida'),
  ('Sánduche de pollo',     2.75, true,  'alimento'),
  ('Sánduche mixto',        2.25, true,  'alimento'),
  ('Empanada de queso',     1.25, true,  'alimento'),
  ('Humita',                1.50, true,  'alimento'),
  ('Ensalada de frutas',    2.00, true,  'alimento'),
  ('Pastel de chocolate',   2.50, false, 'alimento');


-- =====================================================================
-- 5. PEDIDOS CON DISTINTOS ESTADOS
--    Se crean con crear_pedido() y el estado se avanza insertando filas en
--    historial_estado_pedido (una por sentencia), como lo hará el backend.
--    Estados finales: 3 entregados, 1 listo, 1 en preparación, 3 pendientes.
-- =====================================================================
do $$
declare
  r         record;
  v_cliente bigint;
  v_trab    bigint;
  v_id      bigint;
  v_items   jsonb;
  v_est     estado_pedido_enum;
begin
  for r in
    select * from (values
      -- cédula cliente, cédula trabajador, estado final, productos
      ('1712345001', '1700000101', 'entregado',
         '[{"p":"Café americano","c":2},{"p":"Sánduche de pollo","c":1}]'::jsonb),
      ('1712345002', '1700000102', 'entregado',
         '[{"p":"Jugo de naranja","c":1},{"p":"Empanada de queso","c":2}]'::jsonb),
      ('1712345001', '1700000103', 'entregado',
         '[{"p":"Café con leche","c":1}]'::jsonb),
      ('1712345003', '1700000101', 'listo',
         '[{"p":"Batido de fresa","c":1},{"p":"Sánduche mixto","c":1}]'::jsonb),
      ('1712345004', '1700000102', 'en_preparacion',
         '[{"p":"Té helado","c":2},{"p":"Humita","c":2},{"p":"Ensalada de frutas","c":1}]'::jsonb),
      ('1712345005', null,         'pendiente',
         '[{"p":"Agua mineral","c":1},{"p":"Empanada de queso","c":3}]'::jsonb),
      ('1712345006', null,         'pendiente',
         '[{"p":"Café americano","c":1},{"p":"Sánduche mixto","c":1}]'::jsonb),
      ('1712345002', null,         'pendiente',
         '[{"p":"Jugo de naranja","c":2}]'::jsonb)
    ) as t(ced_cliente, ced_trabajador, hasta, items)
  loop
    select c.codigo_cliente into v_cliente from cliente c where c.cedula = r.ced_cliente;
    select t.id_trabajador  into v_trab    from trabajador t where t.cedula = r.ced_trabajador;

    -- Traducir nombres de producto a códigos
    select jsonb_agg(jsonb_build_object('codigo_producto', pr.codigo_producto,
                                        'cantidad', (e ->> 'c')::int))
      into v_items
      from jsonb_array_elements(r.items) as e
      join producto pr on pr.nombre = e ->> 'p';

    select o_id_pedido into v_id from crear_pedido(v_cliente, v_items);

    -- Avanzar estados hasta el estado final indicado
    foreach v_est in array array['en_preparacion', 'listo', 'entregado']::estado_pedido_enum[]
    loop
      if v_est <= r.hasta::estado_pedido_enum then
        insert into historial_estado_pedido (id_pedido, id_trabajador, estado)
        values (v_id, v_trab, v_est);
      end if;
    end loop;
  end loop;
end;
$$;


-- =====================================================================
-- 6. CAMBIO DE PRECIO POSTERIOR (demuestra RN-NEG-04)
--    Los pedidos ya creados conservan el precio anterior en detalle_pedido.
-- =====================================================================
update producto set precio = 1.25 where nombre = 'Café americano';


-- =====================================================================
-- 7. CONSULTAS DE VERIFICACIÓN (opcional)
-- =====================================================================
-- Pedidos con cliente, estado y total:
-- select p.id_pedido, c.nombre || ' ' || c.apellido as cliente, p.codigo_retiro,
--        p.estado, p.importe_total
--   from pedido p join cliente c using (codigo_cliente) order by p.id_pedido;
--
-- Detalle con el precio congelado (el café americano sigue en 1.00 en los pedidos viejos):
-- select d.id_pedido, pr.nombre, d.cantidad, d.precio_unitario, pr.precio as precio_actual
--   from detalle_pedido d join producto pr using (codigo_producto) order by 1, 2;
--
-- Historial de un pedido:
-- select h.estado, h.fecha_cambio, t.nombre as trabajador
--   from historial_estado_pedido h left join trabajador t using (id_trabajador)
--  where h.id_pedido = 1 order by h.id_historial;
