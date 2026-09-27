import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { leerCsv } from "../prospectos-comun.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "cobertura.mjs");
const run = (dir, ...args) => spawnSync(process.execPath, [SCRIPT, dir, ...args], { encoding: "utf8" });

const CONFIG = [
  "# Config", "", "## Barrido", "",
  "- Zona inicial: mvd (Montevideo) = -34.94,-56.44,-34.70,-56.02",
  "- Rubros, en orden:",
  "  1. ferreterias: ferretería | pinturería",
  "  2. opticas: óptica",
  "", "## Otra", "", "1. nada: no", "",
].join("\n");

function carpeta(config = CONFIG) {
  const dir = mkdtempSync(join(tmpdir(), "lume-cobertura-"));
  if (config !== null) writeFileSync(join(dir, "_config.md"), config);
  return dir;
}
const cob = (dir) => leerCsv(join(dir, "cobertura.csv")).filas;
const sig = (dir) => { const r = run(dir, "siguiente"); assert.equal(r.status, 0, r.stderr); return JSON.parse(r.stdout); };

test("siguiente abre el primer rubro con una casilla raíz por consulta, sin leer otras secciones", () => {
  const dir = carpeta();
  const c = sig(dir);
  assert.equal(c.id, "ferreterias/ferreteria/mvd");
  assert.equal(c.consulta, "ferretería");
  assert.equal(c.rect, "-34.94,-56.44,-34.7,-56.02");
  assert.equal(c.nombre, "Montevideo");
  assert.equal(c.archivo, "ferreterias__ferreteria__mvd");
  assert.deepEqual(cob(dir).map((x) => x.id), ["ferreterias/ferreteria/mvd", "ferreterias/pintureria/mvd"]);
  assert.ok(!cob(dir).some((x) => x.rubro === "nada"));
});

test("siguiente dos veces seguidas no duplica ni avanza", () => {
  const dir = carpeta();
  sig(dir);
  assert.equal(sig(dir).id, "ferreterias/ferreteria/mvd");
  assert.equal(cob(dir).length, 2);
});

test("partir crea 4 cuadrantes pendientes y siguiente baja en profundidad", () => {
  const dir = carpeta();
  sig(dir);
  const r = run(dir, "partir", "ferreterias/ferreteria/mvd");
  assert.equal(r.status, 0, r.stderr);
  const filas = cob(dir);
  assert.equal(filas.find((x) => x.id === "ferreterias/ferreteria/mvd").estado, "partida");
  const ne = filas.find((x) => x.id === "ferreterias/ferreteria/mvd.ne");
  assert.equal(ne.rect, "-34.82,-56.23,-34.7,-56.02");
  assert.equal(ne.nombre, "Montevideo › NE");
  assert.equal(ne.estado, "pendiente");
  assert.equal(filas.filter((x) => x.id.startsWith("ferreterias/ferreteria/mvd.")).length, 4);
  assert.equal(sig(dir).id, "ferreterias/ferreteria/mvd.ne");
  assert.equal(run(dir, "partir", "ferreterias/ferreteria/mvd").status, 2);
  assert.equal(run(dir, "partir", "no/existe/mvd").status, 2);
});

test("cerrar marca barrida con números; una partida sigue partida", () => {
  const dir = carpeta();
  sig(dir);
  run(dir, "partir", "ferreterias/ferreteria/mvd");
  const r = run(dir, "cerrar", "ferreterias/ferreteria/mvd", "resultados=60", "candidatos=3", "nombre=Montevideo (Centro, Cordón)");
  assert.equal(r.status, 0, r.stderr);
  const raiz = cob(dir).find((x) => x.id === "ferreterias/ferreteria/mvd");
  assert.equal(raiz.estado, "partida");
  assert.equal(raiz.resultados, "60");
  assert.equal(raiz.nombre, "Montevideo (Centro, Cordón)");
  assert.match(raiz.fecha, /^\d{4}-\d{2}-\d{2}$/);
  run(dir, "cerrar", "ferreterias/ferreteria/mvd.ne", "resultados=12");
  assert.equal(cob(dir).find((x) => x.id === "ferreterias/ferreteria/mvd.ne").estado, "barrida");
  assert.equal(run(dir, "cerrar", "ferreterias/ferreteria/mvd.no", "color=rojo").status, 2);
  assert.equal(run(dir, "cerrar", "ferreterias/ferreteria/mvd.no", "resultados=muchos").status, 2);
});

test("al terminar un rubro pasa a la siguiente consulta, al siguiente rubro y al final avisa", () => {
  const dir = carpeta();
  sig(dir);
  run(dir, "cerrar", "ferreterias/ferreteria/mvd", "resultados=10");
  assert.equal(sig(dir).id, "ferreterias/pintureria/mvd");
  run(dir, "cerrar", "ferreterias/pintureria/mvd", "resultados=5");
  assert.equal(sig(dir).id, "opticas/optica/mvd");
  run(dir, "cerrar", "opticas/optica/mvd", "resultados=7");
  const fin = run(dir, "siguiente");
  assert.equal(fin.status, 1);
  assert.match(fin.stderr, /terminada/);
});

