#!/usr/bin/env node
// Guarda el mail de la demo como BORRADOR en la casilla de Lume, por IMAP (no envía nada).
// Sirve para casillas en un hosting propio (Dovecot/cPanel), donde no hay API de Outlook/Gmail:
// el borrador aparece en la carpeta Borradores del webmail y de cualquier app con esa casilla.
//
// Uso:
//   node crear-borrador.mjs --para <mail> --asunto "<asunto>" --cuerpo <cuerpo.txt> [--imagen <jpg|png>]
//                           [--desde lume@lumeai.uy] [--nombre "Lume"] [--cc <mail>]
//                           [--firma <firma.html>] [--eml <salida.eml>]
//
// <cuerpo.txt>: texto plano, párrafos separados por una línea en blanco (los saltos simples se
// unen, así sirve el texto de mail.md cortado a mano). Las URL se vuelven links.
// --imagen: va pegada en el cuerpo, debajo del primer párrafo con un link (la demo).
// --firma: HTML que va al final del cuerpo. Sus <img src="archivo.png"> relativos se adjuntan
//   dentro del mail (cid), así se ven en Gmail/Outlook. Versión texto: <firma>.txt al lado, si existe.
// --eml: solo escribe el mensaje en ese archivo, sin conectarse (para revisarlo).
//
// Credenciales por variables de entorno (nunca en archivos: este repo es público):
//   LUME_IMAP_PASS (obligatoria), LUME_IMAP_USER (default: --desde), LUME_IMAP_HOST (default:
//   mail.<dominio de --desde>), LUME_IMAP_PORT (default 993, TLS).
// Salida: 0 OK · 1 error de IMAP · 2 uso incorrecto · 3 falta la contraseña.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import tls from "node:tls";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d;
};
const para = opt("--para");
const asunto = opt("--asunto");
const cuerpoPath = opt("--cuerpo");
const imagenPath = opt("--imagen");
const desde = opt("--desde", "lume@lumeai.uy");
const nombre = opt("--nombre", "Lume");
const cc = opt("--cc");
const firmaPath = opt("--firma");
const emlPath = opt("--eml");

if (!para || !asunto || !cuerpoPath) {
  console.error('Uso: node crear-borrador.mjs --para <mail> --asunto "<asunto>" --cuerpo <cuerpo.txt> [--imagen <jpg|png>] [--desde <mail>] [--nombre "<nombre>"] [--cc <mail>] [--firma <firma.html>] [--eml <salida.eml>]');
  process.exit(2);
}
const TIPOS = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

