// Casos de prueba funcionales contra la API REST (Release 1.0).
//
// ATENCIÓN: borra y vuelve a cargar la base de datos del contenedor local de pruebas.
// Uso: node pruebas_funcionales.mjs <carpeta con los .sql> [carpeta de salida]
// Requiere: Node 20+, el contenedor Docker "cafeteria-pruebas" (postgres:17) y la
// aplicación ejecutándose en http://127.0.0.1:8090 conectada a ese contenedor.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = "http://127.0.0.1:8090";
const CONTENEDOR = "cafeteria-pruebas";
const [, , DIR_SQL, DIR_SALIDA = "."] = process.argv;
if (!DIR_SQL) throw new Error("Falta la carpeta con los scripts SQL");

// Contraseña de las cuentas de prueba (insert_cafeteria.sql) y la que usan las cuentas nuevas
const CLAVE = "cafeteria123";
const CLAVE_NUEVA = "Prueba2026x";
const ADMIN = "admin@institucion.edu.ec";
const TRAB1 = "maria.lopez@institucion.edu.ec";
const TRAB2 = "jorge.salas@institucion.edu.ec";
const CLI1 = "ana.torres@institucion.edu.ec";
const CLI2 = "bruno.vera@institucion.edu.ec";

// ---------------------------------------------------------------- utilidades
const psqlArgs = ["exec", "-i", CONTENEDOR, "psql", "-U", "postgres", "-d", "cafeteria", "-At", "-v", "ON_ERROR_STOP=1"];
function sql(consulta) {
  return execFileSync("docker", psqlArgs, { input: consulta, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function sqlError(consulta) {
  try {
    sql(consulta);
    return null;
  } catch (e) {
    return String(e.stderr).split("\n").find((l) => l.includes("ERROR"))?.replace(/^.*ERROR:\s*/, "") ?? "error";
  }
}

function cliente() {
  let cookie = "";
  let ultimaCabecera = "";
  const pedir = async (metodo, ruta, cuerpo) => {
    const cabeceras = {};
    if (cookie) cabeceras.Cookie = cookie;
    let body;
    if (cuerpo instanceof FormData) body = cuerpo;
    else if (cuerpo !== undefined) {
      cabeceras["Content-Type"] = "application/json";
      body = typeof cuerpo === "string" ? cuerpo : JSON.stringify(cuerpo);
    }
    const r = await fetch(BASE + ruta, { method: metodo, headers: cabeceras, body });
    for (const c of r.headers.getSetCookie()) {
      ultimaCabecera = c;
      cookie = c.split(";")[0];
    }
    const texto = await r.text();
    let json = null;
    try { json = JSON.parse(texto); } catch { /* respuesta sin JSON */ }
    return { estado: r.status, json };
  };
  pedir.cabeceraCookie = () => ultimaCabecera;
  return pedir;
}
async function sesion(correo, clave = CLAVE) {
  const c = cliente();
  const r = await c("POST", "/api/auth/login", { correo, contrasena: clave });
  if (r.estado !== 200) throw new Error(`No se pudo iniciar sesión (${r.estado})`);
  return c;
}

const detalle = (r) => {
  const e = r.json?.errores ? Object.values(r.json.errores).join("; ") : r.json?.mensaje;
  return `${r.estado}${e ? ` «${e}»` : ""}`;
};

/** Cédula ecuatoriana válida (provincia 17, dígito verificador módulo 10). */
function cedula(secuencia) {
  const base = `170${String(secuencia).padStart(6, "0")}`;
  const suma = [...base].reduce((s, d, i) => {
    let v = Number(d) * (i % 2 === 0 ? 2 : 1);
    if (v > 9) v -= 9;
    return s + v;
  }, 0);
  return base + ((10 - (suma % 10)) % 10);
}

const codigoDe = (nombre) => Number(sql(`select codigo_producto from producto where nombre = '${nombre}'`));
const contar = (tabla) => Number(sql(`select count(*) from ${tabla}`));
const estadoDe = (id) => sql(`select estado from pedido where id_pedido = ${Number(id)}`);

async function crearPedido(c, items) {
  return c("POST", "/api/pedidos", { items });
}

// ---------------------------------------------------------------- casos
const casos = [];
const caso = (id, area, titulo, refs, pasos, esperado, ejecutar) =>
  casos.push({ id, area, titulo, refs, pasos, esperado, ejecutar });
const res = (ok, obtenido) => ({ ok: Boolean(ok), obtenido });

// ----- Autenticación y permisos
caso("CF-AUT-01", "Autenticación", "Inicio de sesión de los tres tipos de usuario", "HU-USU-02, RNF-02",
  "POST /api/auth/login con una cuenta de cada tipo",
  "200, tipo de usuario correcto y cookie de sesión HttpOnly",
  async () => {
    const salidas = [];
    let ok = true;
    for (const [correo, tipo] of [[CLI1, "cliente"], [TRAB1, "trabajador"], [ADMIN, "administrador"]]) {
      const c = cliente();
      const r = await c("POST", "/api/auth/login", { correo, contrasena: CLAVE });
      const t = String(r.json?.tipo).toLowerCase();
      const http = /httponly/i.test(c.cabeceraCookie()) && c.cabeceraCookie().startsWith("CAFETERIA_SESION=");
      ok &&= r.estado === 200 && t === tipo && http;
      salidas.push(`${r.estado} ${t}${http ? ", HttpOnly" : ", sin HttpOnly"}`);
    }
    return res(ok, salidas.join(" / "));
  });

caso("CF-AUT-02", "Autenticación", "Credenciales incorrectas no revelan si el correo existe", "HU-USU-02",
  "Iniciar sesión con contraseña errónea y con un correo inexistente",
  "401 con el mismo mensaje en ambos casos",
  async () => {
    const a = await cliente()("POST", "/api/auth/login", { correo: CLI1, contrasena: "incorrecta1" });
    const b = await cliente()("POST", "/api/auth/login", { correo: "nadie@institucion.edu.ec", contrasena: "incorrecta1" });
    return res(a.estado === 401 && b.estado === 401 && a.json?.mensaje === b.json?.mensaje, `${detalle(a)} / ${detalle(b)}`);
  });

caso("CF-AUT-03", "Autenticación", "Operaciones protegidas sin sesión", "HU-USU-02, RNF-02",
  "Sin iniciar sesión: GET mis-pedidos, GET pedidos, GET trabajadores, GET historial",
  "401 en las cuatro",
  async () => {
    const c = cliente();
    const estados = [];
    for (const ruta of ["/api/pedidos/mis-pedidos", "/api/pedidos", "/api/trabajadores", "/api/historial-pedidos"]) {
      estados.push((await c("GET", ruta)).estado);
    }
    return res(estados.every((e) => e === 401), estados.join(", "));
  });

caso("CF-AUT-04", "Autenticación", "Cada tipo de usuario solo accede a sus operaciones", "HU-USU-02, HU-ADM-03",
  "Cliente consulta la cola; trabajador consulta trabajadores y crea un pedido; administrador avanza un pedido; trabajador consulta el historial",
  "403 en las cinco",
  async () => {
    const [cli, trab, adm] = [await sesion(CLI1), await sesion(TRAB1), await sesion(ADMIN)];
    const r = [
      await cli("GET", "/api/pedidos"),
      await trab("GET", "/api/trabajadores"),
      await crearPedido(trab, [{ codigoProducto: 1, cantidad: 1 }]),
      await adm("POST", "/api/pedidos/6/iniciar-preparacion"),
      await trab("GET", "/api/historial-pedidos"),
    ].map((x) => x.estado);
    return res(r.every((e) => e === 403), r.join(", "));
  });

caso("CF-AUT-05", "Autenticación", "Cerrar sesión invalida el acceso", "HU-USU-02",
  "Iniciar sesión, cerrar sesión y consultar /api/auth/me", "401 después de cerrar sesión",
  async () => {
    const c = await sesion(CLI1);
    const antes = (await c("GET", "/api/auth/me")).estado;
    const salir = (await c("POST", "/api/auth/logout")).estado;
    const despues = (await c("GET", "/api/auth/me")).estado;
    return res(antes === 200 && salir < 300 && despues === 401, `antes ${antes}, logout ${salir}, después ${despues}`);
  });

// ----- Registro de clientes
const nuevo = (extra = {}) => ({
  nombre: "Prueba", apellido: "Cliente", cedula: cedula(1), celular: "0990000001",
  correo: "prueba.cliente@institucion.edu.ec", contrasena: CLAVE_NUEVA, ...extra,
});
const registrar = (datos) => cliente()("POST", "/api/clientes/registro", datos);

caso("CF-REG-01", "Registro", "Registro de un cliente válido", "HU-CLI-07",
  "POST /api/clientes/registro con datos válidos e iniciar sesión", "201 e inicio de sesión correcto",
  async () => {
    const r = await registrar(nuevo());
    const l = await cliente()("POST", "/api/auth/login", { correo: nuevo().correo, contrasena: CLAVE_NUEVA });
    return res(r.estado === 201 && l.estado === 200, `registro ${detalle(r)}, inicio de sesión ${l.estado}`);
  });

const rechazoRegistro = (id, titulo, cambio, campo) =>
  caso(id, "Registro", titulo, "HU-CLI-07", `Registrar con ${JSON.stringify(cambio)}`,
    `400 con error en «${campo}» y sin crear la cuenta`,
    async () => {
      const antes = contar("usuario");
      const r = await registrar(nuevo({ cedula: cedula(2), correo: "otro.cliente@institucion.edu.ec", ...cambio }));
      return res(r.estado === 400 && r.json?.errores?.[campo] && contar("usuario") === antes, detalle(r));
    });
rechazoRegistro("CF-REG-02", "Cédula con dígito verificador incorrecto",
  { cedula: cedula(2).slice(0, 9) + ((Number(cedula(2)[9]) + 1) % 10) }, "cedula");
rechazoRegistro("CF-REG-03", "Correo fuera del dominio institucional", { correo: "persona@gmail.com" }, "correo");
rechazoRegistro("CF-REG-04", "Celular que no empieza con 09", { celular: "0890000001" }, "celular");
rechazoRegistro("CF-REG-05", "Contraseña sin números", { contrasena: "solamenteletras" }, "contrasena");

caso("CF-REG-06", "Registro", "Correo o cédula repetidos", "HU-CLI-07",
  "Registrar de nuevo con el mismo correo y luego con la misma cédula", "409 en ambos casos",
  async () => {
    const a = await registrar(nuevo({ cedula: cedula(3) }));
    const b = await registrar(nuevo({ correo: "tercero.cliente@institucion.edu.ec" }));
    return res(a.estado === 409 && b.estado === 409, `${detalle(a)} / ${detalle(b)}`);
  });

caso("CF-REG-07", "Registro", "La contraseña se guarda cifrada", "RNF-02",
  "Consultar en la base el hash de la cuenta registrada", "Hash BCrypt de costo 10, distinto de la contraseña",
  async () => {
    const h = sql(`select contrasena_hash from usuario where correo = '${nuevo().correo}'`);
    return res(/^\$2[aby]\$10\$.{53}$/.test(h) && !h.includes(CLAVE_NUEVA), `hash ${h.slice(0, 7)}… de ${h.length} caracteres`);
  });

// ----- Cambio de contraseña
const cambiar = (c, contrasenaActual, contrasenaNueva) =>
  c("PUT", "/api/auth/contrasena", { contrasenaActual, contrasenaNueva });

caso("CF-PWD-01", "Contraseña", "Cambio sin sesión", "HU-USU-01", "PUT /api/auth/contrasena sin sesión", "401",
  async () => {
    const r = await cambiar(cliente(), CLAVE, CLAVE_NUEVA);
    return res(r.estado === 401, detalle(r));
  });
caso("CF-PWD-02", "Contraseña", "Contraseña actual incorrecta", "HU-USU-01",
  "Cambiar indicando mal la contraseña actual", "400 y la contraseña anterior sigue funcionando",
  async () => {
    const c = await sesion(CLI2);
    const r = await cambiar(c, "incorrecta1", CLAVE_NUEVA);
    const l = await cliente()("POST", "/api/auth/login", { correo: CLI2, contrasena: CLAVE });
    return res(r.estado === 400 && l.estado === 200, `${detalle(r)}, inicio con la anterior ${l.estado}`);
  });
caso("CF-PWD-03", "Contraseña", "Nueva contraseña igual a la actual o débil", "HU-USU-01",
  "Cambiar por la misma contraseña y por «corta1»", "400 en ambos casos",
  async () => {
    const c = await sesion(CLI2);
    const a = await cambiar(c, CLAVE, CLAVE);
    const b = await cambiar(c, CLAVE, "corta1");
    return res(a.estado === 400 && b.estado === 400, `${detalle(a)} / ${detalle(b)}`);
  });
caso("CF-PWD-04", "Contraseña", "Cambio correcto", "HU-USU-01",
  "Cambiar la contraseña e iniciar sesión con la anterior y con la nueva",
  "204; la anterior da 401 y la nueva 200",
  async () => {
    const c = await sesion(CLI2);
    const r = await cambiar(c, CLAVE, CLAVE_NUEVA);
    const a = await cliente()("POST", "/api/auth/login", { correo: CLI2, contrasena: CLAVE });
    const b = await cliente()("POST", "/api/auth/login", { correo: CLI2, contrasena: CLAVE_NUEVA });
    return res(r.estado === 204 && a.estado === 401 && b.estado === 200, `cambio ${r.estado}, anterior ${a.estado}, nueva ${b.estado}`);
  });

// ----- Productos y menú
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const formulario = ({ nombre, precio = "1.50", tipo = "bebida", imagen, archivo = "foto.png" }) => {
  const f = new FormData();
  f.set("nombre", nombre);
  f.set("precio", precio);
  f.set("tipo", tipo);
  if (imagen) f.set("imagen", new Blob([imagen], { type: "image/png" }), archivo);
  return f;
};
const menu = async () => (await cliente()("GET", "/api/productos/menu")).json;
const disponibles = () => sql("select string_agg(codigo_producto::text, ',' order by codigo_producto) from producto where disponible");

caso("CF-MEN-01", "Menú", "El menú muestra solo productos disponibles con su precio", "HU-CLI-01, RN-NEG-02",
  "GET /api/productos/menu y comparar con la base",
  "Los mismos productos disponibles; «Pastel de chocolate» (no disponible) no aparece",
  async () => {
    const m = await menu();
    const codigos = m.map((p) => p.codigoProducto).sort((a, b) => a - b).join(",");
    const ok = codigos === disponibles() && m.every((p) => p.precio > 0) && !m.some((p) => p.nombre === "Pastel de chocolate");
    return res(ok, `${m.length} productos, todos con precio; Pastel de chocolate ${m.some((p) => p.nombre === "Pastel de chocolate") ? "aparece" : "no aparece"}`);
  });

caso("CF-PRO-01", "Productos", "Registrar un producto", "HU-PER-01, RU-06",
  "Trabajador crea «Limonada de prueba» a 1.50", "201, disponible y visible en el menú",
  async () => {
    const r = await (await sesion(TRAB1))("POST", "/api/productos", formulario({ nombre: "Limonada de prueba" }));
    const enMenu = (await menu()).some((p) => p.nombre === "Limonada de prueba");
    return res(r.estado === 201 && r.json?.disponible === true && enMenu, `${r.estado}, disponible=${r.json?.disponible}, en menú=${enMenu}`);
  });
caso("CF-PRO-02", "Productos", "Nombre de producto repetido", "HU-PER-01",
  "Crear otra vez «Limonada de prueba»", "409",
  async () => {
    const r = await (await sesion(TRAB1))("POST", "/api/productos", formulario({ nombre: "Limonada de prueba" }));
    return res(r.estado === 409, detalle(r));
  });
caso("CF-PRO-03", "Productos", "Precios no válidos", "HU-PER-01",
  "Crear productos con precio 0, -1, 1.234 y 1000", "400 en los cuatro y ningún producto creado",
  async () => {
    const c = await sesion(TRAB1);
    const antes = contar("producto");
    const salidas = [];
    for (const [i, precio] of ["0", "-1", "1.234", "1000"].entries()) {
      salidas.push(await c("POST", "/api/productos", formulario({ nombre: `Precio malo ${i}`, precio })));
    }
    return res(salidas.every((r) => r.estado === 400) && contar("producto") === antes, salidas.map(detalle).join(" / "));
  });
caso("CF-PRO-04", "Productos", "Producto con imagen válida", "HU-PER-01",
  "Crear un producto adjuntando un PNG y solicitar la imagen", "201 y la imagen responde 200",
  async () => {
    const r = await (await sesion(TRAB1))("POST", "/api/productos", formulario({ nombre: "Té con imagen", imagen: PNG }));
    const img = r.json?.imagenUrl ? (await fetch(BASE + r.json.imagenUrl)).status : "sin URL";
    return res(r.estado === 201 && img === 200, `creación ${r.estado}, imagen ${img}`);
  });
caso("CF-PRO-05", "Productos", "Imagen falsa o demasiado grande", "HU-PER-01",
  "Adjuntar un texto con extensión .png y un PNG de 2,2 MB", "400 para el falso y 413 para el grande",
  async () => {
    const c = await sesion(TRAB1);
    const a = await c("POST", "/api/productos", formulario({ nombre: "Imagen falsa", imagen: Buffer.from("esto no es una imagen") }));
    let b;
    try {
      b = detalle(await c("POST", "/api/productos", formulario({ nombre: "Imagen grande", imagen: Buffer.concat([PNG, Buffer.alloc(2_300_000)]) })));
    } catch (e) {
      b = `conexión cortada (${e.cause?.code ?? e.message})`;
    }
    return res(a.estado === 400 && b.startsWith("413"), `${detalle(a)} / ${b}`);
  });
caso("CF-PRO-06", "Productos", "Actualizar nombre y precio", "HU-PER-02",
  "PATCH al producto «Limonada de prueba»", "200 y el menú muestra los nuevos datos",
  async () => {
    const codigo = codigoDe("Limonada de prueba");
    const r = await (await sesion(TRAB1))("PATCH", `/api/productos/${codigo}`, { nombre: "Limonada natural", precio: 1.8 });
    const p = (await menu()).find((x) => x.codigoProducto === codigo);
    return res(r.estado === 200 && p?.nombre === "Limonada natural" && p?.precio === 1.8, `${r.estado}; menú: ${p?.nombre} a ${p?.precio}`);
  });
caso("CF-PRO-07", "Productos", "Cambiar la disponibilidad", "HU-PER-03, RN-NEG-02",
  "Marcar un producto como no disponible y después disponible", "Sale del menú y vuelve a aparecer",
  async () => {
    const codigo = codigoDe("Limonada natural");
    const c = await sesion(TRAB1);
    const a = await c("PATCH", `/api/productos/${codigo}`, { disponible: false });
    const fuera = !(await menu()).some((p) => p.codigoProducto === codigo);
    const b = await c("PATCH", `/api/productos/${codigo}`, { disponible: true });
    const dentro = (await menu()).some((p) => p.codigoProducto === codigo);
    return res(a.estado === 200 && fuera && b.estado === 200 && dentro, `desactivar ${a.estado} (oculto=${fuera}), activar ${b.estado} (visible=${dentro})`);
  });
caso("CF-PRO-08", "Productos", "Armar el menú en lote", "HU-PER-03",
  "PUT /api/productos/menu con tres códigos; después con lista vacía y con un código inexistente",
  "Quedan disponibles solo los tres; las listas inválidas dan 400 sin cambios",
  async () => {
    const c = await sesion(TRAB1);
    const originales = disponibles().split(",").map(Number);
    const r = await c("PUT", "/api/productos/menu", { codigos: [1, 2, 3] });
    const quedan = disponibles();
    const a = await c("PUT", "/api/productos/menu", { codigos: [] });
    const b = await c("PUT", "/api/productos/menu", { codigos: [999999] });
    const sinCambio = disponibles() === quedan;
    await c("PUT", "/api/productos/menu", { codigos: originales });
    return res(r.estado === 200 && quedan === "1,2,3" && a.estado === 400 && b.estado === 400 && sinCambio,
      `${r.estado}, disponibles ${quedan}; vacía ${a.estado}; inexistente ${b.estado}; sin cambios=${sinCambio}`);
  });
caso("CF-PRO-09", "Productos", "Un cliente no puede modificar el menú", "HU-PER-02",
  "Cliente intenta cambiar un precio y armar el menú", "403 en ambos",
  async () => {
    const c = await sesion(CLI1);
    const a = await c("PATCH", "/api/productos/1", { precio: 0.01 });
    const b = await c("PUT", "/api/productos/menu", { codigos: [1] });
    return res(a.estado === 403 && b.estado === 403, `${a.estado}, ${b.estado}`);
  });

// ----- Pedidos del cliente
caso("CF-PED-01", "Pedidos", "Confirmar un pedido válido", "HU-CLI-02, HU-CLI-05, RN-NEG-03/05/06",
  "Pedir 2 cafés americanos y 1 sánduche de pollo",
  "201, estado pendiente, código de 6 caracteres y total = suma de precio × cantidad",
  async () => {
    const cafe = codigoDe("Café americano");
    const sanduche = codigoDe("Sánduche de pollo");
    const total = Number(sql(`select sum(precio * case codigo_producto when ${cafe} then 2 else 1 end) from producto where codigo_producto in (${cafe},${sanduche})`));
    const r = await crearPedido(await sesion(CLI1), [{ codigoProducto: cafe, cantidad: 2 }, { codigoProducto: sanduche, cantidad: 1 }]);
    const p = r.json ?? {};
    const ok = r.estado === 201 && String(p.estado).toLowerCase() === "pendiente"
      && /^[A-HJ-NP-Z2-9]{6}$/.test(p.codigoRetiro) && Math.abs(p.importeTotal - total) < 0.001;
    return res(ok, `${r.estado}, ${p.estado}, código con formato válido=${/^[A-HJ-NP-Z2-9]{6}$/.test(p.codigoRetiro)}, total ${p.importeTotal} (esperado ${total})`);
  });

const rechazoPedido = (id, titulo, refs, pasos, cuerpo) =>
  caso(id, "Pedidos", titulo, refs, pasos, "400 y ningún pedido creado",
    async () => {
      const antes = contar("pedido");
      const r = await (await sesion(CLI1))("POST", "/api/pedidos", cuerpo());
      const creados = contar("pedido") - antes;
      return res(r.estado === 400 && creados === 0, `${detalle(r)}; pedidos creados: ${creados}`);
    });
rechazoPedido("CF-PED-02", "Pedido sin productos", "HU-CLI-04, RN-NEG-01", "Enviar la lista de productos vacía", () => ({ items: [] }));
rechazoPedido("CF-PED-03", "Cantidad cero", "HU-CLI-04, RN-NEG-01", "Pedir 0 unidades", () => ({ items: [{ codigoProducto: 1, cantidad: 0 }] }));
rechazoPedido("CF-PED-04", "Cantidad negativa", "HU-CLI-04, RN-NEG-01", "Pedir -1 unidades", () => ({ items: [{ codigoProducto: 1, cantidad: -1 }] }));
rechazoPedido("CF-PED-05", "Cantidad decimal", "HU-CLI-04, RN-NEG-01", "Enviar a la API una cantidad de 1.5",
  () => '{"items":[{"codigoProducto":1,"cantidad":1.5}]}');
rechazoPedido("CF-PED-06", "Producto no disponible", "HU-CLI-04, RN-NEG-02", "Pedir «Pastel de chocolate»",
  () => ({ items: [{ codigoProducto: codigoDe("Pastel de chocolate"), cantidad: 1 }] }));
rechazoPedido("CF-PED-07", "Producto inexistente", "HU-CLI-04", "Pedir el código 999999",
  () => ({ items: [{ codigoProducto: 999999, cantidad: 1 }] }));
rechazoPedido("CF-PED-08", "Más de 30 productos distintos", "HU-CLI-04", "Enviar 31 líneas",
  () => ({ items: Array.from({ length: 31 }, (_, i) => ({ codigoProducto: i + 1, cantidad: 1 })) }));

caso("CF-PED-09", "Pedidos", "El servidor ignora precios enviados por el cliente", "HU-CLI-03, RN-NEG-03",
  "Enviar precioUnitario e importeTotal falsos (0.01) junto al pedido", "El total se calcula con el precio del menú",
  async () => {
    const precio = Number(sql("select precio from producto where codigo_producto = 1"));
    const r = await (await sesion(CLI1))("POST", "/api/pedidos",
      { importeTotal: 0.01, items: [{ codigoProducto: 1, cantidad: 2, precioUnitario: 0.01 }] });
    return res(r.estado === 201 && Math.abs(r.json.importeTotal - 2 * precio) < 0.001, `${r.estado}, total ${r.json?.importeTotal} (precio del menú ${precio} × 2)`);
  });
caso("CF-PED-10", "Pedidos", "Producto repetido en la selección", "HU-CLI-02",
  "Enviar el mismo producto en dos líneas (1 y 2 unidades)", "Una sola línea con 3 unidades",
  async () => {
    const r = await crearPedido(await sesion(CLI1), [{ codigoProducto: 1, cantidad: 1 }, { codigoProducto: 1, cantidad: 2 }]);
    const it = r.json?.items ?? [];
    return res(r.estado === 201 && it.length === 1 && it[0].cantidad === 3, `${r.estado}, ${it.length} línea(s), cantidad ${it[0]?.cantidad}`);
  });
caso("CF-PED-11", "Pedidos", "Códigos de retiro únicos", "HU-CLI-05, RN-NEG-05",
  "Crear 30 pedidos seguidos y revisar los códigos de toda la base", "Ningún código repetido y todos con el formato definido",
  async () => {
    const c = await sesion(CLI1);
    for (let i = 0; i < 30; i += 1) await crearPedido(c, [{ codigoProducto: 1, cantidad: 1 }]);
    const [total, distintos, invalidos] = sql("select count(*), count(distinct codigo_retiro), count(*) filter (where codigo_retiro !~ '^[A-HJ-NP-Z2-9]{6}$') from pedido").split("|").map(Number);
    return res(total === distintos && invalidos === 0, `${total} pedidos, ${distintos} códigos distintos, ${invalidos} con formato inválido`);
  });
caso("CF-PED-12", "Pedidos", "El precio de un pedido no cambia al cambiar el menú", "RN-NEG-04",
  "Crear un pedido, subir el precio del producto, consultar el pedido y crear otro",
  "El primero conserva precio y total; el nuevo usa el precio actualizado",
  async () => {
    const cli = await sesion(CLI1);
    const trab = await sesion(TRAB1);
    const codigo = codigoDe("Té helado");
    const a = (await crearPedido(cli, [{ codigoProducto: codigo, cantidad: 2 }])).json;
    await trab("PATCH", `/api/productos/${codigo}`, { precio: 9.5 });
    const despues = (await cli("GET", `/api/pedidos/${a.idPedido}`)).json;
    const b = (await crearPedido(cli, [{ codigoProducto: codigo, cantidad: 2 }])).json;
    await trab("PATCH", `/api/productos/${codigo}`, { precio: a.items[0].precioUnitario });
    return res(despues.importeTotal === a.importeTotal && despues.items[0].precioUnitario === a.items[0].precioUnitario && b.importeTotal === 19,
      `anterior: ${a.importeTotal} → ${despues.importeTotal}; nuevo: ${b.importeTotal}`);
  });
caso("CF-PED-13", "Pedidos", "Consultar mis pedidos y su estado", "HU-CLI-06, RU-05",
  "Un cliente consulta sus pedidos; otro cliente intenta abrir uno ajeno",
  "El dueño ve estado y código; el otro recibe 404",
  async () => {
    const a = await sesion(CLI1);
    const mios = (await a("GET", "/api/pedidos/mis-pedidos")).json;
    const b = await cliente();
    await b("POST", "/api/auth/login", { correo: "carla.mena@institucion.edu.ec", contrasena: CLAVE });
    const ajeno = await b("GET", `/api/pedidos/${mios[0].idPedido}`);
    const ok = mios.length > 0 && mios.every((p) => p.estado && p.codigoRetiro) && ajeno.estado === 404;
    return res(ok, `${mios.length} pedidos propios con estado y código; pedido ajeno ${detalle(ajeno)}`);
  });

// ----- Atención y entrega
let pedidoFlujo;
let otroPedido;
const avanzar = (c, id, paso, cuerpo) => c("POST", `/api/pedidos/${id}/${paso}`, cuerpo);

caso("CF-PER-01", "Atención", "Consultar pedidos pendientes sin ver los códigos", "HU-PER-04, RN-NEG-07",
  "Trabajador consulta GET /api/pedidos?estado=pendiente",
  "Solo pedidos pendientes y sin código de retiro en la respuesta",
  async () => {
    const cli = await sesion(CLI1);
    pedidoFlujo = (await crearPedido(cli, [{ codigoProducto: 1, cantidad: 1 }])).json;
    otroPedido = (await crearPedido(cli, [{ codigoProducto: 2, cantidad: 1 }])).json;
    const r = await (await sesion(TRAB1))("GET", "/api/pedidos?estado=pendiente&limite=500");
    const soloPend = r.json.every((p) => String(p.estado).toLowerCase() === "pendiente");
    const conCodigo = r.json.filter((p) => "codigoRetiro" in p).length;
    return res(r.estado === 200 && soloPend && conCodigo === 0 && r.json.some((p) => p.idPedido === pedidoFlujo.idPedido),
      `${r.json.length} pedidos, todos pendientes=${soloPend}, con código: ${conCodigo}`);
  });
caso("CF-PER-02", "Atención", "No se pueden saltar estados", "RN-NEG-06, RN-NEG-07",
  "Marcar listo y entregar un pedido pendiente (con su código correcto)", "409 en ambos y sigue pendiente",
  async () => {
    const t = await sesion(TRAB1);
    const a = await avanzar(t, pedidoFlujo.idPedido, "marcar-listo");
    const b = await avanzar(t, pedidoFlujo.idPedido, "entregar", { codigoRetiro: pedidoFlujo.codigoRetiro });
    const e = estadoDe(pedidoFlujo.idPedido);
    return res(a.estado === 409 && b.estado === 409 && e === "pendiente", `${detalle(a)} / ${detalle(b)}; estado ${e}`);
  });
caso("CF-PER-03", "Atención", "Iniciar la preparación", "HU-PER-05", "Iniciar preparación del pedido pendiente",
  "200 y estado en_preparacion",
  async () => {
    const r = await avanzar(await sesion(TRAB1), pedidoFlujo.idPedido, "iniciar-preparacion");
    const e = estadoDe(pedidoFlujo.idPedido);
    return res(r.estado === 200 && e === "en_preparacion", `${r.estado}, estado ${e}`);
  });
caso("CF-PER-04", "Atención", "No se puede repetir ni retroceder un estado", "RN-NEG-06",
  "Iniciar otra vez la preparación del mismo pedido", "409",
  async () => {
    const r = await avanzar(await sesion(TRAB1), pedidoFlujo.idPedido, "iniciar-preparacion");
    return res(r.estado === 409, detalle(r));
  });
caso("CF-PER-05", "Atención", "Marcar el pedido como listo", "HU-PER-06", "Marcar listo", "200 y estado listo",
  async () => {
    const r = await avanzar(await sesion(TRAB1), pedidoFlujo.idPedido, "marcar-listo");
    const e = estadoDe(pedidoFlujo.idPedido);
    return res(r.estado === 200 && e === "listo", `${r.estado}, estado ${e}`);
  });
caso("CF-PER-06", "Entrega", "Comprobar un código incorrecto", "HU-PER-07, RN-NEG-07",
  "Verificar el código AAAAAA", "Respuesta válido=false y el estado no cambia",
  async () => {
    const r = await avanzar(await sesion(TRAB1), pedidoFlujo.idPedido, "verificar-codigo", { codigoRetiro: "AAAAAA" });
    const e = estadoDe(pedidoFlujo.idPedido);
    return res(r.estado === 200 && r.json?.valido === false && e === "listo", `${r.estado}, válido=${r.json?.valido}, estado ${e}`);
  });
caso("CF-PER-07", "Entrega", "Entregar con código incorrecto, vacío o de otro pedido", "HU-PER-07, RN-NEG-07",
  "Intentar entregar con AAAAAA, sin código y con el código de otro pedido", "400 en los tres y sigue listo",
  async () => {
    const t = await sesion(TRAB1);
    const r = [];
    for (const codigoRetiro of ["AAAAAA", "", otroPedido.codigoRetiro]) {
      r.push(await avanzar(t, pedidoFlujo.idPedido, "entregar", { codigoRetiro }));
    }
    const e = estadoDe(pedidoFlujo.idPedido);
    return res(r.every((x) => x.estado === 400) && e === "listo", `${r.map(detalle).join(" / ")}; estado ${e}`);
  });
caso("CF-PER-08", "Entrega", "Entregar con el código correcto", "HU-PER-07, RN-NEG-07",
  "Verificar y entregar escribiendo el código en minúsculas", "válido=true, 200 y estado entregado",
  async () => {
    const t = await sesion(TRAB1);
    const codigoRetiro = pedidoFlujo.codigoRetiro.toLowerCase();
    const v = await avanzar(t, pedidoFlujo.idPedido, "verificar-codigo", { codigoRetiro });
    const r = await avanzar(t, pedidoFlujo.idPedido, "entregar", { codigoRetiro });
    const e = estadoDe(pedidoFlujo.idPedido);
    return res(v.json?.valido === true && r.estado === 200 && e === "entregado", `válido=${v.json?.valido}, entrega ${r.estado}, estado ${e}`);
  });
caso("CF-PER-09", "Entrega", "No se puede entregar dos veces", "RN-NEG-06/07",
  "Entregar de nuevo el pedido entregado", "409",
  async () => {
    const r = await avanzar(await sesion(TRAB1), pedidoFlujo.idPedido, "entregar", { codigoRetiro: pedidoFlujo.codigoRetiro });
    return res(r.estado === 409, detalle(r));
  });
caso("CF-PER-10", "Atención", "Dos trabajadores cambian el mismo pedido a la vez", "RNF-04",
  "20 repeticiones: dos sesiones inician la preparación del mismo pedido simultáneamente",
  "En cada repetición: una respuesta 200, una 409 y un solo registro en el historial",
  async () => {
    const cli = await sesion(CLI1);
    const [a, b] = [await sesion(TRAB1), await sesion(TRAB2)];
    const resumen = {};
    let ok = true;
    for (let i = 0; i < 20; i += 1) {
      const id = (await crearPedido(cli, [{ codigoProducto: 1, cantidad: 1 }])).json.idPedido;
      const r = await Promise.all([avanzar(a, id, "iniciar-preparacion"), avanzar(b, id, "iniciar-preparacion")]);
      const clave = r.map((x) => x.estado).sort().join("+");
      resumen[clave] = (resumen[clave] ?? 0) + 1;
      const filas = Number(sql(`select count(*) from historial_estado_pedido where id_pedido = ${id} and estado = 'en_preparacion'`));
      ok &&= clave === "200+409" && filas === 1;
    }
    return res(ok, Object.entries(resumen).map(([k, v]) => `${k}: ${v} veces`).join("; "));
  });

// ----- Administración
const trabajadorNuevo = (extra = {}) => ({
  nombre: "Prueba", apellido: "Mostrador", cedula: cedula(50), correo: "prueba.mostrador@institucion.edu.ec", contrasena: CLAVE_NUEVA, ...extra,
});
caso("CF-ADM-01", "Administración", "Crear una cuenta de trabajador", "HU-ADM-01",
  "Administrador registra un trabajador y este inicia sesión", "201 y sesión de tipo trabajador",
  async () => {
    const r = await (await sesion(ADMIN))("POST", "/api/trabajadores", trabajadorNuevo());
    const l = await cliente()("POST", "/api/auth/login", { correo: trabajadorNuevo().correo, contrasena: CLAVE_NUEVA });
    return res(r.estado === 201 && String(l.json?.tipo).toLowerCase() === "trabajador", `alta ${r.estado}, sesión ${l.estado} ${l.json?.tipo}`);
  });
caso("CF-ADM-02", "Administración", "Datos de trabajador inválidos o repetidos", "HU-ADM-01",
  "Registrar con cédula inválida y con el correo ya usado", "400 y 409",
  async () => {
    const c = await sesion(ADMIN);
    const a = await c("POST", "/api/trabajadores", trabajadorNuevo({ cedula: "1234567890", correo: "x.mostrador@institucion.edu.ec" }));
    const b = await c("POST", "/api/trabajadores", trabajadorNuevo({ cedula: cedula(51) }));
    return res(a.estado === 400 && b.estado === 409, `${detalle(a)} / ${detalle(b)}`);
  });
caso("CF-ADM-03", "Administración", "Lista de trabajadores sin contraseñas", "HU-ADM-02",
  "GET /api/trabajadores", "Incluye al nuevo trabajador y ningún campo de contraseña",
  async () => {
    const r = await (await sesion(ADMIN))("GET", "/api/trabajadores");
    const campos = [...new Set(r.json.flatMap(Object.keys))];
    const ok = r.estado === 200 && r.json.some((t) => t.correo === trabajadorNuevo().correo) && !campos.some((k) => /contras|hash|password/i.test(k));
    return res(ok, `${r.json.length} trabajadores; campos: ${campos.join(", ")}`);
  });
caso("CF-ADM-04", "Administración", "Historial de cambios de estado", "HU-ADM-03",
  "GET /api/historial-pedidos?idPedido del pedido entregado",
  "Cuatro cambios en orden, con el responsable en los tres hechos por personal",
  async () => {
    const r = await (await sesion(ADMIN))("GET", `/api/historial-pedidos?idPedido=${pedidoFlujo.idPedido}`);
    const cambios = r.json?.pedidos?.[0]?.cambios ?? [];
    const estados = cambios.map((x) => String(x.estado).toLowerCase()).join(" → ");
    const conResp = cambios.filter((x) => x.trabajadorNombre).length;
    return res(r.estado === 200 && estados === "pendiente → en_preparacion → listo → entregado" && conResp === 3, `${estados}; con responsable: ${conResp}`);
  });

// ----- Defensa en la base de datos
const idPendiente = () => Number(sql("select id_pedido from pedido where estado = 'pendiente' order by id_pedido limit 1"));
caso("CF-BD-01", "Base de datos", "La base rechaza saltar estados", "RN-NEG-06, RNF-03",
  "Insertar directamente el estado «entregado» en un pedido pendiente", "La base devuelve error",
  async () => {
    const e = sqlError(`insert into historial_estado_pedido (id_pedido, id_trabajador, estado) values (${idPendiente()}, 1, 'entregado')`);
    return res(e, e ?? "la operación se aceptó");
  });
caso("CF-BD-02", "Base de datos", "La base protege el precio registrado", "RN-NEG-04, RNF-03",
  "Actualizar directamente detalle_pedido.precio_unitario", "La base devuelve error",
  async () => {
    const e = sqlError(`update detalle_pedido set precio_unitario = 0.01 where id_pedido = ${idPendiente()}`);
    return res(e, e ?? "la operación se aceptó");
  });
caso("CF-BD-03", "Base de datos", "La base rechaza productos no disponibles", "RN-NEG-02, RNF-03",
  "Llamar a crear_pedido() con un producto no disponible", "La base devuelve error",
  async () => {
    const e = sqlError(`select * from crear_pedido(1, '[{"codigo_producto": ${codigoDe("Pastel de chocolate")}, "cantidad": 1}]'::jsonb)`);
    return res(e, e ?? "la operación se aceptó");
  });

// ---------------------------------------------------------------- ejecución
function reiniciarBase() {
  sql("create schema if not exists extensions;");
  for (const archivo of ["cafeteria_schema.sql", "insert_cafeteria.sql"]) {
    sql(readFileSync(join(DIR_SQL, archivo), "utf8"));
  }
}
/** Aborta si la aplicación no está leyendo la base local (evita escribir en otra base). */
async function comprobarBaseLocal() {
  const marca = `Marca ${Date.now()}`;
  sql(`update producto set nombre = '${marca}' where codigo_producto = 1`);
  const visto = (await menu()).some((p) => p.nombre === marca);
  if (!visto) throw new Error("La aplicación NO está conectada a la base local. No se ejecuta nada.");
}

reiniciarBase();
await comprobarBaseLocal();
reiniciarBase();

const resultados = [];
const inicio = new Date();
for (const { ejecutar, ...datos } of casos) {
  let r;
  try {
    r = await ejecutar();
  } catch (e) {
    r = res(false, `Error al ejecutar: ${e.message}`);
  }
  resultados.push({ ...datos, obtenido: r.obtenido, resultado: r.ok ? "Aprobado" : "Fallido" });
  console.log(`${r.ok ? "OK   " : "FALLA"} ${datos.id}  ${r.obtenido}`);
}
const fallidos = resultados.filter((r) => r.resultado === "Fallido").length;
console.log(`\nTotal ${resultados.length} | aprobados ${resultados.length - fallidos} | fallidos ${fallidos}`);
writeFileSync(join(DIR_SALIDA, "resultados_funcionales.json"),
  JSON.stringify({ fecha: inicio.toISOString(), base: BASE, total: resultados.length, fallidos, resultados }, null, 2));
