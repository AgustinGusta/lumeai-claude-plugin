import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  contador, mapsUrl, placeIdDe, celularUy, waNumero, aFila, puntajeBase,
  filtrarSinWeb, notaTexto, aFicha, waLink, esLinkMaps,
  leerCsv, escribirCsv, dominio, parseRect, rectTexto, partirRect, cuerpoBusqueda, saturada,
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

test("webPropia mira el dominio, no cualquier parte de la URL", () => {
  const f = (web) => aFila({ id: "X", websiteUri: web }).webPropia;
  assert.equal(f("https://relax.com.uy/"), true);
  assert.equal(f("https://maxx.com.uy"), true);
  assert.equal(f("https://www.linex.com.uy/contacto"), true);
  assert.equal(f("https://ferreteria-google.com.uy"), true);
  assert.equal(f("https://www.instagram.com/ferresol/"), false);
  assert.equal(f("https://m.facebook.com/ferresol"), false);
  assert.equal(f("https://x.com/ferresol"), false);
  assert.equal(f("https://sites.google.com/view/ferresol"), false);
  assert.equal(f("https://linktr.ee/ferresol"), false);
  assert.equal(f("https://articulo.mercadolibre.com.uy/MLU-1"), false);
  assert.equal(aFila({ id: "X", websiteUri: "https://notinstagram.com.uy" }).instagram, "");
});

test("placeIdDe acepta query_place_id y rechaza links de Maps sin place_id", () => {
  assert.equal(placeIdDe("https://www.google.com/maps/search/?api=1&query=Ferre&query_place_id=ChIJabc_1-2"), "ChIJabc_1-2");
  assert.equal(placeIdDe("https://maps.google.com/?cid=123"), null);
  assert.equal(placeIdDe("https://maps.app.goo.gl/AbCd"), null);
});

test("esLinkMaps reconoce links de Maps con y sin place_id", () => {
  assert.equal(esLinkMaps("https://maps.google.com/?cid=123"), true);
  assert.equal(esLinkMaps("https://maps.app.goo.gl/AbCd"), true);
  assert.equal(esLinkMaps("https://www.google.com/maps/place/?q=place_id:X"), true);
  assert.equal(esLinkMaps("https://papeleriamontevideo.com.uy/"), false);
  assert.equal(esLinkMaps("papeleriamontevideo.com.uy"), false);
});

test("escribirCsv/leerCsv: ida y vuelta con comas, comillas, saltos de línea y BOM", () => {
  const path = join(mkdtempSync(join(tmpdir(), "lume-csv-")), "x.csv");
  const filas = [
    { id: "a", nombre: "Montevideo › NE (Malvín, Unión)", detalle: "dice \"en construcción\"\ny nada más" },
    { id: "b", nombre: "", detalle: "ñandú" },
  ];
  escribirCsv(path, ["id", "nombre", "detalle"], filas);
  const crudo = readFileSync(path, "utf8");
  assert.ok(crudo.startsWith("﻿id,nombre,detalle\r\n"), JSON.stringify(crudo.slice(0, 30)));
  const leido = leerCsv(path);
  assert.deepEqual(leido.header, ["id", "nombre", "detalle"]);
  assert.deepEqual(leido.filas, filas);
});

test("leerCsv de un archivo que no existe devuelve vacío", () => {
  assert.deepEqual(leerCsv(join(tmpdir(), "no-existe-lume.csv")), { header: [], filas: [] });
});

test("dominio normaliza esquema, www, mayúsculas y ruta", () => {
  assert.equal(dominio("https://www.Ferreteria.com.uy/contacto"), "ferreteria.com.uy");
  assert.equal(dominio("ferreteria.com.uy"), "ferreteria.com.uy");
  assert.equal(dominio("http://ferreteria.com.uy"), "ferreteria.com.uy");
});

test("parseRect valida orden y cantidad", () => {
  assert.deepEqual(parseRect("-34.94,-56.44,-34.70,-56.02"), { sur: -34.94, oeste: -56.44, norte: -34.7, este: -56.02 });
  assert.throws(() => parseRect("-34.94,-56.44,-34.70"), /Rectángulo inválido/);
  assert.throws(() => parseRect("-34.70,-56.44,-34.94,-56.02"), /sur < norte/);
  assert.throws(() => parseRect("a,b,c,d"), /Rectángulo inválido/);
});

test("partirRect da 4 cuadrantes que cubren el original", () => {
  const q = partirRect(parseRect("-34.94,-56.44,-34.70,-56.02"));
  assert.equal(rectTexto(q.no), "-34.82,-56.44,-34.7,-56.23");
  assert.equal(rectTexto(q.ne), "-34.82,-56.23,-34.7,-56.02");
  assert.equal(rectTexto(q.so), "-34.94,-56.44,-34.82,-56.23");
  assert.equal(rectTexto(q.se), "-34.94,-56.23,-34.82,-56.02");
});

test("cuerpoBusqueda agrega locationRestriction solo con rect", () => {
  const sin = cuerpoBusqueda("ferretería");
  assert.equal(sin.textQuery, "ferretería");
  assert.equal(sin.locationRestriction, undefined);
  const con = cuerpoBusqueda("ferretería", { rect: parseRect("-34.94,-56.44,-34.70,-56.02"), pageToken: "T" });
  assert.deepEqual(con.locationRestriction, {
    rectangle: { low: { latitude: -34.94, longitude: -56.44 }, high: { latitude: -34.7, longitude: -56.02 } },
  });
  assert.equal(con.pageToken, "T");
  assert.equal(con.regionCode, "UY");
});

test("saturada: 60 resultados o página sin pedir", () => {
  assert.equal(saturada(60, undefined), true);
  assert.equal(saturada(40, "token"), true);
  assert.equal(saturada(59, undefined), false);
});