// ---------- Mensaje MIME ----------
const b64 = (s) => Buffer.from(s, "utf8").toString("base64");
const envolver = (s) => s.replace(/(.{76})/g, "$1\r\n");
const encabezado = (s) => (/^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${b64(s)}?=`);
const escaparHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const URL_RE = /https?:\/\/[^\s)]+/g;

const parrafos = readFileSync(cuerpoPath, "utf8")
  .replace(/\r\n/g, "\n")
  .split(/\n\s*\n/)
  .map((p) => p.trim().replace(/\s*\n\s*/g, " ")) // un párrafo = una línea (los .md vienen cortados a mano)
  .filter(Boolean);
if (!parrafos.length) {
  console.error(`${cuerpoPath} está vacío.`);
  process.exit(2);
}

// Imágenes pegadas en el cuerpo (multipart/related): la del antes/después y las de la firma.
const inline = [];
const agregarInline = (ruta) => {
  const tipo = TIPOS[extname(ruta).toLowerCase()];
  if (!tipo) {
    console.error(`${ruta}: las imágenes tienen que ser .jpg o .png`);
    process.exit(2);
  }
  const id = `${basename(ruta, extname(ruta))}-${randomUUID()}@lume`;
  inline.push({ ruta, tipo, id });
  return id;
};

const cid = imagenPath ? agregarInline(imagenPath) : null;
const indiceImagen = imagenPath ? Math.max(0, parrafos.findIndex((p) => /https?:\/\//.test(p))) : -1;

let firmaHtml = "";
let firmaTexto = "";
if (firmaPath) {
  firmaHtml = readFileSync(firmaPath, "utf8").replace(/(<img\b[^>]*\bsrc=)(["'])(?!cid:|https?:|data:)([^"']+)\2/gi, (_, pre, q, src) =>
    `${pre}${q}cid:${agregarInline(resolve(dirname(firmaPath), src))}${q}`);
  const txt = firmaPath.replace(/\.html?$/i, ".txt");
  firmaTexto = existsSync(txt)
    ? readFileSync(txt, "utf8").replace(/\r\n/g, "\n").trim()
    : firmaHtml.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
}

const html = [
  '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a">',
  ...parrafos.map((p, i) => {
    const linea = escaparHtml(p).replace(URL_RE, (u) => `<a href="${u}">${u}</a>`);
    const img =
      i === indiceImagen
        ? `\n<p><img src="cid:${cid}" alt="Antes y después de la web" style="max-width:100%;height:auto;border:1px solid #ddd"></p>`
        : "";
    return `<p style="margin:0 0 14px">${linea}</p>${img}`;
  }),
  ...(firmaHtml ? [`<div style="margin-top:24px">${firmaHtml}</div>`] : []),
  "</div>",
].join("\n");
const texto = parrafos.join("\n\n") + (firmaTexto ? `\n\n-- \n${firmaTexto}` : "");

const frontera = (t) => `=_lume_${t}_${randomUUID().slice(0, 8)}`;
const fAlt = frontera("alt");
const parteTexto = [`Content-Type: text/plain; charset=UTF-8`, `Content-Transfer-Encoding: base64`, "", envolver(b64(texto))].join("\r\n");
const parteHtml = [`Content-Type: text/html; charset=UTF-8`, `Content-Transfer-Encoding: base64`, "", envolver(b64(html))].join("\r\n");

let parteVisual = parteHtml;
if (inline.length) {
  const fRel = frontera("rel");
  parteVisual = [
    `Content-Type: multipart/related; boundary="${fRel}"; type="text/html"`,
    "",
    `--${fRel}`,
    parteHtml,
    ...inline.flatMap(({ ruta, tipo, id }) => {
      const archivo = basename(ruta);
      return [
        `--${fRel}`,
        `Content-Type: ${tipo}; name="${archivo}"`,
        `Content-Transfer-Encoding: base64`,
        `Content-ID: <${id}>`,
        `Content-Disposition: inline; filename="${archivo}"`,
        "",
        envolver(readFileSync(ruta).toString("base64")),
      ];
    }),
    `--${fRel}--`,
  ].join("\r\n");
}

const dominio = desde.split("@")[1];
const messageId = `<${randomUUID()}@${dominio}>`;
const mensaje = [
  `From: ${encabezado(nombre)} <${desde}>`,
  `To: ${para}`,
  ...(cc ? [`Cc: ${cc}`] : []),
  `Subject: ${encabezado(asunto)}`,
  `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
  `Message-ID: ${messageId}`,
  `MIME-Version: 1.0`,
  `Content-Type: multipart/alternative; boundary="${fAlt}"`,
  "",
  `--${fAlt}`,
  parteTexto,
  `--${fAlt}`,
  parteVisual,
  `--${fAlt}--`,
  "",
].join("\r\n");

if (emlPath) {
  writeFileSync(emlPath, mensaje);
  console.log(`Mensaje escrito en ${emlPath} (${Buffer.byteLength(mensaje)} bytes). No se conectó a IMAP.`);
  process.exit(0);
}

// ---------- IMAP ----------
const pass = process.env.LUME_IMAP_PASS;
if (!pass) {
  console.error("Falta LUME_IMAP_PASS en el entorno (la contraseña de la casilla, con setx desde un PowerShell aparte). Sin ella, el mail queda en mail.md para copiar y pegar.");
  process.exit(3);
}
const usuario = process.env.LUME_IMAP_USER || desde;
const host = process.env.LUME_IMAP_HOST || `mail.${dominio}`;
const port = Number(process.env.LUME_IMAP_PORT || 993);

