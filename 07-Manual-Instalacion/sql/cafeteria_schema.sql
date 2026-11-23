-- =====================================================================
-- Cafetería universitaria - Esquema de base de datos
-- Motor: PostgreSQL (Supabase)  |  Release 1.0
-- Ejecutar completo en: Supabase > SQL Editor
--
-- ATENCIÓN: el script se puede ejecutar varias veces, pero la sección 0
-- ELIMINA todas las tablas y TODOS sus datos antes de volver a crearlas.
-- =====================================================================


-- =====================================================================
-- 0. LIMPIEZA: elimina los objetos creados por este script (re-ejecutable)
--    Orden: vistas -> tablas (con sus triggers) -> funciones -> tipos
-- =====================================================================
drop view if exists v_menu, v_trabajadores, v_historial_pedidos, v_detalle_pedidos;

drop table if exists
  historial_estado_pedido,
  detalle_pedido,
  pedido,
  cliente,
  trabajador,
  producto,
  usuario
cascade;

drop function if exists crear_pedido(bigint, jsonb);
drop function if exists trg_historial_inmutable();
drop function if exists trg_historial_sincronizar();
drop function if exists trg_historial_validar();
drop function if exists trg_pedido_before_update();
drop function if exists trg_pedido_exigir_detalle();
drop function if exists trg_pedido_after_insert();
drop function if exists trg_pedido_before_insert();
drop function if exists trg_detalle_recalcular_total();
drop function if exists trg_detalle_validar();
drop function if exists trg_validar_tipo_usuario_perfil();
drop function if exists generar_codigo_retiro();

drop type if exists estado_pedido_enum;
drop type if exists tipo_producto_enum;
drop type if exists tipo_usuario_enum;


-- =====================================================================
-- 1. TIPOS ENUMERADOS
--    El orden de los valores importa: pendiente < en_preparacion < listo < entregado
-- =====================================================================
create type tipo_producto_enum as enum ('bebida', 'alimento');
create type estado_pedido_enum as enum ('pendiente', 'en_preparacion', 'listo', 'entregado');
create type tipo_usuario_enum  as enum ('cliente', 'trabajador', 'administrador');


-- =====================================================================
-- 2. FUNCIÓN AUXILIAR: código de retiro (RN-NEG-05)
--    Código de 6 caracteres sin letras/números ambiguos (sin 0, O, 1, I).
-- =====================================================================
create function generar_codigo_retiro() returns text
language plpgsql as $$
declare
  v_alfabeto constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_codigo   text;
  i          int;
begin
  loop
    v_codigo := '';
    for i in 1..6 loop
      v_codigo := v_codigo || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from pedido p where p.codigo_retiro = v_codigo);
  end loop;
  return v_codigo;
end;
$$;


-- =====================================================================
-- 3. TABLAS
-- =====================================================================

