import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "..", "wa-link.mjs");
const archivo = (texto) => { const f = join(mkdtempSync(join(tmpdir(), "lume-wa-")), "m.txt"); writeFileSync(f, texto); return f; };
const run = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { encoding: "utf8" });

test("imprime el link con el texto del archivo (con BOM y CRLF)", () => {
  const r = run("+598 99 123 456", archivo("﻿Hola, ¿cómo están?\r\nDemo: https://x.pages.dev/?a=1&b=2\r\n"));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), "https://wa.me/59899123456?text=" + encodeURIComponent("Hola, ¿cómo están?\nDemo: https://x.pages.dev/?a=1&b=2"));
});

test("un fijo sale con exit 1 y explica", () => {
  const r = run("2900 1234", archivo("hola"));
  assert.equal(r.status, 1);
  assert.match(r.stderr, /celular/);
});

test("sin argumentos, uso y exit 2", () => {
  assert.equal(run().status, 2);
});
