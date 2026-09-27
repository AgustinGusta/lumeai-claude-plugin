#!/usr/bin/env node
// Pipeline de prospectos web en un CSV (abrible en Excel). Sin dependencias.
// Clave: slug (kebab-case de la empresa). Un prospecto por dominio.
//
// Uso:
//   node pipeline.mjs <csv> list [--estado enviado] [--tipo nueva] [--json]
//   node pipeline.mjs <csv> get <slug>
//   node pipeline.mjs <csv> upsert <slug> campo=valor [campo=valor ...]
//   node pipeline.mjs <csv> existe <url-o-dominio | link de Maps con place_id>   (exit 0 si ya está, 1 si no)
//
// tipo: rediseno (tiene web; default si está vacío) | nueva (sin web).
// canal: mail (default si está vacío) | whatsapp.
// Los "nueva" guardan en url el link canónico de Maps (place_id), que es su clave.
//
// upsert crea el archivo si no existe. Si cambia "estado" y no se pasa
// fecha_estado, se completa con la fecha de hoy.

import { dominio, esLinkMaps, escribirCsv, hoy, leerCsv, placeIdDe } from "./prospectos-comun.mjs";

const COLS = [
  "slug", "empresa", "url", "rubro", "zona", "email", "telefono", "instagram",
  "oportunidad", "motivos", "estado", "fecha_estado", "demo_url", "umami_id",
  "enviado_el", "seguimientos", "notas", "tipo", "canal",
];
const ESTADOS = [
  "candidato", "descartado", "demo-lista", "enviado", "seguimiento-1", "seguimiento-2",
  "respondio", "reunion", "cliente", "perdido", "baja",
];
const TIPOS = ["rediseno", "nueva"];
const CANALES = ["mail", "whatsapp"];
const tipoDe = (it) => it.tipo || "rediseno";

const [csvPath, cmd, ...rest] = process.argv.slice(2);
if (!csvPath || !cmd) {
  console.error("Uso: node pipeline.mjs <csv> list|get|upsert|existe ...");
  process.exit(2);
}

// Columnas del archivo que este script no conoce (de una versión más nueva):
// se conservan al guardar, para no borrar datos en silencio.
let extras = [];

function load() {
  const { header, filas } = leerCsv(csvPath);
  extras = header.filter((h) => h && !COLS.includes(h));
  return filas;
}

function save(items) {
  escribirCsv(csvPath, [...COLS, ...extras], items);
}

const domain = dominio;
const today = hoy;

const items = load();

switch (cmd) {
  case "list": {
    const val = (n) => { const i = rest.indexOf(n); return i >= 0 ? rest[i + 1] : undefined; };
    const estado = val("--estado");
    const tipo = val("--tipo");
    const sel = items.filter((it) => (!estado || it.estado === estado) && (!tipo || tipoDe(it) === tipo));
    if (rest.includes("--json")) console.log(JSON.stringify(sel, null, 2));
    else for (const it of sel) console.log([it.slug, tipoDe(it), it.estado, it.fecha_estado, it.oportunidad, it.url, it.email || it.telefono, it.demo_url].join(" | "));
    break;
  }
  case "get": {
    const it = items.find((x) => x.slug === rest[0]);
    if (!it) { console.error(`No existe ${rest[0]}`); process.exit(1); }
    console.log(JSON.stringify(it, null, 2));
    break;
  }
  case "existe": {
    const q = rest[0] ?? "";
    const pid = placeIdDe(q);
    if (!pid && esLinkMaps(q)) {
      console.error("Ese link de Maps no tiene place_id: buscá el comercio con buscar-places.mjs y usá su mapsId.");
      process.exit(2);
    }
    const it = pid
      ? items.find((x) => placeIdDe(x.url) === pid)
      : items.find((x) => x.url && !placeIdDe(x.url) && domain(x.url) === domain(q));
    if (it) { console.log(`${it.slug} (${it.estado})`); process.exit(0); }
    process.exit(1);
  }
  case "upsert": {
    const [slug, ...pairs] = rest;
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) { console.error("slug inválido (kebab-case)"); process.exit(2); }
    const patch = {};
    for (const p of pairs) {
      const k = p.slice(0, p.indexOf("="));
      if (!COLS.includes(k)) { console.error(`Campo desconocido: ${k}. Válidos: ${COLS.join(", ")}`); process.exit(2); }
      patch[k] = p.slice(p.indexOf("=") + 1);
    }
    if (patch.estado && !ESTADOS.includes(patch.estado)) {
      console.error(`Estado inválido: ${patch.estado}. Válidos: ${ESTADOS.join(", ")}`); process.exit(2);
    }
    if (patch.tipo && !TIPOS.includes(patch.tipo)) {
      console.error(`Tipo inválido: ${patch.tipo}. Válidos: ${TIPOS.join(", ")}`); process.exit(2);
    }
    if (patch.canal && !CANALES.includes(patch.canal)) {
      console.error(`Canal inválido: ${patch.canal}. Válidos: ${CANALES.join(", ")}`); process.exit(2);
    }
    let it = items.find((x) => x.slug === slug);
    if (!it) {
      it = { slug, estado: "candidato", fecha_estado: today() };
      items.push(it);
    }
    const tipoFinal = patch.tipo ?? it.tipo;
    const urlFinal = patch.url ?? it.url ?? "";
    if (tipoFinal === "nueva" && urlFinal && !placeIdDe(urlFinal)) {
      console.error("Un prospecto tipo=nueva lleva en url su link de Maps con place_id (el mapsId de buscar-places.mjs).");
      process.exit(2);
    }
    if (patch.estado && patch.estado !== it.estado && !patch.fecha_estado) patch.fecha_estado = today();
    Object.assign(it, patch);
    save(items);
    console.log(JSON.stringify(it, null, 2));
    break;
  }
  default:
    console.error(`Comando desconocido: ${cmd}`);
    process.exit(2);
}
