// Casos de prueba por la interfaz, con captura del resultado de cada uno (Release 1.0).
//
// ATENCIÓN: borra y vuelve a cargar la base de datos del contenedor local de pruebas.
// Uso: node casos_interfaz.mjs <carpeta .sql> <carpeta de capturas> <salida.json>
//        <trabajador.js anterior a la corrección> <trabajador.js servido por la aplicación>
// Requiere: Node 22+, Microsoft Edge, el contenedor "cafeteria-pruebas" y la aplicación
// en http://localhost:8090 conectada a ese contenedor.

import { execFileSync, spawn } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:8090";
const CONTENEDOR = "cafeteria-pruebas";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const [, , DIR_SQL, DIR_CAPTURAS, SALIDA, JS_ANTERIOR, JS_SERVIDO] = process.argv;
if (!JS_SERVIDO) throw new Error("Faltan argumentos (ver la cabecera del archivo)");
mkdirSync(DIR_CAPTURAS, { recursive: true });

// Contraseña de las cuentas de prueba (insert_cafeteria.sql) y la de las cuentas nuevas
const CLAVE = "cafeteria123";
const CLAVE_NUEVA = "Prueba2026x";
const ADMIN = "admin@institucion.edu.ec";
const TRAB = "maria.lopez@institucion.edu.ec";
const CLI = "ana.torres@institucion.edu.ec";
const CLI2 = "bruno.vera@institucion.edu.ec";

const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
const texto = (v) => JSON.stringify(v);

