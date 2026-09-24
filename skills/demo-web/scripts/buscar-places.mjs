#!/usr/bin/env node
// Busca comercios en Google Maps (Places API New, Text Search) con su web,
// teléfono y dirección. Sin dependencias.
//
// Uso:
//   node buscar-places.mjs "papelería en Montevideo" [--paginas 3] [--json salida.json] [--urls urls.txt]
//
// Requiere GOOGLE_PLACES_API_KEY (variable de entorno de usuario).
//
// Gasto: pedir websiteUri factura como "Text Search Enterprise", que tiene
// 1.000 consultas gratis por mes. Cada página (hasta 20 comercios) es 1
// consulta. Este script lleva su propio contador mensual y se niega a pasar
// de LUME_PLACES_LIMITE_MES (default 900), además del tope diario que se
// configura en Google Cloud. Así nunca se sale del cupo gratis.
//
// --urls escribe solo los comercios con web propia (sin redes ni
// directorios), listo para evaluar-sitio.mjs --file.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const consulta = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const paginas = Math.min(Number(opt("--paginas") ?? 3), 10);
const key = process.env.GOOGLE_PLACES_API_KEY;

if (!consulta) { console.error('Uso: node buscar-places.mjs "<rubro> en <zona>" [--paginas 3] [--json f] [--urls f]'); process.exit(2); }
if (!key) { console.error("Falta GOOGLE_PLACES_API_KEY en el entorno."); process.exit(3); }

// ── Contador mensual ────────────────────────────────────────────────────────
const LIMITE = Number(process.env.LUME_PLACES_LIMITE_MES ?? 900);
const dir = join(homedir(), ".lume");
const usoPath = join(dir, "places-uso.json");
const hoy = new Date();
const mes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
let uso = existsSync(usoPath) ? JSON.parse(readFileSync(usoPath, "utf8")) : { mes, consultas: 0 };
if (uso.mes !== mes) uso = { mes, consultas: 0 };
const registrar = () => { uso.consultas++; mkdirSync(dir, { recursive: true }); writeFileSync(usoPath, JSON.stringify(uso)); };

// ── Búsqueda ───────────────────────────────────────────────────────────────
const FIELDS = [
  "places.id", "places.displayName", "places.websiteUri", "places.formattedAddress",
  "places.nationalPhoneNumber", "places.rating", "places.userRatingCount",
  "places.businessStatus", "places.googleMapsUri", "nextPageToken",
].join(",");

const places = [];
let pageToken;
for (let p = 0; p < paginas; p++) {
  if (uso.consultas >= LIMITE) {
    console.error(`Tope mensual propio alcanzado (${uso.consultas}/${LIMITE} consultas en ${mes}). Corto para no salir del cupo gratis.`);
    break;
  }
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify({ textQuery: consulta, languageCode: "es", regionCode: "UY", pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
  });
  registrar();
  const j = await res.json();
  if (!res.ok) {
    const msg = j.error?.message ?? JSON.stringify(j).slice(0, 300);
    console.error(`Places API HTTP ${res.status}: ${msg}`);
    if (res.status === 429) console.error("Probablemente se alcanzó el tope diario configurado en Google Cloud: seguí mañana.");
    process.exit(1);
  }
  places.push(...(j.places ?? []));
  pageToken = j.nextPageToken;
  if (!pageToken) break;
}

const NO_PROPIA = /(instagram|facebook|linktr\.ee|wa\.me|whatsapp|mercadolibre|google\.|tiktok|twitter|x\.com|youtube|pedidosya|rappi)/i;
const rows = places
  .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
  .map((p) => ({
    nombre: p.displayName?.text ?? "",
    web: p.websiteUri ?? "",
    webPropia: !!p.websiteUri && !NO_PROPIA.test(p.websiteUri),
    telefono: p.nationalPhoneNumber ?? "",
    direccion: p.formattedAddress ?? "",
    rating: p.rating ?? null,
    resenas: p.userRatingCount ?? 0,
    maps: p.googleMapsUri ?? "",
  }));

const conWeb = rows.filter((r) => r.webPropia);
console.error(`"${consulta}": ${rows.length} comercios · ${conWeb.length} con web propia · ${rows.filter((r) => r.web && !r.webPropia).length} solo redes · ${rows.filter((r) => !r.web).length} sin web`);
console.error(`Consultas usadas este mes: ${uso.consultas}/${LIMITE}`);

const jsonOut = opt("--json");
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(rows, null, 2));
else console.log(JSON.stringify(rows, null, 2));

const urlsOut = opt("--urls");
if (urlsOut) {
  const dominios = new Set();
  const urls = conWeb.map((r) => r.web).filter((u) => {
    const d = new URL(u).hostname.replace(/^www\./, "");
    return !dominios.has(d) && dominios.add(d);
  });
  writeFileSync(urlsOut, urls.join("\n") + "\n");
  console.error(`${urls.length} URLs únicas → ${urlsOut}`);
}
