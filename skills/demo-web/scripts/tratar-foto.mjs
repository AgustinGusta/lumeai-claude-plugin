#!/usr/bin/env node
// Trata una foto del cliente con los colores de su marca (paso premium de demo-web):
//   duotono: sombras → oscuro, luces → claro     tinte: la foto en gris teñida con el oscuro
//   grano:   la foto original con grano fino (para fotos chicas o viejas)
// Nunca cambia lo que muestra la foto. Uso:
//   node tratar-foto.mjs <entrada> <salida.webp> --modo duotono --oscuro "#1c1850" --claro "#fff36b" [--ancho 1200]
// Los scripts de la skill no tienen dependencias: sharp se carga del node_modules de la demo (cwd)
// o del boilerplate (LUME_BOILERPLATE).
import { createRequire } from "node:module";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const BOILERPLATE = process.env.LUME_BOILERPLATE ?? "C:/Agustin/Lume/04-Herramientas/webb-institucional";

export async function cargarSharp() {
  for (const base of [process.cwd(), BOILERPLATE]) {
    try {
      return createRequire(join(base, "package.json"))("sharp");
    } catch {
      // probar la siguiente ubicación
    }
  }
  throw new Error("No encuentro sharp: corré el script desde una demo con npm install hecho, o definí LUME_BOILERPLATE.");
}

const rgb = (hex) => {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
};

export async function tratarFoto(entrada, salida, { modo, oscuro, claro = "#ffffff", ancho = 1200 }) {
  if (!["duotono", "tinte", "grano"].includes(modo)) throw new Error(`modo inválido: ${modo} (duotono, tinte o grano)`);
  const sharp = await cargarSharp();
  // rotate(): aplica la orientación EXIF (fotos de celular). Nunca agranda una foto chica.
  let img = sharp(entrada).rotate().resize({ width: ancho, withoutEnlargement: true });
  if (modo === "duotono") {
    const [o, c] = [rgb(oscuro), rgb(claro)];
    const { data, info } = await img.clone().grayscale().raw().toBuffer({ resolveWithObject: true });
    const out = Buffer.alloc(info.width * info.height * 3);
    for (let i = 0; i < info.width * info.height; i++) {
      const t = data[i * info.channels] / 255;
      for (let k = 0; k < 3; k++) out[i * 3 + k] = Math.round(o[k] + (c[k] - o[k]) * t);
    }
    img = sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } });
  } else if (modo === "tinte") {
    // Gris en un paso aparte: en sharp, grayscale() se aplica después de tint() y lo anula.
    const [r, g, b] = rgb(oscuro);
    const gris = await img.clone().grayscale().toColourspace("srgb").png().toBuffer();
    img = sharp(gris).tint({ r, g, b });
  } else {
    const { data, info } = await img.clone().png().toBuffer({ resolveWithObject: true });
    const ruido = Buffer.alloc(info.width * info.height * 4);
    for (let i = 0; i < info.width * info.height; i++) {
      const v = Math.random() * 255;
      ruido.set([v, v, v, 18], i * 4);
    }
    img = sharp(data).composite([{ input: ruido, raw: { width: info.width, height: info.height, channels: 4 }, blend: "overlay" }]);
  }
  const info = await img.webp({ quality: 78 }).toFile(salida);
  return { ancho: info.width, alto: info.height };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2);
  const opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
  if (a.length < 2 || !opt("--modo") || !opt("--oscuro")) {
    console.error('Uso: node tratar-foto.mjs <entrada> <salida.webp> --modo duotono|tinte|grano --oscuro "#hex" [--claro "#hex"] [--ancho 1200]');
    process.exit(2);
  }
  const r = await tratarFoto(a[0], a[1], { modo: opt("--modo"), oscuro: opt("--oscuro"), claro: opt("--claro"), ancho: Number(opt("--ancho", "1200")) });
  console.log(`✓ ${a[1]} (${r.ancho}×${r.alto})`);
}
