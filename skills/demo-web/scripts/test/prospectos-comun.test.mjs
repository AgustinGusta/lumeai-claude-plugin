import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  contador, mapsUrl, placeIdDe, celularUy, waNumero, aFila, puntajeBase,
  filtrarSinWeb, notaTexto, aFicha, waLink,
} from "../prospectos-comun.mjs";

test("celularUy acepta formatos reales y rechaza fijos", () => {
  assert.equal(celularUy("099 123 456"), "099123456");
  assert.equal(celularUy("+598 99 123 456"), "099123456");
  assert.equal(celularUy("59899123456"), "099123456");
  assert.equal(celularUy("097 355 742 (WhatsApp)"), "097355742");
  assert.equal(celularUy("2900 1234"), null);
  assert.equal(celularUy(""), null);
  assert.equal(celularUy(undefined), null);
});

test("waNumero arma el número internacional sin el 0", () => {
  assert.equal(waNumero("099 123 456"), "59899123456");
  assert.equal(waNumero("2900 1234"), null);
});

test("mapsUrl y placeIdDe son inversas; otras URLs dan null", () => {
  const id = "ChIJa1b2C3d4-_xyz";
  assert.equal(placeIdDe(mapsUrl(id)), id);
  assert.equal(placeIdDe("https://papeleriamontevideo.com.uy/"), null);
  assert.equal(placeIdDe(""), null);
});

test("aFila detecta web propia e Instagram", () => {
  const base = { id: "X1", displayName: { text: "Ferretería Sol" }, rating: 4.7, userRatingCount: 120 };
  const ig = aFila({ ...base, websiteUri: "https://www.instagram.com/ferresol/" });
  assert.equal(ig.webPropia, false);
  assert.equal(ig.instagram, "https://www.instagram.com/ferresol/");
  assert.equal(ig.mapsId, mapsUrl("X1"));
  const propia = aFila({ ...base, websiteUri: "https://ferresol.com.uy" });
  assert.equal(propia.webPropia, true);
  assert.equal(propia.instagram, "");
  const sin = aFila(base);
  assert.equal(sin.web, "");
  assert.equal(sin.webPropia, false);
});

test("puntajeBase: reseñas (log), nota y celular", () => {
  assert.equal(puntajeBase({ rating: 4.7, resenas: 100, telefono: "099 123 456" }), 27 + 21 + 10);
  assert.equal(puntajeBase({ rating: 5, resenas: 300, telefono: "099 123 456" }), 80);
  assert.equal(puntajeBase({ rating: 4.3, resenas: 30, telefono: "2900 1234" }), 13 + 9);
  assert.equal(puntajeBase({ rating: 3.5, resenas: 5, telefono: "" }), 0);
  assert.equal(puntajeBase({ rating: null, resenas: 0, telefono: "" }), 0);
});

test("filtrarSinWeb aplica umbrales, exige celular, excluye web propia y ordena", () => {
  const filas = [
    { nombre: "A", webPropia: false, rating: 4.5, resenas: 40, telefono: "099 111 111" },
    { nombre: "B", webPropia: false, rating: 4.9, resenas: 400, telefono: "098 222 222" },
    { nombre: "C", webPropia: true, rating: 4.9, resenas: 400, telefono: "098 333 333" },
    { nombre: "D", webPropia: false, rating: 4.9, resenas: 400, telefono: "2900 1234" },
    { nombre: "E", webPropia: false, rating: null, resenas: 0, telefono: "099 444 444" },
    { nombre: "F", webPropia: false, rating: 4.2, resenas: 400, telefono: "099 555 555" },
    { nombre: "G", webPropia: false, rating: 4.8, resenas: 29, telefono: "099 666 666" },
  ];
  const r = filtrarSinWeb(filas);
  assert.deepEqual(r.map((f) => f.nombre), ["B", "A"]);
  assert.equal(r[0].celular, "098222222");
  assert.equal(typeof r[0].puntajeBase, "number");
  assert.deepEqual(filtrarSinWeb(filas, { notaMin: 4.0, resenasMin: 10 }).map((f) => f.nombre), ["B", "F", "G", "A"]);
});

test("notaTexto", () => {
  assert.equal(notaTexto(4.7, 120), "4,7 en Google · 120 reseñas");
  assert.equal(notaTexto(5, 1), "5,0 en Google · 1 reseña");
  assert.equal(notaTexto(null, 0), "");
  assert.equal(notaTexto(undefined, 0), "");
});

test("aFicha mapea la ficha sin fotos ni reseñas", () => {
  const f = aFicha({
    id: "X1", displayName: { text: "Ferretería Sol" }, primaryTypeDisplayName: { text: "Ferretería" },
    formattedAddress: "Av. Italia 1234, Montevideo", location: { latitude: -34.9, longitude: -56.1 },
    nationalPhoneNumber: "099 123 456", rating: 4.7, userRatingCount: 120,
    regularOpeningHours: { weekdayDescriptions: ["lunes: 9:00–19:00"] }, googleMapsUri: "https://maps.google.com/?cid=1",
  });
  assert.deepEqual(f, {
    id: "X1", nombre: "Ferretería Sol", rubro: "Ferretería", direccion: "Av. Italia 1234, Montevideo",
    lat: -34.9, lng: -56.1, telefono: "099 123 456", celular: "099123456", whatsapp: "59899123456",
    horarios: ["lunes: 9:00–19:00"], nota: 4.7, resenas: 120, notaTexto: "4,7 en Google · 120 reseñas",
    maps: "https://maps.google.com/?cid=1",
  });
  const vacia = aFicha({ id: "X2" });
  assert.deepEqual(vacia.horarios, []);
  assert.equal(vacia.nota, null);
  assert.equal(vacia.notaTexto, "");
  assert.equal(vacia.maps, mapsUrl("X2"));
});

test("waLink codifica acentos, saltos (CRLF) y el link de la demo", () => {
  const texto = "Hola, ¿cómo están?\r\nLa demo: https://lume-x.pages.dev/?a=1&b=2\r\n";
  const esperado = "https://wa.me/59899123456?text=" +
    encodeURIComponent("Hola, ¿cómo están?\nLa demo: https://lume-x.pages.dev/?a=1&b=2");
  assert.equal(waLink("099 123 456", texto), esperado);
  assert.equal(decodeURIComponent(waLink("099 123 456", texto).split("?text=")[1]),
    "Hola, ¿cómo están?\nLa demo: https://lume-x.pages.dev/?a=1&b=2");
  assert.throws(() => waLink("2900 1234", "hola"), /celular/);
});

test("contador: cuenta, persiste, corta en el límite y reinicia al cambiar de mes", () => {
  const dir = mkdtempSync(join(tmpdir(), "lume-contador-"));
  const sept = new Date(2026, 8, 25);
  const c = contador({ limite: 2, dir, fecha: sept });
  assert.equal(c.mes, "2026-09");
  assert.equal(c.agotado(), false);
  c.registrar(); c.registrar();
  assert.equal(c.agotado(), true);
  assert.equal(contador({ limite: 2, dir, fecha: sept }).consultas, 2);
  assert.equal(contador({ limite: 2, dir, fecha: new Date(2026, 9, 1) }).consultas, 0);
});