const socket = tls.connect({ host, port, servername: host });
socket.setTimeout(30000, () => socket.destroy(new Error("timeout de IMAP")));
let buffer = "";
let espera = null; // { tag, resolve, reject, continuar }
socket.on("data", (d) => {
  buffer += d.toString("utf8");
  if (!espera) return;
  if (espera.continuar && /^\+ /m.test(buffer)) {
    const c = espera.continuar;
    espera.continuar = null;
    buffer = buffer.replace(/^\+ .*\r\n/m, "");
    c();
  }
  const m = buffer.match(new RegExp(`^${espera.tag} (OK|NO|BAD)(.*)$`, "m"));
  if (m) {
    const { resolve, reject } = espera;
    const respuesta = buffer;
    buffer = "";
    espera = null;
    (m[1] === "OK" ? resolve : reject)(m[1] === "OK" ? respuesta : new Error(`${m[1]}${m[2]}`.trim()));
  }
});
socket.on("error", (e) => espera?.reject(e));

let n = 0;
function comando(linea, literal) {
  const tag = `L${++n}`;
  return new Promise((resolve, reject) => {
    espera = { tag, resolve, reject };
    if (literal !== undefined) {
      espera.continuar = () => socket.write(Buffer.concat([literal, Buffer.from("\r\n")]));
      socket.write(`${tag} ${linea} {${literal.length}}\r\n`);
    } else socket.write(`${tag} ${linea}\r\n`);
  });
}
const saludo = () => new Promise((ok, mal) => {
  socket.once("data", () => ok());
  socket.once("error", mal);
});
const comillas = (s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

try {
  await saludo();
  await comando(`AUTHENTICATE PLAIN ${Buffer.from(`\0${usuario}\0${pass}`).toString("base64")}`);
  const lista = await comando('LIST "" "*"');
  const carpetas = [...lista.matchAll(/^\* LIST \(([^)]*)\) (?:"[^"]*"|NIL) (.+)$/gm)].map((m) => ({
    flags: m[1],
    nombre: m[2].trim().replace(/^"(.*)"$/, "$1"),
  }));
  const borradores =
    carpetas.find((c) => /\\Drafts/i.test(c.flags)) ??
    carpetas.find((c) => /^(INBOX[./])?(Drafts|Borradores)$/i.test(c.nombre));
  if (!borradores) throw new Error(`no encontré la carpeta de borradores. Carpetas: ${carpetas.map((c) => c.nombre).join(", ")}`);

  await comando(`APPEND ${comillas(borradores.nombre)} (\\Draft \\Seen)`, Buffer.from(mensaje, "utf8"));
  await comando(`SELECT ${comillas(borradores.nombre)}`);
  const busqueda = await comando(`SEARCH HEADER Message-ID ${comillas(messageId)}`);
  const encontrados = (busqueda.match(/^\* SEARCH ?(.*)$/m)?.[1] ?? "").trim();
  if (!encontrados) throw new Error("el servidor aceptó el borrador pero no lo encuentro en la carpeta");
  await comando("LOGOUT").catch(() => {});
  socket.end();
  console.log(`Borrador guardado en "${borradores.nombre}" de ${usuario}: "${asunto}" → ${para}${cc ? ` (cc ${cc})` : ""}${imagenPath ? ` (con ${basename(imagenPath)} en el cuerpo)` : ""}.`);
  console.log(firmaPath ? "Ya tiene la firma: revisalo y envialo desde el webmail o tu app de correo." : "Revisalo, agregá tu firma y envialo desde el webmail o tu app de correo.");
  process.exit(0);
} catch (e) {
  socket.destroy();
  console.error(`Error de IMAP (${host}:${port}, usuario ${usuario}): ${e.message}`);
  process.exit(1);
}
