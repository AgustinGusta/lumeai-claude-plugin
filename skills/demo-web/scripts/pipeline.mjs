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

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { placeIdDe } from "./prospectos-comun.mjs";

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

function parse(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  return rows;
}

const esc = (v) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

function load() {
  if (!existsSync(csvPath)) return [];
  const [header, ...rows] = parse(readFileSync(csvPath, "utf8").replace(/^﻿/, ""));
  return rows.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

function save(items) {
  const lines = [COLS.join(","), ...items.map((it) => COLS.map((c) => esc(String(it[c] ?? ""))).join(","))];
  // BOM para que Excel abra bien los acentos.
  writeFileSync(csvPath, "﻿" + lines.join("\r\n") + "\r\n");
}

const domain = (u) => {
  try { return new URL(/^https?:/i.test(u) ? u : `http://${u}`).hostname.replace(/^www\./, "").toLowerCase(); }
  catch { return u.toLowerCase(); }
};
// Fecha local (no UTC): en Uruguay, después de las 21 h toISOString ya da mañana.
const today = () => new Date().toLocaleDateString("sv-SE");

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
