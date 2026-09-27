import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
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
