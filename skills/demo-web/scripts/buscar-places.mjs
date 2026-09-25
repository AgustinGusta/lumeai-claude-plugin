#!/usr/bin/env node
// Busca comercios en Google Maps (Places API New, Text Search) con su web,
// teléfono y dirección. Sin dependencias.
//
// Uso:
//   node buscar-places.mjs "papelería en Montevideo" [--paginas 3] [--json salida.json] [--urls urls.txt]
//                          [--sin-web sin-web.json] [--nota-min 4.3] [--resenas-min 30]
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
//
// --sin-web escribe los comercios sin web propia (sin web o solo redes) que
// pasan los umbrales de nota y reseñas y tienen celular (WhatsApp), con su
// puntajeBase y su link canónico de Maps (mapsId). Sale de la misma búsqueda:
// no gasta consultas extra.

import { writeFileSync } from "node:fs";
import { aFila, contador, filtrarSinWeb } from "./prospectos-comun.mjs";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const consulta = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const paginas = Math.min(Number(opt("--paginas") ?? 3), 10);
const key = process.env.GOOGLE_PLACES_API_KEY;

if (!consulta) { console.error('Uso: node buscar-places.mjs "<rubro> en <zona>" [--paginas 3] [--json f] [--urls f] [--sin-web f]'); process.exit(2); }
if (!key) { console.error("Falta GOOGLE_PLACES_API_KEY en el entorno."); process.exit(3); }

// ── Contador mensual (compartido, ver prospectos-comun.mjs) ────────────────
const uso = contador();

// ── Búsqueda ───────────────────────────────────────────────────────────────
const FIELDS = [
  "places.id", "places.displayName", "places.websiteUri", "places.formattedAddress",
  "places.nationalPhoneNumber", "places.rating", "places.userRatingCount",
  "places.businessStatus", "places.googleMapsUri", "nextPageToken",
].join(",");

const places = [];
let pageToken;
for (let p = 0; p < paginas; p++) {
  if (uso.agotado()) {
    console.error(`Tope mensual propio alcanzado (${uso.consultas}/${uso.limite} consultas en ${uso.mes}). Corto para no salir del cupo gratis.`);
    break;
  }
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
    body: JSON.stringify({ textQuery: consulta, languageCode: "es", regionCode: "UY", pageSize: 20, ...(pageToken ? { pageToken } : {}) }),
  });
  uso.registrar();
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

const rows = places
  .filter((p) => p.businessStatus !== "CLOSED_PERMANENTLY")
  .map(aFila);

const conWeb = rows.filter((r) => r.webPropia);
console.error(`"${consulta}": ${rows.length} comercios · ${conWeb.length} con web propia · ${rows.filter((r) => r.web && !r.webPropia).length} solo redes · ${rows.filter((r) => !r.web).length} sin web`);
console.error(`Consultas usadas este mes: ${uso.consultas}/${uso.limite}`);

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

const sinWebOut = opt("--sin-web");
if (sinWebOut) {
  const sinWeb = filtrarSinWeb(rows, {
    notaMin: Number(opt("--nota-min") ?? 4.3),
    resenasMin: Number(opt("--resenas-min") ?? 30),
  });
  writeFileSync(sinWebOut, JSON.stringify(sinWeb, null, 2));
  console.error(`${sinWeb.length} sin web con buena ficha y celular → ${sinWebOut}`);
}
