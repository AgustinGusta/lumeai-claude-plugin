#!/usr/bin/env node
// Barrido ordenado de prospectos: casillas rubro × rectángulo del mapa en
// cobertura.csv, y comercios ya mirados y descartados en descartados.csv.
// Sin dependencias.
//
// Uso (<carpeta> = la de prospectos web, con _config.md y pipeline.csv):
//   node cobertura.mjs <carpeta> siguiente
//   node cobertura.mjs <carpeta> partir <id>
//   node cobertura.mjs <carpeta> cerrar <id> [resultados=n con_web=n sin_web_buena=n candidatos=n descartados=n consultas=n] [nombre="..."]
//   node cobertura.mjs <carpeta> filtrar <places.json> [--salida filtrado.json]
//   node cobertura.mjs <carpeta> descartar <place_id|dominio> empresa="..." rubro=... casilla=... motivo=... [detalle="..."]
//   node cobertura.mjs <carpeta> descartar --lote <descartes.json>
//   node cobertura.mjs <carpeta> estado
//
// Los rubros (en orden, con sus consultas) y el rectángulo inicial salen de
// _config.md → "## Barrido". Una casilla que devuelve 60 comercios (el máximo
// de Maps) está saturada: se parte en 4 cuadrantes (no, ne, so, se).

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  dominio, escribirCsv, hoy, leerCsv, parseRect, partirRect, placeIdDe, rectTexto,
} from "./prospectos-comun.mjs";

const COLS = [
  "id", "rubro", "consulta", "rect", "nombre", "estado", "fecha",
  "resultados", "con_web", "sin_web_buena", "candidatos", "descartados", "consultas",
];
const NUMEROS = COLS.slice(7);
const COLS_DESC = ["place_id", "dominio", "empresa", "rubro", "casilla", "motivo", "detalle", "fecha"];
const MOTIVOS = ["cadena", "web-buena", "sin-contenido", "caida", "sin-instagram", "tiene-web", "otro"];
const CUADRANTES = ["no", "ne", "so", "se"];

const [dir, cmd, ...rest] = process.argv.slice(2);
if (!dir || !cmd) {
  console.error("Uso: node cobertura.mjs <carpeta> siguiente|partir|cerrar|filtrar|descartar|estado ...");
  process.exit(2);
}
const P = {
  config: join(dir, "_config.md"),
  cobertura: join(dir, "cobertura.csv"),
  descartados: join(dir, "descartados.csv"),
  pipeline: join(dir, "pipeline.csv"),
};
const fallar = (msg, code = 2) => { console.error(msg); process.exit(code); };

// ── _config.md → ## Barrido ────────────────────────────────────────────────
//   - Zona inicial: mvd (Montevideo) = -34.94,-56.44,-34.70,-56.02
//     1. ferreterias: ferretería | pinturería
function leerConfig() {
  if (!existsSync(P.config)) fallar(`No encuentro ${P.config}.`);
  const texto = readFileSync(P.config, "utf8").replace(/\r\n/g, "\n");
  const sec = /^## Barrido[ \t]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(texto)?.[1];
  if (sec === undefined) fallar(`Falta la sección "## Barrido" en ${P.config} (zona inicial y lista de rubros).`);
  const z = /Zona inicial:[ \t]*([a-z0-9-]+)[ \t]*\(([^)]+)\)[ \t]*=[ \t]*([^\n]+)/.exec(sec);
  if (!z) fallar('Falta "- Zona inicial: <clave> (<nombre>) = sur,oeste,norte,este" en "## Barrido".');
  let rect;
  try { rect = parseRect(z[3].trim()); } catch (e) { fallar(e.message); }
  const rubros = [...sec.matchAll(/^\s*\d+\.\s+([a-z0-9-]+):\s*(.+)$/gm)].map((m) => ({
    rubro: m[1],
    consultas: m[2].split("|").map((c) => c.trim()).filter(Boolean),
  }));
  if (!rubros.length) fallar('No hay rubros en "## Barrido" (líneas "1. ferreterias: ferretería | pinturería").');
  return { zona: z[1], zonaNombre: z[2].trim(), rect, rubros };
}

const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const cmpId = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const archivoDe = (id) => id.replaceAll("/", "__");

const cargarCob = () => leerCsv(P.cobertura).filas;
const guardarCob = (filas) => escribirCsv(P.cobertura, COLS, filas);
function buscar(filas, id) {
  const c = filas.find((x) => x.id === id);
  if (!c) fallar(`No existe la casilla ${id}.`);
  return c;
}

