// Funciones compartidas por los scripts de prospectos web (buscar-places,
// ficha-places, wa-link, pipeline). Sin dependencias.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

// ── Contador mensual de consultas a Places ─────────────────────────────────
// Text Search Enterprise tiene 1.000 consultas gratis por mes. Todos los
// scripts que consultan Places comparten este contador (~/.lume/places-uso.json)
// y se niegan a pasar de LUME_PLACES_LIMITE_MES (default 900).
export function contador({
  limite = Number(process.env.LUME_PLACES_LIMITE_MES ?? 900),
  dir = join(homedir(), ".lume"),
  fecha = new Date(),
} = {}) {
  const path = join(dir, "places-uso.json");
  const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
  let uso = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { mes, consultas: 0 };
  if (uso.mes !== mes) uso = { mes, consultas: 0 };
  return {
    limite,
    mes,
    get consultas() { return uso.consultas; },
    agotado: () => uso.consultas >= limite,
    registrar() {
      uso.consultas++;
      mkdirSync(dir, { recursive: true });
      writeFileSync(path, JSON.stringify(uso));
    },
  };
}

// ── Web, Maps y teléfono ───────────────────────────────────────────────────
// Redes, marketplaces y plataformas: tener solo esto no es "tener web". Se
// compara el dominio, no cualquier parte de la URL ("relax.com.uy" es web propia).
const NO_PROPIAS = [
  "instagram.com", "facebook.com", "fb.com", "linktr.ee", "wa.me", "whatsapp.com", "tiktok.com",
  "twitter.com", "x.com", "youtube.com", "mercadolibre.com", "mercadolibre.com.uy",
  "pedidosya.com", "pedidosya.com.uy", "rappi.com", "rappi.com.uy", "goo.gl",
];
const GOOGLE = /(^|\.)google\.[a-z.]+$/;
const aUrl = (u) => { try { return new URL(/^https?:/i.test(u) ? u : `http://${u}`); } catch { return null; } };
const host = (u) => aUrl(u ?? "")?.hostname.toLowerCase() ?? "";
const enDominio = (h, d) => h === d || h.endsWith("." + d);

export function webPropia(url) {
  const h = host(url);
  return !!h && !GOOGLE.test(h) && !NO_PROPIAS.some((d) => enDominio(h, d));
}

// Link canónico de un comercio en Maps. Es la `url` de los prospectos sin web
// en el pipeline: el googleMapsUri de todos comparte dominio y no sirve de clave.
export const mapsUrl = (id) => `https://www.google.com/maps/place/?q=place_id:${id}`;
export const placeIdDe = (url) => /place_id[:=]([A-Za-z0-9_-]+)/.exec(url ?? "")?.[1] ?? null;

// Link de Google Maps, con o sin place_id (maps.google.*, google.*/maps, maps.app.goo.gl).
export function esLinkMaps(url) {
  const u = aUrl(url ?? "");
  if (!u) return false;
  const h = u.hostname.toLowerCase();
  return /^maps\.google\./.test(h) || h === "maps.app.goo.gl"
    || ((GOOGLE.test(h) || h === "goo.gl") && u.pathname.startsWith("/maps"));
}

// Celular uruguayo (09X XXX XXX), con o sin +598. Los fijos no tienen WhatsApp.
export function celularUy(tel) {
  let d = String(tel ?? "").replace(/\D/g, "");
  if (d.startsWith("598")) d = "0" + d.slice(3);
  return /^09\d{7}$/.test(d) ? d : null;
}
export const waNumero = (tel) => { const c = celularUy(tel); return c ? "598" + c.slice(1) : null; };

export function waLink(tel, texto) {
  const n = waNumero(tel);
  if (!n) throw new Error(`No es un celular uruguayo (no tiene WhatsApp): ${tel}`);
  return `https://wa.me/${n}?text=${encodeURIComponent(String(texto).replace(/\r\n/g, "\n").trim())}`;
}

// ── Filas de búsqueda y ficha ──────────────────────────────────────────────
export function aFila(p) {
  const web = p.websiteUri ?? "";
  return {
    id: p.id ?? "",
    nombre: p.displayName?.text ?? "",
    web,
    webPropia: webPropia(web),
    instagram: enDominio(host(web), "instagram.com") ? web : "",
    telefono: p.nationalPhoneNumber ?? "",
    direccion: p.formattedAddress ?? "",
    rating: p.rating ?? null,
    resenas: p.userRatingCount ?? 0,
    maps: p.googleMapsUri ?? "",
    mapsId: p.id ? mapsUrl(p.id) : "",
  };
}

export const notaTexto = (nota, resenas) =>
  nota == null ? "" : `${nota.toFixed(1).replace(".", ",")} en Google · ${resenas} reseña${resenas === 1 ? "" : "s"}`;

export function aFicha(p) {
  const telefono = p.nationalPhoneNumber ?? "";
  const nota = p.rating ?? null;
  const resenas = p.userRatingCount ?? 0;
  return {
    id: p.id ?? "",
    nombre: p.displayName?.text ?? "",
    rubro: p.primaryTypeDisplayName?.text ?? "",
    direccion: p.formattedAddress ?? "",
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    telefono,
    celular: celularUy(telefono),
    whatsapp: waNumero(telefono),
    horarios: p.regularOpeningHours?.weekdayDescriptions ?? [],
    nota,
    resenas,
    notaTexto: notaTexto(nota, resenas),
    maps: p.googleMapsUri ?? mapsUrl(p.id ?? ""),
  };
}

// ── Puntaje de un comercio sin web ─────────────────────────────────────────
// Reseñas 0-40 (log: 30 → 13, 100 → 27, 300+ → 40), nota 0-30 (4,0 → 0,
// 5,0 → 30) y celular 10. La skill suma 20 si el Instagram está activo.
export function puntajeBase({ rating, resenas, telefono }) {
  const clamp = (v, max) => Math.max(0, Math.min(max, Math.round(v)));
  const r = clamp((40 * Math.log10(Math.max(resenas ?? 0, 1) / 10)) / Math.log10(30), 40);
  const n = rating == null ? 0 : clamp((rating - 4) * 30, 30);
  return r + n + (celularUy(telefono) ? 10 : 0);
}

export function filtrarSinWeb(filas, { notaMin = 4.3, resenasMin = 30 } = {}) {
  return filas
    .filter((f) => !f.webPropia && (f.rating ?? 0) >= notaMin && (f.resenas ?? 0) >= resenasMin && celularUy(f.telefono))
    .map((f) => ({ ...f, celular: celularUy(f.telefono), puntajeBase: puntajeBase(f) }))
    .sort((a, b) => b.puntajeBase - a.puntajeBase);
}