test("estado muestra avance por rubro y la próxima casilla", () => {
  const dir = carpeta();
  sig(dir);
  run(dir, "cerrar", "ferreterias/ferreteria/mvd", "resultados=10", "candidatos=2", "descartados=5", "consultas=1");
  const r = run(dir, "estado");
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /ferreterias \| 1\/2 casillas \| 2 candidatos \| 5 descartados \| 1 consultas/);
  assert.match(r.stdout, /opticas \| sin empezar/);
  assert.match(r.stdout, /Próxima: ferreterias\/pintureria\/mvd/);
  assert.equal(cob(dir).length, 2, "estado no crea casillas");
});

test("sin _config.md o sin sección Barrido: error claro", () => {
  const a = run(carpeta(null), "siguiente");
  assert.equal(a.status, 2);
  assert.match(a.stderr, /_config\.md/);
  const b = run(carpeta("# Config\n\n## Búsqueda\n\n- nada\n"), "siguiente");
  assert.equal(b.status, 2);
  assert.match(b.stderr, /## Barrido/);
});

const PLACES = [
  { id: "P1", nombre: "Ferre en pipeline por dominio", web: "https://www.ferre-uno.com.uy/", webPropia: true },
  { id: "P2", nombre: "Ferre sin web en pipeline", web: "", webPropia: false },
  { id: "P3", nombre: "Descartada por place_id", web: "", webPropia: false },
  { id: "P4", nombre: "Descartada por dominio", web: "http://Ferre-Cuatro.com.uy/contacto", webPropia: true },
  { id: "P5", nombre: "Nueva", web: "https://nueva.com.uy", webPropia: true },
  { id: "P6", nombre: "Solo Instagram", web: "https://instagram.com/ferre", webPropia: false },
];

function conDatos() {
  const dir = carpeta();
  writeFileSync(join(dir, "pipeline.csv"),
    "﻿slug,url\r\nuno,ferre-uno.com.uy\r\ndos,https://www.google.com/maps/place/?q=place_id:P2\r\n");
  writeFileSync(join(dir, "descartados.csv"),
    "﻿place_id,dominio,empresa,rubro,casilla,motivo,detalle,fecha\r\nP3,,X,ferreterias,c,cadena,,2026-09-27\r\n,ferre-cuatro.com.uy,Y,ferreterias,c,web-buena,,2026-09-27\r\n");
  const places = join(dir, "places.json");
  writeFileSync(places, JSON.stringify(PLACES));
  return { dir, places };
}

test("filtrar saca lo que ya está en el pipeline o en descartados (place_id y dominio)", () => {
  const { dir, places } = conDatos();
  const r = run(dir, "filtrar", places);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(JSON.parse(r.stdout).map((x) => x.id), ["P5", "P6"]);
  assert.match(r.stderr, /6 comercios → 2 nuevos \(2 en el pipeline, 2 ya descartados\)/);
  const salida = join(dir, "f.json");
  assert.equal(run(dir, "filtrar", places, "--salida", salida).status, 0);
  assert.equal(JSON.parse(readFileSync(salida, "utf8")).length, 2);
});

test("filtrar sin pipeline ni descartados deja todo", () => {
  const dir = carpeta();
  const places = join(dir, "places.json");
  writeFileSync(places, JSON.stringify(PLACES));
  assert.equal(JSON.parse(run(dir, "filtrar", places).stdout).length, 6);
});

test("descartar por dominio o place_id, normaliza el dominio y no duplica", () => {
  const dir = carpeta();
  const base = ["empresa=Ferre Sol", "rubro=ferreterias", "casilla=ferreterias/ferreteria/mvd", "motivo=web-buena", "detalle=diseño 4/5"];
  assert.equal(run(dir, "descartar", "https://www.FerreSol.com.uy/inicio", ...base).status, 0);
  assert.equal(run(dir, "descartar", "ferresol.com.uy", ...base).status, 0);
  assert.equal(run(dir, "descartar", "ChIJabc123", ...base.slice(0, 3), "motivo=cadena").status, 0);
  const d = leerCsv(join(dir, "descartados.csv")).filas;
  assert.equal(d.length, 2);
  assert.equal(d[0].dominio, "ferresol.com.uy");
  assert.equal(d[0].place_id, "");
  assert.equal(d[1].place_id, "ChIJabc123");
  assert.match(d[0].fecha, /^\d{4}-\d{2}-\d{2}$/);
  const mal = run(dir, "descartar", "x.com.uy", ...base.slice(0, 3), "motivo=feo");
  assert.equal(mal.status, 2);
  assert.match(mal.stderr, /Motivo inválido/);
});

test("descartar --lote agrega varios y saltea los que ya estaban", () => {
  const dir = carpeta();
  const lote = join(dir, "lote.json");
  writeFileSync(lote, JSON.stringify([
    { place_id: "A1", dominio: "https://a.com.uy", empresa: "A", rubro: "ferreterias", casilla: "c", motivo: "web-buena", detalle: "ok" },
    { place_id: "B2", empresa: "B", rubro: "ferreterias", casilla: "c", motivo: "sin-instagram" },
  ]));
  const r = run(dir, "descartar", "--lote", lote);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /2 agregados, 0 ya estaban/);
  assert.match(run(dir, "descartar", "--lote", lote).stdout, /0 agregados, 2 ya estaban/);
  const d = leerCsv(join(dir, "descartados.csv")).filas;
  assert.deepEqual(d.map((x) => [x.place_id, x.dominio]), [["A1", "a.com.uy"], ["B2", ""]]);
});
