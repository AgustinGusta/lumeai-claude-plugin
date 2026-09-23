#!/usr/bin/env node
// Chequea el build de una demo ANTES de publicarla. Sin dependencias.
//
// Uso: node verificar-demo.mjs <carpeta-out> "<Nombre de la empresa>" [dominio-actual]
//
// Errores (exit 1): cosas que no pueden salir nunca —la demo indexable por
// Google, sin el aviso de "propuesta de Lume", con placeholders del
// boilerplate o con un formulario que envíe datos de verdad.
// Avisos: cosas a revisar (imágenes rotas, imágenes cargadas desde el sitio
// actual del cliente en vez de copiadas).

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const [out, empresa, dominioActual] = process.argv.slice(2);
if (!out || !empresa) {
  console.error('Uso: node verificar-demo.mjs <carpeta-out> "<Empresa>" [dominio-actual]');
  process.exit(2);
}

const errores = [];
const avisos = [];
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(out);
const htmls = files.filter((f) => f.endsWith(".html"));

if (!htmls.length) errores.push("No hay HTML en la carpeta: ¿corriste el build?");

// 1. No indexable
const robots = join(out, "robots.txt");
if (!existsSync(robots) || !/Disallow:\s*\/\s*$/m.test(readFileSync(robots, "utf8")))
  errores.push("robots.txt no bloquea todo (falta 'Disallow: /')");
const headers = join(out, "_headers");
if (!existsSync(headers) || !/X-Robots-Tag:\s*noindex/i.test(readFileSync(headers, "utf8")))
  errores.push("falta _headers con 'X-Robots-Tag: noindex' (Cloudflare Pages lo lee de la raíz del build)");

const PLACEHOLDERS = [/Empresa Ejemplo/i, /example\.com/i, /Lorem ipsum/i, /Servicio (uno|dos|tres)\b/i, /\+598 99 000 000/, /Calle Ejemplo/i,
  /Frase principal/i, /Descripción breve de la empresa/i, /Qué resuelve este servicio/i, /Descripción de la imagen principal/i, /descripción breve para buscadores/i];

for (const f of htmls) {
  const h = readFileSync(f, "utf8");
  const rel = relative(out, f);
  if (!/<meta[^>]+name="robots"[^>]+noindex/i.test(h)) errores.push(`${rel}: sin <meta name="robots" content="noindex">`);
  if (!/data-lume-demo/.test(h)) errores.push(`${rel}: falta el aviso de demo (elemento con data-lume-demo)`);
  for (const re of PLACEHOLDERS) if (re.test(h)) errores.push(`${rel}: quedó un placeholder del boilerplate (${re.source})`);
  if (/<form\b/i.test(h) && !/data-lume-demo-form/.test(h)) errores.push(`${rel}: hay un <form> sin desactivar (falta data-lume-demo-form)`);

  for (const m of h.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
    const src = m[1];
    if (src.startsWith("/") && !src.startsWith("//")) {
      const p = join(out, decodeURIComponent(src.split(/[?#]/)[0]));
      if (!existsSync(p)) avisos.push(`${rel}: imagen rota ${src}`);
    } else if (dominioActual && src.includes(dominioActual)) {
      avisos.push(`${rel}: imagen cargada desde el sitio actual (${src}); copiala a public/`);
    }
  }
}

const index = join(out, "index.html");
if (existsSync(index) && !readFileSync(index, "utf8").toLowerCase().includes(empresa.toLowerCase()))
  avisos.push(`index.html no menciona "${empresa}"`);

for (const a of [...new Set(avisos)]) console.log(`AVISO  ${a}`);
for (const e of [...new Set(errores)]) console.log(`ERROR  ${e}`);
console.log(errores.length ? `\n${errores.length} error(es): NO publicar.` : `\nOK para publicar (${htmls.length} páginas).`);
process.exit(errores.length ? 1 : 0);