// Primera casilla pendiente en el orden de _config.md (rubros, consultas y,
// dentro de cada consulta, cuadrantes en profundidad). Si el rubro en curso
// no empezó, devuelve también sus casillas raíz, que hay que crear.
function proxima(filas, cfg) {
  for (const { rubro, consultas } of cfg.rubros) {
    const nuevas = consultas
      .map((consulta) => ({
        id: `${rubro}/${slug(consulta)}/${cfg.zona}`, rubro, consulta,
        rect: rectTexto(cfg.rect), nombre: cfg.zonaNombre, estado: "pendiente",
      }))
      .filter((n) => !filas.some((c) => c.id === n.id));
    const orden = consultas.map(slug);
    const pend = [...filas, ...nuevas]
      .filter((c) => c.rubro === rubro && c.estado === "pendiente")
      .sort((a, b) => orden.indexOf(a.id.split("/")[1]) - orden.indexOf(b.id.split("/")[1]) || cmpId(a.id, b.id));
    if (pend.length) return { casilla: pend[0], nuevas };
  }
  return { casilla: null, nuevas: [] };
}

const sumar = (filas, campo) => filas.reduce((s, c) => s + (Number(c[campo]) || 0), 0);

switch (cmd) {
  case "siguiente": {
    const cfg = leerConfig();
    const filas = cargarCob();
    const { casilla, nuevas } = proxima(filas, cfg);
    if (!casilla) fallar(`Primera vuelta de ${cfg.zonaNombre} terminada: no quedan casillas pendientes.`, 1);
    if (nuevas.length) guardarCob([...filas, ...nuevas]);
    console.log(JSON.stringify({ ...casilla, archivo: archivoDe(casilla.id) }, null, 2));
    break;
  }
  case "partir": {
    const filas = cargarCob();
    const c = buscar(filas, rest[0]);
    if (c.estado === "partida") fallar(`${c.id} ya está partida.`);
    const q = partirRect(parseRect(c.rect));
    const base = c.nombre.replace(/\s*\([^)]*\)$/, "");
    for (const k of CUADRANTES) {
      const id = `${c.id}.${k}`;
      if (!filas.some((x) => x.id === id)) {
        filas.push({ id, rubro: c.rubro, consulta: c.consulta, rect: rectTexto(q[k]), nombre: `${base} › ${k.toUpperCase()}`, estado: "pendiente" });
      }
    }
    c.estado = "partida";
    c.fecha = hoy();
    guardarCob(filas);
    console.log(`${c.id} partida en 4: ${CUADRANTES.map((k) => `${c.id}.${k}`).join(", ")}`);
    break;
  }
  case "cerrar": {
    const [id, ...pares] = rest;
    const filas = cargarCob();
    const c = buscar(filas, id);
    const patch = {};
    for (const p of pares) {
      const k = p.slice(0, p.indexOf("="));
      const v = p.slice(p.indexOf("=") + 1);
      if (k !== "nombre" && !NUMEROS.includes(k)) fallar(`Campo desconocido: ${k}. Válidos: nombre, ${NUMEROS.join(", ")}`);
      if (NUMEROS.includes(k) && !/^\d+$/.test(v)) fallar(`${k} tiene que ser un número entero: ${v}`);
      patch[k] = v;
    }
    Object.assign(c, patch);
    if (c.estado === "pendiente") c.estado = "barrida";
    c.fecha = hoy();
    guardarCob(filas);
    console.log(JSON.stringify(c, null, 2));
    break;
  }
  case "estado": {
    const cfg = leerConfig();
    const filas = cargarCob();
    console.log("Rubro | casillas | candidatos | descartados | consultas");
    for (const { rubro } of cfg.rubros) {
      const cas = filas.filter((c) => c.rubro === rubro);
      if (!cas.length) { console.log(`${rubro} | sin empezar`); continue; }
      const hechas = cas.filter((c) => c.estado !== "pendiente").length;
      console.log(`${rubro} | ${hechas}/${cas.length} casillas | ${sumar(cas, "candidatos")} candidatos | ${sumar(cas, "descartados")} descartados | ${sumar(cas, "consultas")} consultas`);
    }
    const { casilla } = proxima(filas, cfg);
    console.log(casilla ? `Próxima: ${casilla.id} (${casilla.nombre})` : `Primera vuelta de ${cfg.zonaNombre} terminada.`);
    break;
  }
  default:
    fallar(`Comando desconocido: ${cmd}`);
}
