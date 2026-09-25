#!/usr/bin/env node
// Trae los datos de la ficha de Google Maps de un comercio sin web (Places API
// New, Text Search): horarios, dirección, coordenadas, teléfono, rubro, nota y
// cantidad de reseñas. Sin dependencias.
//
// Uso:
//   node ficha-places.mjs "<empresa> <zona>" --place-id <id | link de Maps> [--json ficha.json]
//
// No pide fotos ni reseñas: las condiciones de la API no permiten reusarlas
// fuera de Google. En la demo va solo "<nota> en Google · <n> reseñas".
// Confirma que el resultado es el comercio del pipeline (mismo place_id); si
// no aparece, avisa y no escribe nada. Usa el contador mensual compartido
// (1 consulta por corrida). Requiere GOOGLE_PLACES_API_KEY.

import { writeFileSync } from "node:fs";
import { aFicha, contador, placeIdDe } from "./prospectos-comun.mjs";

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const consulta = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const idArg = opt("--place-id");
const placeId = placeIdDe(idArg) ?? idArg;
const key = process.env.GOOGLE_PLACES_API_KEY;

if (!consulta || !placeId) {
  console.error('Uso: node ficha-places.mjs "<empresa> <zona>" --place-id <id | link de Maps> [--json f]');
  process.exit(2);
}
if (!key) { console.error("Falta GOOGLE_PLACES_API_KEY en el entorno."); process.exit(3); }

const uso = contador();
if (uso.agotado()) {
  console.error(`Tope mensual propio alcanzado (${uso.consultas}/${uso.limite} consultas en ${uso.mes}).`);
  process.exit(1);
}

const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.location",
  "places.nationalPhoneNumber", "places.regularOpeningHours", "places.primaryTypeDisplayName",
  "places.rating", "places.userRatingCount", "places.googleMapsUri",
].join(",");

const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
  method: "POST",
  headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
  body: JSON.stringify({ textQuery: consulta, languageCode: "es", regionCode: "UY", pageSize: 5 }),
});
uso.registrar();
const j = await res.json();
if (!res.ok) {
  console.error(`Places API HTTP ${res.status}: ${j.error?.message ?? JSON.stringify(j).slice(0, 300)}`);
  process.exit(1);
}

const p = (j.places ?? []).find((x) => x.id === placeId);
if (!p) {
  const vistos = (j.places ?? []).map((x) => `${x.displayName?.text ?? "?"} (${x.id})`).join("; ") || "ninguno";
  console.error(`No encontré el comercio ${placeId} buscando "${consulta}". Resultados: ${vistos}. No escribo nada: probá con el nombre exacto de la ficha.`);
  process.exit(1);
}

const ficha = aFicha(p);
const out = opt("--json");
if (out) { writeFileSync(out, JSON.stringify(ficha, null, 2)); console.error(`Ficha de ${ficha.nombre} → ${out}`); }
else console.log(JSON.stringify(ficha, null, 2));
console.error(`Consultas usadas este mes: ${uso.consultas}/${uso.limite}`);
