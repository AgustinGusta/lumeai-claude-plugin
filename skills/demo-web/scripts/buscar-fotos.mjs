#!/usr/bin/env node
// Fotos de ambientación de Pexels para demos (solo cuando las del cliente no alcanzan).
// Uso: node buscar-fotos.mjs "<consulta>" --dir <carpeta> [--n 6] [--orientacion landscape]
// Requiere PEXELS_API_KEY (variable de entorno; nunca en archivos del repo, que es público).
// Baja la variante large2x (~1600 px) y acumula créditos en <carpeta>/creditos.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const opt = (n, d) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : d;
};
const consulta = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const dir = opt("--dir");
const n = Math.min(Number(opt("--n", 6)) || 6, 30);
const orientacion = opt("--orientacion");
const key = process.env.PEXELS_API_KEY;

if (!consulta || !dir) {
  console.error('Uso: node buscar-fotos.mjs "<consulta>" --dir <carpeta> [--n 6] [--orientacion landscape|portrait|square]');
  process.exit(2);
}
if (!key) {
  console.error("Falta PEXELS_API_KEY en el entorno (clave gratis en pexels.com/api). Sin clave, seguí sin fotos de stock.");
  process.exit(3);
}

const q = new URLSearchParams({ query: consulta, per_page: String(n), locale: "es-ES" });
if (orientacion) q.set("orientation", orientacion);
const res = await fetch(`https://api.pexels.com/v1/search?${q}`, { headers: { Authorization: key } });
if (!res.ok) {
  console.error(`Pexels respondió HTTP ${res.status}`);
  process.exit(1);
}
const { photos = [] } = await res.json();
mkdirSync(dir, { recursive: true });
const credPath = join(dir, "creditos.json");
const creditos = existsSync(credPath) ? JSON.parse(readFileSync(credPath, "utf8")) : [];

for (const f of photos) {
  const archivo = `pexels-${f.id}.jpg`;
  const img = await fetch(f.src.large2x);
  if (!img.ok) {
    console.error(`No se pudo bajar ${f.id} (HTTP ${img.status})`);
    continue;
  }
  writeFileSync(join(dir, archivo), Buffer.from(await img.arrayBuffer()));
  if (!creditos.some((c) => c.id === f.id)) {
    creditos.push({ id: f.id, archivo, fotografo: f.photographer, perfil: f.photographer_url, url: f.url, alt: f.alt, consulta });
  }
  console.log(`${archivo} · ${f.photographer} · ${f.alt}`);
}
writeFileSync(credPath, JSON.stringify(creditos, null, 2));
console.log(`${photos.length} foto(s) en ${dir}. Créditos: ${credPath}. Revisalas antes de usarlas: la búsqueda trae resultados que no corresponden.`);
