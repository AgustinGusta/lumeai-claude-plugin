import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mapsUrl } from "../prospectos-comun.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "pipeline.mjs");
const nuevoCsv = () => join(mkdtempSync(join(tmpdir(), "lume-pipeline-")), "pipeline.csv");
const run = (csv, ...args) => spawnSync(process.execPath, [SCRIPT, csv, ...args], { encoding: "utf8" });

const VIEJO =
  "﻿slug,empresa,url,rubro,zona,email,telefono,instagram,oportunidad,motivos,estado,fecha_estado,demo_url,umami_id,enviado_el,seguimientos,notas\r\n" +
  "pamo,Pamo,https://papeleriamontevideo.com.uy/,Papelería,Centro,v@p.uy,097,,46,m,demo-lista,2026-09-24,,,,,\r\n";

test("CSV viejo: se lee, list --tipo rediseno incluye vacíos y al escribir aparecen las columnas", () => {
  const csv = nuevoCsv();
  writeFileSync(csv, VIEJO);
  const l = run(csv, "list", "--tipo", "rediseno", "--json");
  assert.equal(l.status, 0, l.stderr);
  assert.deepEqual(JSON.parse(l.stdout).map((x) => x.slug), ["pamo"]);
  assert.deepEqual(JSON.parse(run(csv, "list", "--tipo", "nueva", "--json").stdout), []);
  assert.equal(run(csv, "upsert", "pamo", "notas=x").status, 0);
  const header = readFileSync(csv, "utf8").replace(/^﻿/, "").split("\r\n")[0];
  assert.ok(header.endsWith(",notas,tipo,canal"), header);
});

test("upsert valida tipo y canal", () => {
  const csv = nuevoCsv();
  assert.equal(run(csv, "upsert", "a", "tipo=nueva", "canal=whatsapp").status, 0);
  const malTipo = run(csv, "upsert", "a", "tipo=web");
  assert.equal(malTipo.status, 2);
  assert.match(malTipo.stderr, /Tipo inválido/);
  const malCanal = run(csv, "upsert", "a", "canal=instagram");
  assert.equal(malCanal.status, 2);
  assert.match(malCanal.stderr, /Canal inválido/);
  assert.equal(JSON.parse(run(csv, "get", "a").stdout).canal, "whatsapp");
});

test("existe distingue comercios de Maps por place_id y no los mezcla con dominios", () => {
  const csv = nuevoCsv();
  run(csv, "upsert", "ferre-sol", `url=${mapsUrl("AAA111")}`, "tipo=nueva");
  run(csv, "upsert", "pamo", "url=https://papeleriamontevideo.com.uy/");
  const mismo = run(csv, "existe", mapsUrl("AAA111"));
  assert.equal(mismo.status, 0);
  assert.match(mismo.stdout, /ferre-sol/);
  assert.equal(run(csv, "existe", mapsUrl("BBB222")).status, 1);
  assert.equal(run(csv, "existe", "https://www.google.com/").status, 1);
  assert.equal(run(csv, "existe", "papeleriamontevideo.com.uy").status, 0);
});

test("list sin --json muestra el tipo", () => {
  const csv = nuevoCsv();
  run(csv, "upsert", "ferre-sol", "tipo=nueva");
  assert.match(run(csv, "list").stdout, /ferre-sol \| nueva \|/);
});