// ---------------------------------------------------------------- base de datos
function sql(consulta) {
  return execFileSync("docker",
    ["exec", "-i", CONTENEDOR, "psql", "-U", "postgres", "-d", "cafeteria", "-At", "-q", "-v", "ON_ERROR_STOP=1"],
    { input: consulta, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}
function reiniciarBase() {
  sql("create schema if not exists extensions;");
  for (const f of ["cafeteria_schema.sql", "insert_cafeteria.sql"]) sql(readFileSync(join(DIR_SQL, f), "utf8"));
}
const codigoDe = (nombre) => Number(sql(`select codigo_producto from producto where nombre = '${nombre}'`));
const noDisponibles = () => Number(sql("select count(*) from producto where not disponible"));
const alimentosDisponibles = () => Number(sql("select count(*) from producto where disponible and tipo_producto = 'alimento'"));

// ---------------------------------------------------------------- API (preparación de datos)
async function api(correo) {
  let cookie = "";
  const pedir = async (metodo, ruta, cuerpo) => {
    const r = await fetch(BASE + ruta, {
      method: metodo,
      headers: { ...(cookie && { Cookie: cookie }), ...(cuerpo && { "Content-Type": "application/json" }) },
      body: cuerpo && JSON.stringify(cuerpo),
    });
    for (const c of r.headers.getSetCookie()) cookie = c.split(";")[0];
    return { estado: r.status, json: await r.json().catch(() => null) };
  };
  await pedir("POST", "/api/auth/login", { correo, contrasena: CLAVE });
  return pedir;
}

// ---------------------------------------------------------------- navegador (DevTools)
const perfil = mkdtempSync(join(tmpdir(), "edge-pruebas-"));
const edge = spawn(EDGE, ["--headless=new", "--remote-debugging-port=9333", `--user-data-dir=${perfil}`,
  "--no-first-run", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
let ws;
let secuencia = 0;
const pendientes = new Map();
const enviar = (method, params = {}) => new Promise((ok, mal) => {
  const id = ++secuencia;
  pendientes.set(id, { ok, mal });
  ws.send(JSON.stringify({ id, method, params }));
});
async function conectar() {
  for (let i = 0; i < 60; i += 1) {
    try {
      const lista = await (await fetch("http://127.0.0.1:9333/json/list")).json();
      const pagina = lista.find((t) => t.type === "page");
      if (pagina) {
        ws = new WebSocket(pagina.webSocketDebuggerUrl);
        await new Promise((ok, mal) => { ws.onopen = ok; ws.onerror = mal; });
        ws.onmessage = (m) => {
          const d = JSON.parse(m.data);
          const p = pendientes.get(d.id);
          if (!p) return;
          pendientes.delete(d.id);
          if (d.error) p.mal(new Error(d.error.message)); else p.ok(d.result);
        };
        await enviar("Page.enable");
        await enviar("Network.enable");
        await enviar("Network.setCacheDisabled", { cacheDisabled: true });
        await enviar("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
        return;
      }
    } catch { /* el navegador todavía arranca */ }
    await pausa(500);
  }
  throw new Error("No se pudo conectar con Edge");
}
async function js(expresion) {
  const r = await enviar("Runtime.evaluate", { expression: expresion, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? "error en la página");
  return r.result.value;
}
async function esperar(expresion, ms = 8000) {
  const fin = Date.now() + ms;
  while (Date.now() < fin) {
    try { if (await js(`Boolean(${expresion})`)) return true; } catch { /* navegando */ }
    await pausa(200);
  }
  return false;
}
async function ir(ruta) {
  await enviar("Page.navigate", { url: BASE + ruta });
  await pausa(500);
  await esperar("document.readyState === 'complete'");
  await pausa(900);
}
const q = (sel) => `document.querySelector(${texto(sel)})`;
async function clic(sel) {
  if (!(await esperar(q(sel)))) throw new Error(`No existe ${sel}`);
  await js(`${q(sel)}.click()`);
  await pausa(350);
}
async function escribir(sel, valor) {
  if (!(await esperar(q(sel)))) throw new Error(`No existe ${sel}`);
  await js(`(() => { const e = ${q(sel)}; e.value = ${texto(String(valor))};
    e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); })()`);
}
const leer = (sel) => js(`(${q(sel)}?.innerText ?? '').replace(/\\s+/g, ' ').trim()`);
const avisos = () => js("[...document.querySelectorAll('.toast')].map(t => t.textContent.trim()).join(' | ')");
const ruta = () => js("location.pathname");
const verEn = async (sel, bloque = "center") => { await js(`${q(sel)}?.scrollIntoView({ block: ${texto(bloque)} })`); };
async function foto(nombre) {
  await pausa(600);
  const r = await enviar("Page.captureScreenshot", { format: "jpeg", quality: 82 });
  writeFileSync(join(DIR_CAPTURAS, `${nombre}.jpg`), Buffer.from(r.data, "base64"));
  return `${nombre}.jpg`;
}

async function limpiarSesion() {
  await enviar("Network.clearBrowserCookies");
  await ir("/cliente/index.html");
  await js("localStorage.clear(); sessionStorage.clear()");
}
async function entrarCliente(correo = CLI, clave = CLAVE) {
  await limpiarSesion();
  await ir("/cliente/index.html");
  await escribir("#login-correo", correo);
  await escribir("#login-contrasena", clave);
  await clic("#btn-ingresar");
  await esperar("location.pathname.endsWith('menu.html')");
  await esperar("document.querySelector('.btn-agregar')");
}
async function entrarPersonal(correo = TRAB) {
  await limpiarSesion();
  await ir("/admin/index.html");
  await escribir("#correo", correo);
  await escribir("#contrasena", CLAVE);
  await clic("#btn-ingresar");
  await esperar("location.pathname.includes('panel-')");
  await pausa(1500);
}
const agregar = (nombre) => clic(`.btn-agregar[aria-label="Agregar ${nombre} al carrito"]`);
const pestana = (id) => clic(`button[data-tab="${id}"]`);
const filtroPedidos = async (contador) => {
  await js(`document.getElementById(${texto(contador)}).closest('button').click()`);
  await pausa(900);
};

// ---------------------------------------------------------------- casos
const casos = [];
const caso = (id, modulo, titulo, requisito, precondicion, pasos, esperado, ejecutar) =>
  casos.push({ id, modulo, titulo, requisito, precondicion, pasos, esperado, ejecutar });
const res = (ok, obtenido) => ({ ok: Boolean(ok), obtenido });

const registro = {
  nombre: "Prueba", apellido: "Cliente", cedula: "1700000019", celular: "0990000019",
  correo: "prueba.cliente@institucion.edu.ec",
};
function cedulaValida(base9) {
  const s = [...base9].reduce((t, d, i) => { let v = Number(d) * (i % 2 ? 1 : 2); if (v > 9) v -= 9; return t + v; }, 0);
  return base9 + ((10 - (s % 10)) % 10);
}
registro.cedula = cedulaValida("170000901");
async function llenarRegistro(datos) {
  await limpiarSesion();
  await ir("/cliente/index.html");
  await clic("#tab-registro");
  for (const [campo, valor] of Object.entries(datos)) await escribir(`#reg-${campo}`, valor);
}
const erroresRegistro = () => js("[...document.querySelectorAll('[id^=reg-][id$=-error], #registro-error')].map(e => e.textContent.trim()).filter(Boolean).join(' | ')");

caso("CP-01", "Registro", "Registrar un cliente con datos válidos", "HU-CLI-07",
  "No existe una cuenta con el correo ni la cédula usados.",
  ["Abrir el portal de clientes y pulsar «Crear cuenta».", "Completar todos los campos con datos válidos.", "Pulsar «Crear cuenta»."],
  "Se crea la cuenta, se inicia sesión y se muestra el menú.",
  async (f) => {
    await llenarRegistro({ ...registro, contrasena: CLAVE_NUEVA, confirmar: CLAVE_NUEVA });
    await clic("#btn-registrar");
    await esperar("location.pathname.endsWith('menu.html')");
    await esperar("document.querySelector('.toast')");
    const aviso = await avisos();
    await f();
    const p = await ruta();
    return res(p.endsWith("menu.html"), `Se abrió el menú con el aviso «${aviso}».`);
  });

caso("CP-02", "Registro", "Registrar con datos no válidos", "HU-CLI-07",
  "Ninguna.",
  ["Abrir «Crear cuenta».", "Escribir una cédula con dígito verificador incorrecto, un celular que empiece con 08 y una contraseña sin números.", "Pulsar «Crear cuenta»."],
  "No se crea la cuenta y se indica el error de cada campo.",
  async (f) => {
    const antes = sql("select count(*) from usuario");
    await llenarRegistro({ ...registro, cedula: "1700000000", celular: "0890000000", correo: "otra.persona@institucion.edu.ec", contrasena: "sinnumeros", confirmar: "sinnumeros" });
    await clic("#btn-registrar");
    await pausa(1500);
    const e = await erroresRegistro();
    await verEn("#btn-registrar", "end");
    await f();
    return res(e && sql("select count(*) from usuario") === antes, `No se creó la cuenta. Mensajes: ${e}`);
  });

caso("CP-03", "Registro", "Registrar un correo ya usado", "HU-CLI-07",
  "Existe la cuenta creada en CP-01.",
  ["Abrir «Crear cuenta».", "Usar el mismo correo de CP-01 con otra cédula.", "Pulsar «Crear cuenta»."],
  "No se crea la cuenta y se informa que el correo ya existe.",
  async (f) => {
    const antes = sql("select count(*) from usuario");
    await llenarRegistro({ ...registro, cedula: cedulaValida("170000902"), contrasena: CLAVE_NUEVA, confirmar: CLAVE_NUEVA });
    await clic("#btn-registrar");
    await pausa(1500);
    const e = await erroresRegistro();
    await verEn("#btn-registrar", "end");
    await f();
    return res(/ya existe/i.test(e) && sql("select count(*) from usuario") === antes, `Mensaje: ${e}`);
  });

caso("CP-04", "Acceso", "Iniciar sesión como cliente", "HU-USU-02",
  "Cuenta de cliente de prueba.",
  ["Abrir el portal de clientes.", "Escribir correo y contraseña correctos.", "Pulsar «Ingresar»."],
  "Se muestra el menú con el nombre del cliente.",
  async (f) => {
    await entrarCliente();
    await f();
    const saludo = await leer("#saludo-cliente");
    return res((await ruta()).endsWith("menu.html") && /Ana/.test(saludo), `Menú abierto con el saludo «${saludo}».`);
  });

caso("CP-05", "Acceso", "Iniciar sesión con contraseña incorrecta", "HU-USU-02",
  "Cuenta de cliente de prueba.",
  ["Abrir el portal de clientes.", "Escribir el correo correcto y una contraseña incorrecta.", "Pulsar «Ingresar»."],
  "No se inicia sesión y el mensaje no revela si el correo existe.",
  async (f) => {
    await limpiarSesion();
    await ir("/cliente/index.html");
    await escribir("#login-correo", CLI);
    await escribir("#login-contrasena", "incorrecta1");
    await clic("#btn-ingresar");
    await pausa(1500);
    const m = await leer("#login-error");
    await f();
    return res(m === "Correo o contraseña incorrectos.", `Mensaje: «${m}»`);
  });

caso("CP-06", "Acceso", "Una cuenta del personal no entra al portal de clientes", "HU-USU-02",
  "Cuenta de trabajador de prueba.",
  ["Abrir el portal de clientes.", "Iniciar sesión con una cuenta de trabajador."],
  "Se rechaza el acceso y se indica usar el portal del personal.",
  async (f) => {
    await limpiarSesion();
    await ir("/cliente/index.html");
    await escribir("#login-correo", TRAB);
    await escribir("#login-contrasena", CLAVE);
    await clic("#btn-ingresar");
    await pausa(1800);
    const m = await leer("#login-error");
    await f();
    return res(/personal/i.test(m) && !(await ruta()).endsWith("menu.html"), `Mensaje: «${m}»`);
  });

caso("CP-07", "Acceso", "Una cuenta de cliente no entra al portal del personal", "HU-USU-02",
  "Cuenta de cliente de prueba.",
  ["Abrir el portal del personal.", "Iniciar sesión con una cuenta de cliente."],
  "Se rechaza el acceso y se indica usar el portal de clientes.",
  async (f) => {
    await limpiarSesion();
    await ir("/admin/index.html");
    await escribir("#correo", CLI);
    await escribir("#contrasena", CLAVE);
    await clic("#btn-ingresar");
    await pausa(1800);
    const m = await leer("#login-error");
    await f();
    return res(/cliente/i.test(m) && !(await ruta()).includes("panel-"), `Mensaje: «${m}»`);
  });

caso("CP-08", "Acceso", "Abrir una página protegida sin sesión", "HU-USU-02, RNF-02",
  "No hay sesión iniciada.",
  ["Escribir en el navegador la dirección del panel del trabajador (/admin/panel-trabajador.html)."],
  "El sistema redirige a la pantalla de acceso.",
  async (f) => {
    await limpiarSesion();
    await ir("/admin/panel-trabajador.html");
    await esperar("location.pathname.endsWith('/admin/index.html')");
    const p = await ruta();
    await f();
    return res(p.endsWith("/admin/index.html"), `Redirigió a ${p}.`);
  });

caso("CP-09", "Menú", "Consultar el menú y los precios", "HU-CLI-01, RN-NEG-02",
  "«Pastel de chocolate» está marcado como no disponible.",
  ["Iniciar sesión como cliente.", "Revisar los productos y precios del menú."],
  "Se muestran solo los productos disponibles, cada uno con su precio.",
  async (f) => {
    await entrarCliente();
    const n = await js("document.querySelectorAll('.producto-card').length");
    const pastel = await js("document.getElementById('grilla-menu').innerText.includes('Pastel de chocolate')");
    const disp = Number(sql("select count(*) from producto where disponible"));
    await f();
    return res(n === disp && !pastel, `${n} productos mostrados (${disp} disponibles en la base); «Pastel de chocolate» ${pastel ? "aparece" : "no aparece"}.`);
  });

caso("CP-10", "Menú", "Buscar y filtrar productos", "HU-CLI-01",
  "Sesión de cliente.",
  ["Escribir «café» en «Buscar producto»."],
  "Solo se muestran los productos cuyo nombre contiene «café».",
  async (f) => {
    await entrarCliente();
    await escribir("#buscar-producto", "café");
    await pausa(600);
    const nombres = await js("[...document.querySelectorAll('.btn-agregar')].map(b => b.getAttribute('aria-label').replace('Agregar ','').replace(' al carrito',''))");
    await f();
    return res(nombres.length > 0 && nombres.every((n) => /café/i.test(n)), `Se mostraron: ${nombres.join(", ")}.`);
  });

caso("CP-11", "Pedido", "No se puede confirmar un pedido vacío", "HU-CLI-04, RN-NEG-01",
  "Sesión de cliente con el carrito vacío.",
  ["Abrir el menú sin agregar productos.", "Intentar pulsar «Revisar pedido»."],
  "El botón está deshabilitado.",
  async (f) => {
    await entrarCliente();
    const d = await js("document.getElementById('btn-revisar').disabled");
    await f();
    return res(d, d ? "«Revisar pedido» aparece deshabilitado." : "El botón está habilitado.");
  });

caso("CP-12", "Pedido", "Armar un pedido y revisar el total", "HU-CLI-02, HU-CLI-03, RN-NEG-03",
  "Sesión de cliente.",
  ["Agregar dos veces «Café americano».", "Agregar una vez «Sánduche de pollo».", "Revisar el total en «Tu pedido»."],
  "El total es 2 × precio del café + precio del sánduche.",
  async (f) => {
    await entrarCliente();
    await agregar("Café americano");
    await agregar("Café americano");
    await agregar("Sánduche de pollo");
    await pausa(3500);
    const total = Number(sql("select sum(precio * case nombre when 'Café americano' then 2 else 1 end) from producto where nombre in ('Café americano','Sánduche de pollo')"));
    const visto = await leer("#total-carrito");
    await f();
    return res(visto === `$${total.toFixed(2)}`, `Total mostrado ${visto}; esperado $${total.toFixed(2)}.`);
  });

caso("CP-13", "Pedido", "Quitar un producto reduciendo la cantidad a cero", "HU-CLI-02, RN-NEG-01",
  "Un producto en el carrito.",
  ["Agregar «Agua mineral».", "Escribir 0 en el campo de cantidad."],
  "El carrito no admite la cantidad cero: el producto se quita.",
  async (f) => {
    await entrarCliente();
    await agregar("Agua mineral");
    await escribir(".input-cantidad", 0);
    await pausa(3500);
    const n = await js("document.querySelectorAll('.input-cantidad').length");
    const total = await leer("#total-carrito");
    await f();
    return res(n === 0 && total === "$0.00", `Líneas en el carrito: ${n}; total ${total}.`);
  });

caso("CP-14", "Pedido", "Confirmar el pedido y obtener el código", "HU-CLI-05, RN-NEG-05, RN-NEG-06",
  "Sesión de cliente.",
  ["Agregar «Café americano» y «Sánduche de pollo».", "Pulsar «Revisar pedido».", "Pulsar «Confirmar pedido»."],
  "Se muestra un código de retiro de 6 caracteres, el estado Pendiente y el total.",
  async (f) => {
    await entrarCliente();
    await agregar("Café americano");
    await agregar("Sánduche de pollo");
    await clic("#btn-revisar");
    await clic("#btn-confirmar");
    await esperar("document.getElementById('conf-codigo').textContent.trim().length >= 6");
    const codigo = (await leer("#conf-codigo")).replace(/\s/g, "");
    const estado = await leer("#conf-estado");
    const total = await leer("#conf-total");
    await pausa(3000);
    await f();
    return res(/^[A-HJ-NP-Z2-9]{6}$/.test(codigo) && /Pendiente/i.test(estado), `Código ${codigo}, estado ${estado}, total ${total}.`);
  });

caso("CP-15", "Pedido", "Un producto deja de estar disponible antes de confirmar", "HU-CLI-04, RN-NEG-02",
  "El cliente tiene el producto en el carrito y el personal lo desactiva.",
  ["Agregar «Humita» y pulsar «Revisar pedido».", "Mientras tanto, el trabajador marca «Humita» como no disponible.", "Pulsar «Confirmar pedido»."],
  "El pedido no se confirma y se informa el motivo.",
  async (f) => {
    await entrarCliente();
    await agregar("Humita");
    await clic("#btn-revisar");
    const t = await api(TRAB);
    await t("PATCH", `/api/productos/${codigoDe("Humita")}`, { disponible: false });
    const antes = sql("select count(*) from pedido");
    await clic("#btn-confirmar");
    await pausa(2000);
    const m = `${await leer("#revision-error")} ${await avisos()}`.trim();
    await f();
    const igual = sql("select count(*) from pedido") === antes;
    await t("PATCH", `/api/productos/${codigoDe("Humita")}`, { disponible: true });
    return res(igual && m, `No se creó el pedido. Mensaje: ${m}`);
  });

let pedido; // pedido que recorre todo el flujo de atención
caso("CP-16", "Seguimiento", "Consultar el estado de mis pedidos", "HU-CLI-06, RU-05",
  "El cliente tiene un pedido recién creado.",
  ["Iniciar sesión como cliente.", "Abrir «Mis pedidos»."],
  "Se muestra cada pedido en curso con su estado, código de retiro y total.",
  async (f) => {
    pedido = (await (await api(CLI2))("POST", "/api/pedidos", { items: [{ codigoProducto: codigoDe("Café con leche"), cantidad: 1 }] })).json;
    await entrarCliente(CLI2);
    await ir("/cliente/pedidos.html");
    await esperar("document.querySelector('.pedido-card')");
    const t = await leer("#lista-pedidos");
    await f();
    return res(t.includes(`#${pedido.idPedido}`) && t.includes("Pendiente"), `El pedido #${pedido.idPedido} aparece como Pendiente con su código.`);
  });

const filaPedido = (id) => `[...document.querySelectorAll('#tabla-pedidos-body tr')].find(r => r.innerText.includes('#${id}'))`;
caso("CP-17", "Atención", "Consultar los pedidos pendientes", "HU-PER-04, RN-NEG-07",
  "Sesión de trabajador y pedidos pendientes.",
  ["Iniciar sesión como trabajador.", "En «Panel de Pedidos» revisar el filtro «Pendientes»."],
  "Se listan los pedidos pendientes y no se muestran sus códigos de retiro.",
  async (f) => {
    await entrarPersonal();
    await esperar(filaPedido(pedido.idPedido));
    const t = await leer("#tabla-pedidos-body");
    const n = Number(sql("select count(*) from pedido where estado = 'pendiente'"));
    const filas = await js("document.querySelectorAll('#tabla-pedidos-body tr').length");
    await verEn("#tabla-pedidos-body", "center");
    await f();
    return res(filas === n && !t.includes(pedido.codigoRetiro), `${filas} pedidos pendientes listados; ningún código visible.`);
  });

caso("CP-18", "Atención", "Iniciar la preparación", "HU-PER-05, RN-NEG-06",
  "Pedido de CP-16 en estado Pendiente.",
  ["En «Pendientes», pulsar «Iniciar preparación» en el pedido."],
  "El pedido pasa a En preparación.",
  async (f) => {
    await entrarPersonal();
    await clic(`[data-accion-pedido="iniciar"][data-id="${pedido.idPedido}"]`);
    await pausa(1200);
    const m = await avisos();
    await filtroPedidos("count-preparacion");
    await verEn("#tabla-pedidos-body", "center");
    await f();
    const e = sql(`select estado from pedido where id_pedido = ${pedido.idPedido}`);
    return res(e === "en_preparacion", `Estado en la base: ${e}. Aviso: «${m}»`);
  });

caso("CP-19", "Atención", "Marcar el pedido como listo", "HU-PER-06, RN-NEG-06",
  "Pedido en estado En preparación.",
  ["Abrir el filtro «En preparación».", "Pulsar «Marcar listo»."],
  "El pedido pasa a Listo para retirar.",
  async (f) => {
    await entrarPersonal();
    await filtroPedidos("count-preparacion");
    await clic(`[data-accion-pedido="listo"][data-id="${pedido.idPedido}"]`);
    await pausa(1200);
    const m = await avisos();
    await filtroPedidos("count-listo");
    await verEn("#tabla-pedidos-body", "center");
    await f();
    const e = sql(`select estado from pedido where id_pedido = ${pedido.idPedido}`);
    return res(e === "listo", `Estado en la base: ${e}. Aviso: «${m}»`);
  });

caso("CP-20", "Seguimiento", "El cliente ve que su pedido está listo", "HU-CLI-06",
  "Pedido en estado Listo para retirar.",
  ["Iniciar sesión como el cliente del pedido.", "Abrir «Mis pedidos»."],
  "El pedido se muestra como Listo para retirar con la indicación de acercarse al mostrador.",
  async (f) => {
    await entrarCliente(CLI2);
    await ir("/cliente/pedidos.html");
    await esperar("document.querySelector('.pedido-card')");
    const t = await leer("#lista-pedidos");
    await f();
    return res(/está listo/i.test(t), `El pedido #${pedido.idPedido} indica que está listo para retirar.`);
  });

async function prepararRetiro(codigo) {
  await entrarPersonal();
  await pestana("tab-retiro");
  await esperar(`document.querySelector('#select-pedido-listo option[value="${pedido.idPedido}"]')`);
  await escribir("#select-pedido-listo", pedido.idPedido);
  await pausa(700);
  await escribir("#input-codigo-retiro", codigo);
}
caso("CP-21", "Entrega", "Entregar con un código incorrecto", "HU-PER-07, RN-NEG-07",
  "Pedido en estado Listo para retirar.",
  ["Abrir «Validar Código de Retiro» y elegir el pedido.", "Escribir el código AAAAAA.", "Pulsar «Confirmar entrega»."],
  "No se registra la entrega y se informa que el código no coincide.",
  async (f) => {
    await prepararRetiro("AAAAAA");
    await clic("#btn-confirmar-entrega");
    await pausa(1500);
    const m = await leer("#resultado-retiro");
    await verEn("#resultado-retiro", "center");
    await f();
    const e = sql(`select estado from pedido where id_pedido = ${pedido.idPedido}`);
    return res(e === "listo" && /no coincide/i.test(m), `Estado: ${e}. Mensaje: «${m.slice(0, 90)}»`);
  });

caso("CP-22", "Entrega", "Comprobar el código correcto", "HU-PER-07, RN-NEG-07",
  "Pedido en estado Listo para retirar.",
  ["Elegir el pedido y escribir el código que presenta el cliente.", "Pulsar «Comprobar código»."],
  "Se indica que el código es válido y el estado no cambia.",
  async (f) => {
    await prepararRetiro(pedido.codigoRetiro);
    await clic("#btn-comprobar-codigo");
    await pausa(1500);
    const m = await leer("#resultado-retiro");
    await verEn("#resultado-retiro", "center");
    await f();
    const e = sql(`select estado from pedido where id_pedido = ${pedido.idPedido}`);
    return res(e === "listo" && /válido/i.test(m), `Estado: ${e}. Mensaje: «${m.slice(0, 60)}»`);
  });

caso("CP-23", "Entrega", "Registrar la entrega con el código correcto", "HU-PER-07, RN-NEG-06, RN-NEG-07",
  "Pedido en estado Listo para retirar.",
  ["Elegir el pedido y escribir el código correcto.", "Pulsar «Confirmar entrega»."],
  "El pedido pasa a Entregado.",
  async (f) => {
    await prepararRetiro(pedido.codigoRetiro);
    await clic("#btn-confirmar-entrega");
    await pausa(1200);
    const m = await leer("#resultado-retiro");
    await verEn("#resultado-retiro", "center");
    await f();
    const e = sql(`select estado from pedido where id_pedido = ${pedido.idPedido}`);
    return res(e === "entregado", `Estado: ${e}. Mensaje: «${m}»`);
  });

const verCatalogo = () => verEn("#filtro-menu-texto", "start");
const tarjetaDe = (codigo) => `document.querySelector('.chk-menu-item[value="${codigo}"]')?.closest('.menu-card')`;
async function panelMenu() {
  await entrarPersonal();
  await pestana("tab-menu");
  await esperar("document.querySelector('.menu-card')");
}
caso("CP-24", "Productos", "Registrar un producto nuevo", "HU-PER-01, RU-06",
  "No existe un producto llamado «Limonada de prueba».",
  ["Abrir «Gestión del Menú».", "Escribir nombre «Limonada de prueba», precio 1.50 y tipo Bebida.", "Pulsar «Guardar producto»."],
  "El producto se registra como disponible y aparece en el catálogo.",
  async (f) => {
    await panelMenu();
    await escribir("#prod-nombre", "Limonada de prueba");
    await escribir("#prod-precio", "1.50");
    await escribir("#prod-tipo", "bebida");
    await clic("#btn-guardar-producto");
    await pausa(1500);
    const m = await avisos();
    await escribir("#filtro-menu-texto", "Limonada");
    await verCatalogo();
    await f();
    const d = sql("select disponible from producto where nombre = 'Limonada de prueba'");
    return res(d === "t", `Producto registrado y disponible. Aviso: «${m}»`);
  });

caso("CP-25", "Productos", "Registrar un producto con precio no válido", "HU-PER-01",
  "Sesión de trabajador.",
  ["En «Gestión del Menú», escribir un nombre y el precio 0.", "Pulsar «Guardar producto»."],
  "No se registra el producto y se informa el motivo.",
  async (f) => {
    await panelMenu();
    await escribir("#prod-nombre", "Producto sin precio");
    await escribir("#prod-precio", "0");
    await clic("#btn-guardar-producto");
    await pausa(800);
    const m = (await avisos()) || (await js("document.getElementById('prod-precio').validationMessage"));
    await f();
    const n = sql("select count(*) from producto where nombre = 'Producto sin precio'");
    return res(n === "0" && m, `No se registró. Mensaje: «${m}»`);
  });

caso("CP-26", "Productos", "Cambiar el precio sin alterar pedidos anteriores", "HU-PER-02, RN-NEG-04",
  "Existe el pedido entregado de CP-23.",
  ["Editar «Café con leche», escribir el precio 3.00 y guardar.", "Iniciar sesión como administrador y abrir el detalle del pedido anterior en el historial."],
  "El catálogo muestra $3.00 y el pedido anterior conserva el precio con el que se confirmó.",
  async (f) => {
    const codigo = codigoDe("Café con leche");
    await panelMenu();
    await clic(`button[data-accion-menu="editar"][data-codigo="${codigo}"]`);
    await escribir("#edit-prod-precio", "3.00");
    await clic("#btn-actualizar-producto");
    await pausa(1500);
    await escribir("#filtro-menu-texto", "Café con leche");
    await verCatalogo();
    const catalogo = await js(`${tarjetaDe(codigo)}.innerText`);
    await f("catalogo");
    await entrarPersonal(ADMIN);
    await pestana("tab-historial");
    await escribir("#filtro-historial-id", pedido.idPedido);
    await js("document.getElementById('form-filtrar-historial').requestSubmit()");
    await pausa(1500);
    await js("[...document.querySelectorAll('#tabla-historial-body button')].pop().click()");
    await pausa(1500);
    const d = await leer("#modal-hist-contenido");
    await f("pedido-anterior");
    const previo = `$${Number(pedido.items[0].precioUnitario).toFixed(2)}`;
    return res(catalogo.includes("$3.00") && d.includes(previo) && !d.includes("$3.00"), `Catálogo: $3.00. El pedido #${pedido.idPedido} conserva ${previo}.`);
  });

caso("CP-27", "Productos", "Desactivar un producto", "HU-PER-03, RN-NEG-02",
  "«Té helado» está disponible.",
  ["En «Gestión del Menú», apagar el interruptor de «Té helado».", "Iniciar sesión como cliente y buscar el producto."],
  "El producto queda como No disponible y no aparece al cliente.",
  async (f) => {
    const codigo = codigoDe("Té helado");
    await panelMenu();
    await clic(`input[data-accion-menu="disponibilidad"][data-codigo="${codigo}"]`);
    await pausa(1500);
    await escribir("#filtro-menu-texto", "Té helado");
    await verCatalogo();
    await f("panel");
    await entrarCliente();
    await escribir("#buscar-producto", "Té helado");
    await pausa(600);
    const aparece = await js("Boolean(document.querySelector('.btn-agregar[aria-label*=\"Té helado\"]'))");
    await f("cliente");
    const d = sql(`select disponible from producto where codigo_producto = ${codigo}`);
    sql(`update producto set disponible = true where codigo_producto = ${codigo}`);
    return res(d === "f" && !aparece, `Disponible en la base: ${d === "t" ? "sí" : "no"}; visible para el cliente: ${aparece ? "sí" : "no"}.`);
  });

async function guardarConFiltro(f) {
  reiniciarDisponibilidad();
  const antes = alimentosDisponibles();
  await panelMenu();
  await escribir("#filtro-menu-tipo", "bebida");
  await verCatalogo();
  await f("1-filtro");
  await clic("#btn-armar-menu");
  await pausa(1800);
  await escribir("#filtro-menu-tipo", "alimento");
  await verCatalogo();
  await f("2-alimentos");
  const despues = alimentosDisponibles();
  reiniciarDisponibilidad();
  return res(despues === antes, `Alimentos disponibles antes de guardar: ${antes}; después: ${despues}.`);
}
function reiniciarDisponibilidad() {
  sql("update producto set disponible = (nombre <> 'Pastel de chocolate')");
}
caso("CP-28", "Productos", "Guardar el menú en lote con un filtro activo", "HU-PER-03, RN-NEG-02",
  "Hay bebidas y alimentos disponibles.",
  ["En «Gestión del Menú», elegir el filtro «Bebidas» sin cambiar ninguna casilla.", "Pulsar «Guardar menú seleccionado».", "Cambiar el filtro a «Alimentos» y revisar su disponibilidad."],
  "Los alimentos, ocultos al guardar, conservan su disponibilidad.",
  guardarConFiltro);

caso("CP-29", "Administración", "Crear una cuenta de trabajador", "HU-ADM-01, HU-ADM-02",
  "Sesión de administrador; el correo y la cédula no existen.",
  ["Iniciar sesión como administrador.", "Completar el formulario «Crear cuenta de trabajador» y pulsar «Registrar trabajador».", "Revisar la lista de trabajadores."],
  "La cuenta se crea y aparece en la lista, sin mostrar contraseñas.",
  async (f) => {
    await entrarPersonal(ADMIN);
    const datos = { nombre: "Prueba", apellido: "Mostrador", cedula: cedulaValida("170000950"), correo: "prueba.mostrador@institucion.edu.ec", contrasena: CLAVE_NUEVA, confirmar: CLAVE_NUEVA };
    for (const [k, v] of Object.entries(datos)) await escribir(`#trab-${k}`, v);
    await clic("#btn-guardar-trabajador");
    await pausa(1500);
    const m = await avisos();
    await verEn("#tabla-trabajadores-body", "end");
    await f();
    const t = await leer("#tabla-trabajadores-body");
    return res(t.includes(datos.correo) && !t.includes(CLAVE_NUEVA), `La cuenta aparece en la lista. Aviso: «${m}»`);
  });

caso("CP-30", "Administración", "Crear un trabajador con cédula no válida", "HU-ADM-01",
  "Sesión de administrador.",
  ["Completar el formulario con la cédula 1234567890.", "Pulsar «Registrar trabajador»."],
  "No se crea la cuenta y se informa el error.",
  async (f) => {
    await entrarPersonal(ADMIN);
    const antes = sql("select count(*) from trabajador");
    const datos = { nombre: "Prueba", apellido: "Invalida", cedula: "1234567890", correo: "invalida@institucion.edu.ec", contrasena: CLAVE_NUEVA, confirmar: CLAVE_NUEVA };
    for (const [k, v] of Object.entries(datos)) await escribir(`#trab-${k}`, v);
    await clic("#btn-guardar-trabajador");
    await pausa(900);
    const m = await avisos();
    await f();
    return res(m && sql("select count(*) from trabajador") === antes, `No se creó. Mensaje: «${m}»`);
  });

caso("CP-31", "Administración", "Consultar el historial de un pedido", "HU-ADM-03, RN-NEG-06",
  "Existe el pedido entregado de CP-23.",
  ["Abrir «Historial de Pedidos».", "Escribir el número del pedido y pulsar «Buscar»."],
  "Se muestran los cuatro estados en orden, con fecha y responsable.",
  async (f) => {
    await entrarPersonal(ADMIN);
    await pestana("tab-historial");
    await escribir("#filtro-historial-id", pedido.idPedido);
    await js("document.getElementById('form-filtrar-historial').requestSubmit()");
    await pausa(1500);
    const t = await leer("#tabla-historial-body");
    await verEn("#tabla-historial-body", "center");
    await f();
    const ok = ["Pendiente", "En preparación", "Listo para retirar", "Entregado", "María López"].every((x) => t.includes(x));
    return res(ok, "Aparecen Pendiente, En preparación, Listo para retirar y Entregado, con María López como responsable.");
  });

async function cambiarClave(actual, nueva) {
  await clic("#btn-cambiar-contrasena");
  await escribir("#contrasena-actual", actual);
  await escribir("#contrasena-nueva", nueva);
  await escribir("#contrasena-confirmar", nueva);
  await clic("#btn-guardar-contrasena");
  await pausa(1500);
}
caso("CP-32", "Cuenta", "Cambiar contraseña indicando mal la actual", "HU-USU-01",
  "Sesión de cliente.",
  ["Pulsar «Cambiar contraseña».", "Escribir una contraseña actual incorrecta y una nueva válida.", "Pulsar «Guardar»."],
  "No se cambia la contraseña y se informa el error.",
  async (f) => {
    await entrarCliente("carla.mena@institucion.edu.ec");
    await cambiarClave("incorrecta1", CLAVE_NUEVA);
    const m = await js("document.getElementById('dialogo-contrasena').innerText.split('\\n').filter(l => /incorrecta/i.test(l)).join(' ')");
    await f();
    return res(m, `Mensaje: «${m}»`);
  });

caso("CP-33", "Cuenta", "Cambiar la contraseña e iniciar sesión con la nueva", "HU-USU-01",
  "Sesión de cliente.",
  ["Cambiar la contraseña con los datos correctos.", "Pulsar «Salir».", "Iniciar sesión con la nueva contraseña."],
  "El cambio se acepta y la nueva contraseña permite ingresar.",
  async (f) => {
    await entrarCliente("carla.mena@institucion.edu.ec");
    await cambiarClave(CLAVE, CLAVE_NUEVA);
    await f("cambio");
    await entrarCliente("carla.mena@institucion.edu.ec", CLAVE_NUEVA);
    await f("ingreso");
    return res((await ruta()).endsWith("menu.html"), "Se aceptó el cambio y el inicio de sesión con la nueva contraseña abrió el menú.");
  });

caso("CP-34", "Cuenta", "Cerrar sesión", "HU-USU-02",
  "Sesión de cliente.",
  ["Pulsar «Salir».", "Intentar abrir de nuevo la página del menú."],
  "Se vuelve a la pantalla de acceso y no se puede entrar sin iniciar sesión.",
  async (f) => {
    await entrarCliente();
    await clic("#btn-salir");
    await pausa(1200);
    await ir("/cliente/menu.html");
    await esperar("location.pathname.endsWith('index.html')");
    const p = await ruta();
    await f();
    return res(p.endsWith("index.html"), `Al abrir el menú se redirigió a ${p}.`);
  });

caso("CP-35", "Pedido", "La API rechaza una cantidad decimal", "RN-NEG-01, HU-CLI-04",
  "Sesión de cliente. La interfaz no permite decimales, por lo que la petición se envía a la API.",
  ["Iniciar sesión como cliente.", "Desde la consola del navegador enviar POST /api/pedidos con cantidad 2.9 de «Café americano».", "Abrir «Mis pedidos»."],
  "La petición se rechaza (400) y no se crea ningún pedido.",
  async (f) => {
    await entrarCliente("diego.paredes@institucion.edu.ec");
    const codigo = codigoDe("Café americano");
    const antes = Number(sql("select count(*) from pedido"));
    const r = await js(`fetch('/api/pedidos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"items":[{"codigoProducto":${codigo},"cantidad":2.9}]}' }).then(async x => ({ estado: x.status, cuerpo: await x.json() }))`);
    await ir("/cliente/pedidos.html");
    await js("document.querySelectorAll('details').forEach(d => { d.open = true; })");
    await f();
    const creados = Number(sql("select count(*) from pedido")) - antes;
    const cantidad = r.cuerpo?.items?.[0]?.cantidad;
    return res(r.estado === 400 && creados === 0, `Respuesta ${r.estado}; pedidos creados: ${creados}${cantidad ? `; cantidad registrada: ${cantidad}` : ""}.`);
  });

caso("CP-36", "Registro", "Registrar un correo que no es institucional", "HU-CLI-07",
  "Ninguna.",
  ["Abrir «Crear cuenta».", "Completar datos válidos, pero con un correo @gmail.com.", "Pulsar «Crear cuenta»."],
  "No se crea la cuenta y se pide el correo institucional.",
  async (f) => {
    const antes = sql("select count(*) from usuario");
    await llenarRegistro({ ...registro, cedula: cedulaValida("170000903"), correo: "persona@gmail.com", contrasena: CLAVE_NUEVA, confirmar: CLAVE_NUEVA });
    await clic("#btn-registrar");
    await pausa(1500);
    const e = await erroresRegistro();
    await verEn("#btn-registrar", "end");
    await f();
    return res(/institucional/i.test(e) && sql("select count(*) from usuario") === antes, `No se creó la cuenta. Mensajes: ${e}`);
  });

const ARCHIVO_PERSISTENCIA = join(tmpdir(), "persistencia.json");
caso("CP-37", "Persistencia", "Los pedidos se conservan al reiniciar la aplicación", "RNF-01",
  "Un cliente tiene un pedido registrado.",
  ["Crear un pedido y abrir «Mis pedidos».", "Detener la aplicación y volver a iniciarla.", "Iniciar sesión y abrir «Mis pedidos»."],
  "El pedido sigue registrado con el mismo número, código y total.",
  async (f) => {
    const correo = "elena.cruz@institucion.edu.ec";
    const despues = process.argv.includes("--despues-del-reinicio");
    let p;
    if (despues) p = JSON.parse(readFileSync(ARCHIVO_PERSISTENCIA, "utf8"));
    else {
      p = (await (await api(correo))("POST", "/api/pedidos", { items: [{ codigoProducto: codigoDe("Agua mineral"), cantidad: 4 }] })).json;
      writeFileSync(ARCHIVO_PERSISTENCIA, JSON.stringify(p));
    }
    await entrarCliente(correo);
    await ir("/cliente/pedidos.html");
    await esperar("document.querySelector('.pedido-card')");
    const t = (await leer("#lista-pedidos")).replace(/ /g, "");
    await f(despues ? "despues" : "antes");
    return res(t.includes(`#${p.idPedido}`) && t.includes(p.codigoRetiro),
      `Pedido #${p.idPedido} con código ${p.codigoRetiro} ${despues ? "después" : "antes"} del reinicio.`);
  });

// ---------------------------------------------------------------- ejecución
async function correr(c, etiqueta = "") {
  const capturas = [];
  const f = async (sufijo) => capturas.push(await foto(`${c.id}${etiqueta}${sufijo ? `-${sufijo}` : ""}`));
  let r;
  try {
    r = await c.ejecutar(f);
  } catch (e) {
    await f("error").catch(() => {});
    r = res(false, `Error al ejecutar: ${e.message}`);
  }
  console.log(`${r.ok ? "OK   " : "FALLA"} ${c.id}${etiqueta}  ${r.obtenido}`);
  return { resultado: r.ok ? "Aprobado" : "Fallido", obtenido: r.obtenido, capturas };
}

try {
  // --sin-reinicio conserva los datos (para la prueba de persistencia)
  if (!process.argv.includes("--sin-reinicio")) reiniciarBase();
  const original = sql("select nombre from producto where codigo_producto = 1");
  sql("update producto set nombre = 'Marca local' where codigo_producto = 1");
  const menu = await (await fetch(`${BASE}/api/productos/menu`)).text();
  sql(`update producto set nombre = '${original}' where codigo_producto = 1`);
  if (!menu.includes("Marca local")) throw new Error("La aplicación NO usa la base local. No se ejecuta nada.");
  await conectar();

  const soloArg = process.argv.find((a) => a.startsWith("--solo="));
  const solo = soloArg ? soloArg.slice(7).split(",") : null;
  const resultados = [];
  const inicio = new Date();
  for (const c of casos.filter((x) => !solo || solo.includes(x.id))) {
    const { ejecutar, ...datos } = c;
    if (c.id === "CP-28") {
      // Primera ejecución con el archivo anterior a la corrección; después con la versión actual
      const actual = join(tmpdir(), "trabajador.actual.js");
      copyFileSync(JS_SERVIDO, actual);
      let primera;
      try {
        copyFileSync(JS_ANTERIOR, JS_SERVIDO);
        primera = await correr(c, "-antes");
      } finally {
        copyFileSync(actual, JS_SERVIDO);
      }
      const segunda = await correr(c, "-despues");
      resultados.push({ ...datos, ...primera, reejecucion: segunda });
    } else {
      resultados.push({ ...datos, ...(await correr(c)) });
    }
  }
  writeFileSync(SALIDA, JSON.stringify({ fecha: inicio.toISOString(), resultados }, null, 2));
  const fallidos = resultados.filter((r) => r.resultado === "Fallido");
  console.log(`\nCasos ${resultados.length} | fallidos en la primera ejecución: ${fallidos.map((r) => r.id).join(", ") || "ninguno"}`);
} finally {
  edge.kill();
}
