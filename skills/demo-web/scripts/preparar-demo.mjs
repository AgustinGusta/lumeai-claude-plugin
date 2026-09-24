#!/usr/bin/env node
// Copia el boilerplate a la carpeta de la demo, sin node_modules/.next/out/.git.
//
// Uso: node preparar-demo.mjs <carpeta-boilerplate> <carpeta-destino>
// Falla si el destino ya tiene archivos (para no pisar una demo en curso).

import { cpSync, existsSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";

const [src, dest] = process.argv.slice(2);
if (!src || !dest) {
  console.error("Uso: node preparar-demo.mjs <carpeta-boilerplate> <carpeta-destino>");
  process.exit(2);
}
if (!existsSync(join(src, "package.json"))) {
  console.error(`No parece un boilerplate (falta package.json): ${src}`);
  process.exit(1);
}
if (existsSync(dest) && readdirSync(dest).length) {
  console.error(`El destino ya tiene archivos, no lo piso: ${dest}`);
  process.exit(1);
}

const SKIP = new Set(["node_modules", ".next", "out", ".git", ".vercel", ".wrangler"]);
cpSync(src, dest, {
  recursive: true,
  filter: (p) => !SKIP.has(basename(p)) && !/^\.env(\..+)?$/.test(basename(p)) || basename(p) === ".env.example",
});
console.log(`Boilerplate copiado a ${dest}. Siguiente: npm install && npx next typegen`);