-- ---------- USUARIO ----------
create table usuario (
  id_usuario      bigint generated always as identity primary key,
  correo          text not null,
  contrasena_hash text not null,                 -- NUNCA guardar la contraseña en texto plano
  tipo_usuario    tipo_usuario_enum not null,
  constraint ck_usuario_correo
    check (correo ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);
create unique index ux_usuario_correo on usuario (lower(correo));

-- ---------- CLIENTE ----------
create table cliente (
  codigo_cliente bigint generated always as identity primary key,
  id_usuario     bigint not null unique
                 references usuario (id_usuario) on delete restrict,
  nombre         text not null check (btrim(nombre) <> ''),
  apellido       text not null check (btrim(apellido) <> ''),
  cedula         varchar(10) not null unique check (cedula ~ '^[0-9]{10}$'),
  celular        varchar(10) not null check (celular ~ '^09[0-9]{8}$')
);

-- ---------- TRABAJADOR ----------
create table trabajador (
  id_trabajador bigint generated always as identity primary key,
  id_usuario    bigint not null unique
                references usuario (id_usuario) on delete restrict,
  nombre        text not null check (btrim(nombre) <> ''),
  apellido      text not null check (btrim(apellido) <> ''),
  cedula        varchar(10) not null unique check (cedula ~ '^[0-9]{10}$')
);

-- ---------- PRODUCTO ----------
create table producto (
  codigo_producto bigint generated always as identity primary key,
  nombre          text not null check (btrim(nombre) <> ''),
  precio          numeric(10,2) not null check (precio > 0),
  disponible      boolean not null default true,
  tipo_producto   tipo_producto_enum not null,
  ruta_imagen     text,
  constraint ck_producto_ruta_imagen check (
    ruta_imagen is null
    or ruta_imagen ~* '^[a-z0-9_-]+(/[a-z0-9_-]+)*\.(jpg|jpeg|png|webp)$'
  )
);
create unique index ux_producto_nombre on producto (lower(nombre));

-- ---------- PEDIDO ----------
create table pedido (
  id_pedido      bigint generated always as identity primary key,
  codigo_cliente bigint not null
                 references cliente (codigo_cliente) on delete restrict,
  codigo_retiro  varchar(6) not null unique default generar_codigo_retiro(),
  estado         estado_pedido_enum not null default 'pendiente',
  fecha_registro timestamptz not null default now(),
  importe_total  numeric(10,2) not null default 0 check (importe_total >= 0)
);

-- ---------- DETALLE_PEDIDO ----------
create table detalle_pedido (
  id_detalle      bigint generated always as identity primary key,
  id_pedido       bigint not null
                  references pedido (id_pedido) on delete cascade,
  codigo_producto bigint not null
                  references producto (codigo_producto) on delete restrict,
  precio_unitario numeric(10,2) not null check (precio_unitario > 0),
  cantidad        integer not null check (cantidad > 0),          -- RN-NEG-01
  constraint ux_detalle_pedido_producto unique (id_pedido, codigo_producto)
);

-- ---------- HISTORIAL_ESTADO_PEDIDO ----------
create table historial_estado_pedido (
  id_historial  bigint generated always as identity primary key,
  id_pedido     bigint not null
                references pedido (id_pedido) on delete cascade,
  id_trabajador bigint
                references trabajador (id_trabajador) on delete restrict,
  estado        estado_pedido_enum not null,
  fecha_cambio  timestamptz not null default now(),
  -- Estado inicial (pendiente) => sin trabajador. Cualquier cambio => con trabajador.
  constraint ck_historial_trabajador check (
    (estado = 'pendiente'  and id_trabajador is null) or
    (estado <> 'pendiente' and id_trabajador is not null)
  ),
  -- Un pedido pasa por cada estado una sola vez
  constraint ux_historial_pedido_estado unique (id_pedido, estado)
);


-- =====================================================================
-- 4. ÍNDICES (las PK, UNIQUE ya generan su índice)
-- =====================================================================
create index ix_pedido_cliente        on pedido (codigo_cliente, fecha_registro desc);
create index ix_pedido_estado         on pedido (estado, fecha_registro);   -- cola del personal
create index ix_detalle_producto      on detalle_pedido (codigo_producto);
create index ix_historial_trabajador  on historial_estado_pedido (id_trabajador);
create index ix_producto_disponible   on producto (disponible) where disponible;


-- =====================================================================
-- 5. REGLAS DE NEGOCIO EN LA BASE DE DATOS (TRIGGERS)
-- =====================================================================

-- 5.1 El perfil debe corresponder al tipo de usuario
--     cliente.id_usuario -> usuario.tipo_usuario = 'cliente'
--     trabajador.id_usuario -> usuario.tipo_usuario = 'trabajador'
create function trg_validar_tipo_usuario_perfil() returns trigger
language plpgsql as $$
declare
  v_tipo     text;
  v_esperado text;
begin
  v_esperado := case tg_table_name when 'cliente' then 'cliente' else 'trabajador' end;
  select u.tipo_usuario::text into v_tipo from usuario u where u.id_usuario = new.id_usuario;
  if v_tipo is distinct from v_esperado then
    raise exception 'El usuario % es de tipo "%" y no puede tener perfil de %',
      new.id_usuario, coalesce(v_tipo, 'inexistente'), v_esperado;
  end if;
  return new;
end;
$$;

create trigger trg_cliente_tipo_usuario
  before insert or update of id_usuario on cliente
  for each row execute function trg_validar_tipo_usuario_perfil();

create trigger trg_trabajador_tipo_usuario
  before insert or update of id_usuario on trabajador
  for each row execute function trg_validar_tipo_usuario_perfil();


-- 5.2 DetallePedido: precio congelado y producto disponible
--     RN-NEG-02: solo productos disponibles en nuevos pedidos
--     RN-NEG-03/04: el precio_unitario se copia del producto al insertar y ya no cambia
create function trg_detalle_validar() returns trigger
language plpgsql as $$
declare
  v_precio numeric(10,2);
  v_disp   boolean;
  v_estado estado_pedido_enum;
begin
  select p.estado into v_estado from pedido p where p.id_pedido = new.id_pedido;
  if v_estado is distinct from 'pendiente' then
    raise exception 'Solo se puede modificar el detalle de un pedido en estado pendiente';
  end if;

  if tg_op = 'INSERT' then
    select pr.precio, pr.disponible into v_precio, v_disp
      from producto pr where pr.codigo_producto = new.codigo_producto;
    if not found then
      raise exception 'El producto % no existe', new.codigo_producto;
    end if;
    if not v_disp then
      raise exception 'El producto % no está disponible (RN-NEG-02)', new.codigo_producto;
    end if;
    new.precio_unitario := v_precio;         -- se ignora cualquier precio enviado por el cliente
  else
    if new.precio_unitario  is distinct from old.precio_unitario
       or new.codigo_producto is distinct from old.codigo_producto
       or new.id_pedido       is distinct from old.id_pedido then
      raise exception 'El precio, el producto y el pedido de un detalle no se pueden modificar (RN-NEG-04)';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_detalle_validar
  before insert or update on detalle_pedido
  for each row execute function trg_detalle_validar();


-- 5.3 Pedido.importe_total = suma(precio_unitario * cantidad)  (RN-NEG-03)
create function trg_detalle_recalcular_total() returns trigger
language plpgsql as $$
declare
  v_id bigint;
begin
  v_id := case when tg_op = 'DELETE' then old.id_pedido else new.id_pedido end;
  update pedido p
     set importe_total = coalesce(
           (select sum(d.precio_unitario * d.cantidad)
              from detalle_pedido d where d.id_pedido = v_id), 0)
   where p.id_pedido = v_id;
  return null;
end;
$$;

create trigger trg_detalle_recalcular_total
  after insert or update or delete on detalle_pedido
  for each row execute function trg_detalle_recalcular_total();


-- 5.4 Pedido: estado inicial, historial inicial y exigencia de detalle (RN-NEG-01, RN-NEG-06)
create function trg_pedido_before_insert() returns trigger
language plpgsql as $$
begin
  new.estado        := 'pendiente';
  new.importe_total := 0;                    -- lo calcula trg_detalle_recalcular_total
  return new;
end;
$$;

create trigger trg_pedido_before_insert
  before insert on pedido
  for each row execute function trg_pedido_before_insert();

create function trg_pedido_after_insert() returns trigger
language plpgsql as $$
begin
  insert into historial_estado_pedido (id_pedido, id_trabajador, estado)
  values (new.id_pedido, null, 'pendiente');
  return null;
end;
$$;

create trigger trg_pedido_after_insert
  after insert on pedido
  for each row execute function trg_pedido_after_insert();

-- Se verifica al hacer COMMIT: el pedido y sus detalles se crean en la misma transacción
create function trg_pedido_exigir_detalle() returns trigger
language plpgsql as $$
begin
  if not exists (select 1 from detalle_pedido d where d.id_pedido = new.id_pedido) then
    raise exception 'El pedido % debe incluir al menos un producto (RN-NEG-01)', new.id_pedido;
  end if;
  return null;
end;
$$;

create constraint trigger ctg_pedido_exigir_detalle
  after insert on pedido
  deferrable initially deferred
  for each row execute function trg_pedido_exigir_detalle();


-- 5.5 Pedido: campos inmutables y estado solo cambia vía historial
create function trg_pedido_before_update() returns trigger
language plpgsql as $$
begin
  if new.codigo_cliente is distinct from old.codigo_cliente
     or new.codigo_retiro  is distinct from old.codigo_retiro
     or new.fecha_registro is distinct from old.fecha_registro then
    raise exception 'El cliente, el código de retiro y la fecha de registro no se pueden modificar';
  end if;

  -- El estado debe coincidir con la última fila registrada en el historial
  if new.estado is distinct from old.estado
     and new.estado is distinct from (select h.estado
                                        from historial_estado_pedido h
                                       where h.id_pedido = new.id_pedido
                                       order by h.id_historial desc
                                       limit 1) then
    raise exception 'El estado del pedido solo cambia registrando una fila en historial_estado_pedido';
  end if;
  return new;
end;
$$;

create trigger trg_pedido_before_update
  before update on pedido
  for each row execute function trg_pedido_before_update();


-- 5.6 Historial: valida la transición (RN-NEG-06) y sincroniza pedido.estado
--     Flujo: pendiente -> en_preparacion -> listo -> entregado (sin saltos ni retrocesos)
create function trg_historial_validar() returns trigger
language plpgsql as $$
declare
  v_actual estado_pedido_enum;
begin
  select p.estado into v_actual
    from pedido p where p.id_pedido = new.id_pedido for update;

  if new.estado = 'pendiente' then
    if exists (select 1 from historial_estado_pedido h where h.id_pedido = new.id_pedido) then
      raise exception 'El pedido % ya tiene un estado inicial', new.id_pedido;
    end if;
  elsif not (
       (v_actual = 'pendiente'      and new.estado = 'en_preparacion')
    or (v_actual = 'en_preparacion' and new.estado = 'listo')
    or (v_actual = 'listo'          and new.estado = 'entregado')
  ) then
    raise exception 'Transición no permitida: % -> % (RN-NEG-06 / RN-NEG-07)', v_actual, new.estado;
  end if;
  return new;
end;
$$;

create trigger trg_historial_validar
  before insert on historial_estado_pedido
  for each row execute function trg_historial_validar();

create function trg_historial_sincronizar() returns trigger
language plpgsql as $$
begin
  update pedido p
     set estado = new.estado
   where p.id_pedido = new.id_pedido
     and p.estado is distinct from new.estado;
  return null;
end;
$$;

create trigger trg_historial_sincronizar
  after insert on historial_estado_pedido
  for each row execute function trg_historial_sincronizar();

-- El historial es un registro de auditoría: no se edita ni se borra
create function trg_historial_inmutable() returns trigger
language plpgsql as $$
begin
  raise exception 'El historial de estados no se puede modificar ni eliminar';
end;
$$;

create trigger trg_historial_inmutable
  before update on historial_estado_pedido
  for each row execute function trg_historial_inmutable();


-- =====================================================================
-- 6. FUNCIÓN PARA CREAR UN PEDIDO COMPLETO (PN-01) EN UNA SOLA TRANSACCIÓN
--    p_items = '[{"codigo_producto": 1, "cantidad": 2}, {"codigo_producto": 5, "cantidad": 1}]'
-- =====================================================================
create function crear_pedido(p_codigo_cliente bigint, p_items jsonb)
returns table (o_id_pedido bigint, o_codigo_retiro text, o_importe_total numeric)
language plpgsql as $$
declare
  v_id bigint;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido debe incluir al menos un producto (RN-NEG-01)';
  end if;

  insert into pedido (codigo_cliente) values (p_codigo_cliente)
  returning pedido.id_pedido into v_id;

  insert into detalle_pedido (id_pedido, codigo_producto, cantidad)
  select v_id, (e ->> 'codigo_producto')::bigint, (e ->> 'cantidad')::integer
    from jsonb_array_elements(p_items) as e;

  return query
    select p.id_pedido, p.codigo_retiro::text, p.importe_total
      from pedido p where p.id_pedido = v_id;
end;
$$;


-- =====================================================================
-- 7. VISTAS
-- =====================================================================
-- Menú = productos disponibles (RU-01)
create view v_menu with (security_invoker = true) as
select codigo_producto, nombre, precio, tipo_producto, ruta_imagen
  from producto
 where disponible;

-- Lista de trabajadores para el administrador (sin exponer la contraseña)
create view v_trabajadores with (security_invoker = true) as
select t.id_trabajador, t.nombre, t.apellido, t.cedula,
       u.correo 
  from trabajador t
  join usuario u on u.id_usuario = t.id_usuario;

-- Cambios de estado de un pedido (una fila por cambio)
create view v_historial_pedidos with (security_invoker = true) as
select
  h.id_pedido,
  h.id_historial,
  h.estado             as estado,
  h.fecha_cambio,
  t.nombre             as trabajador_nombre,     -- null en el estado inicial "pendiente"
  t.apellido           as trabajador_apellido
from historial_estado_pedido h
left join trabajador t on t.id_trabajador = h.id_trabajador
order by h.id_pedido desc, h.id_historial;

-- Detalle de un pedido (una fila por producto) con los datos del pedido y del cliente
create view v_detalle_pedidos with (security_invoker = true) as
select
  -- Pedido
  p.id_pedido,
  p.codigo_retiro,
  p.fecha_registro,
  p.estado             as estado_actual,
  p.importe_total,
  -- Cliente
  c.nombre             as cliente_nombre,
  c.apellido           as cliente_apellido,
  c.celular            as cliente_celular,
  -- Productos del pedido
  d.id_detalle,
  pr.nombre            as producto_nombre,
  d.cantidad,
  d.precio_unitario,
  d.cantidad * d.precio_unitario as subtotal
from pedido p
join cliente c         on c.codigo_cliente   = p.codigo_cliente
join detalle_pedido d  on d.id_pedido        = p.id_pedido
join producto pr       on pr.codigo_producto = d.codigo_producto
order by p.id_pedido desc, d.id_detalle;


-- =====================================================================
-- 8. SEGURIDAD (Supabase)
--    Supabase expone el esquema public por API REST. Con RLS activado y SIN
--    políticas, anon/authenticated no pueden leer ni escribir nada. El backend
--    se conecta con el rol postgres / service_role, que ignora RLS.
-- =====================================================================
alter table usuario                 enable row level security;
alter table cliente                 enable row level security;
alter table trabajador              enable row level security;
alter table producto                enable row level security;
alter table pedido                  enable row level security;
alter table detalle_pedido          enable row level security;
alter table historial_estado_pedido enable row level security;


-- =====================================================================
-- 9. DATOS INICIALES (opcional: quitar los comentarios y cambiar valores)
-- =====================================================================
-- create extension if not exists pgcrypto with schema extensions;
--
-- insert into usuario (correo, contrasena_hash, tipo_usuario)
-- values ('admin@institucion.edu.ec',
--         extensions.crypt('CambiarEstaClave_123', extensions.gen_salt('bf')),
--         'administrador');
--
-- insert into producto (nombre, precio, disponible, tipo_producto) values
--   ('Café americano',      1.00, true, 'bebida'),
--   ('Jugo de naranja',     1.50, true, 'bebida'),
--   ('Sánduche de pollo',   2.75, true, 'alimento'),
--   ('Empanada de queso',   1.25, true, 'alimento');
