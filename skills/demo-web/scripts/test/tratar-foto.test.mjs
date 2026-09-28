import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { tratarFoto, cargarSharp } from "../tratar-foto.mjs";

const sharp = await cargarSharp();

async function foto(dir) {
  const f = join(dir, "foto.png");
  await sharp({ create: { width: 200, height: 100, channels: 3, background: { r: 128, g: 128, b: 128 } } }).png().toFile(f);
  return f;
}

test("duotono: un gris medio queda entre el oscuro y el claro", async () => {
  const dir = await mkdtemp(join(tmpdir(), "foto-"));
  const r = await tratarFoto(await foto(dir), join(dir, "d.webp"), { modo: "duotono", oscuro: "#000080", claro: "#ffff00", ancho: 100 });
  assert.deepEqual(r, { ancho: 100, alto: 50 });
  const { data } = await sharp(join(dir, "d.webp")).raw().toBuffer({ resolveWithObject: true });
  assert.ok(data[0] > 60 && data[0] < 200, `R=${data[0]}`);
  assert.ok(data[2] > 20 && data[2] < 140, `B=${data[2]}`);
});

test("tinte y grano generan un webp del ancho pedido", async () => {
  const dir = await mkdtemp(join(tmpdir(), "foto-"));
  for (const modo of ["tinte", "grano"]) {
    const r = await tratarFoto(await foto(dir), join(dir, `${modo}.webp`), { modo, oscuro: "#1c1850", ancho: 120 });
    assert.equal(r.ancho, 120);
  }
});

test("modo desconocido falla con mensaje claro", async () => {
  const dir = await mkdtemp(join(tmpdir(), "foto-"));
  await assert.rejects(() => tratarFoto(join(dir, "x.png"), join(dir, "y.webp"), { modo: "sepia", oscuro: "#000" }), /modo/);
});

test("tinte: la foto queda teñida con el color (no gris)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "foto-"));
  const r = await tratarFoto(await foto(dir), join(dir, "t.webp"), { modo: "tinte", oscuro: "#1c1850", ancho: 100 });
  assert.equal(r.ancho, 100);
  const { data, info } = await sharp(join(dir, "t.webp")).raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.channels >= 3, true, `canales=${info.channels}`);
  assert.ok(data[2] > data[0] + 10, `el azul del tinte no aparece: R=${data[0]} B=${data[2]}`);
});

test("respeta la orientación EXIF de las fotos de celular", async () => {
  const dir = await mkdtemp(join(tmpdir(), "foto-"));
  const f = join(dir, "vertical.jpg");
  await sharp({ create: { width: 300, height: 150, channels: 3, background: { r: 128, g: 128, b: 128 } } }).jpeg().withMetadata({ orientation: 6 }).toFile(f);
  const r = await tratarFoto(f, join(dir, "v.webp"), { modo: "duotono", oscuro: "#000080", claro: "#ffff00", ancho: 150 });
  assert.deepEqual(r, { ancho: 150, alto: 300 });
});

test("no agranda fotos más chicas que el ancho pedido", async () => {
  const dir = await mkdtemp(join(tmpdir(), "foto-"));
  const r = await tratarFoto(await foto(dir), join(dir, "g.webp"), { modo: "grano", oscuro: "#1c1850", ancho: 1200 });
  assert.equal(r.ancho, 200);
});
