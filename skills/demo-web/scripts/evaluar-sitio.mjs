#!/usr/bin/env node
// Evalúa qué tan "floja" está una web para priorizar prospectos.
// Sin dependencias: solo fetch + regex sobre el HTML de la home.
//
// Uso:
//   node evaluar-sitio.mjs https://a.com https://b.com [--psi] [--json salida.json]
//   node evaluar-sitio.mjs --file urls.txt [--psi] [--json salida.json]
//
// --psi  suma los puntajes de PageSpeed Insights (mobile). Requiere la
//        variable de entorno PSI_API_KEY (gratis en Google Cloud); sin key
//        la API responde 429 casi siempre.
//
// Salida: tabla resumida por consola + JSON (stdout o --json) con las señales.
// "oportunidad" va de 0 a 100: más alto = web más floja = mejor prospecto.

import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

let urls = args.filter((a, i) => !a.startsWith("--") && !["--json", "--file"].includes(args[i - 1]));
const file = opt("--file");
if (file) urls.push(...readFileSync(file, "utf8").split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")));
urls = [...new Set(urls.map((u) => (/^https?:\/\//i.test(u) ? u : `http://${u}`)))];

if (!urls.length) {
  console.error("Uso: node evaluar-sitio.mjs <url...> | --file urls.txt [--psi] [--json salida.json]");
  process.exit(1);
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
const THIS_YEAR = new Date().getFullYear();

const PLATFORMS = [
  ["Wix", /static\.wixstatic\.com|wix\.com|_wixCIDX|X-Wix/i],
  ["WordPress", /wp-content|wp-includes|<meta[^>]+generator[^>]+WordPress/i],
  ["Shopify", /cdn\.shopify\.com|Shopify\.theme/i],
  ["Squarespace", /squarespace\.com|static1\.squarespace/i],
  ["Webflow", /webflow\.(com|io)|data-wf-site/i],
  ["Joomla", /<meta[^>]+generator[^>]+Joomla|\/media\/jui\//i],
  ["Drupal", /Drupal\.settings|<meta[^>]+generator[^>]+Drupal|\/sites\/default\/files/i],
  ["GoDaddy Builder", /img1\.wsimg\.com|godaddy/i],
  ["Blogger", /blogger\.com|blogspot\.com/i],
  ["Jimdo", /jimdo/i],
  ["Weebly", /weebly\.com|editmysite\.com/i],
  ["Tiendanube", /tiendanube|nuvemshop/i],
  ["Next.js", /__NEXT_DATA__|\/_next\/static/i],
];

async function fetchHome(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  const t0 = performance.now();
  try {
    const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "user-agent": UA, "accept-language": "es" } });
    const ttfb = Math.round(performance.now() - t0);
    const html = await res.text();
    return { ok: true, status: res.status, finalUrl: res.url, ttfbMs: ttfb, totalMs: Math.round(performance.now() - t0), html, headers: res.headers };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "timeout (20s)" : String(e.cause?.code || e.message) };
  } finally {
    clearTimeout(timer);
  }
}

function signals(page) {
  const h = page.html;
  const meta = (name) => h.match(new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)`, "i"))?.[1] ??
    h.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`, "i"))?.[1];
  const title = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim().replace(/\s+/g, " ") ?? "";
  const years = [...h.matchAll(/(?:©|&copy;|copyright)\s*(?:[^<\d]{0,20})?((?:19|20)\d{2})(?:\s*[-–]\s*((?:19|20)\d{2}))?/gi)]
    .flatMap((m) => [m[1], m[2]]).filter(Boolean).map(Number);
  const jquery = h.match(/jquery[.-]?(\d+\.\d+(?:\.\d+)?)(?:\.min)?\.js/i)?.[1] ?? h.match(/jquery(?:\.min)?\.js\?ver=(\d+\.\d+(?:\.\d+)?)/i)?.[1];
  const imgs = [...h.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const emails = [...new Set([...h.matchAll(/(?:mailto:)?([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/gi)].map((m) => m[1].toLowerCase()))]
    .filter((e) => !/\.(png|jpe?g|gif|webp|svg)$/i.test(e) && !/sentry|wixpress|example\.|domain\.com|email\.com/i.test(e));
  const links = (re) => [...new Set([...h.matchAll(re)].map((m) => m[0]))];

  return {
    https: page.finalUrl.startsWith("https://"),
    status: page.status,
    ttfbMs: page.ttfbMs,
    htmlKb: Math.round(Buffer.byteLength(h) / 1024),
    plataforma: PLATFORMS.find(([, re]) => re.test(h))?.[0] ?? "a medida / desconocida",
    generator: meta("generator") ?? null,
    viewport: /<meta[^>]+name=["']viewport["']/i.test(h),
    title,
    metaDescription: meta("description") ?? null,
    ogImage: !!meta("og:image"),
    lang: h.match(/<html[^>]+lang=["']([^"']+)/i)?.[1] ?? null,
    h1: (h.match(/<h1\b/gi) || []).length,
    jsonLd: /application\/ld\+json/i.test(h),
    favicon: /<link[^>]+rel=["'][^"']*icon/i.test(h),
    anioCopyright: years.length ? Math.max(...years) : null,
    jquery: jquery ?? null,
    legacyTags: (h.match(/<(font|center|marquee|frameset|blink)\b/gi) || []).length,
    flash: /\.swf\b|shockwave-flash/i.test(h),
    tablasLayout: (h.match(/<table\b/gi) || []).length,
    imagenes: imgs.length,
    // alt="" es válido (imagen decorativa): solo cuenta la falta del atributo.
    imagenesSinAlt: imgs.filter((i) => !/\balt\s*=/i.test(i)).length,
    emails,
    whatsapp: links(/https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/[^"'\s<]+/gi).slice(0, 3),
    instagram: links(/https?:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9_.]+/gi).slice(0, 3),
    facebook: links(/https?:\/\/(?:www\.)?facebook\.com\/[A-Za-z0-9_.-]+/gi).slice(0, 3),
  };
}

// Cada problema suma puntos y deja un motivo en lenguaje llano (sirve para el mail).
function score(s, psi) {
  const motivos = [];
  let p = 0;
  const add = (pts, motivo) => { p += pts; motivos.push(motivo); };

  if (!s.https) add(15, "no tiene HTTPS (el navegador la marca como 'no segura')");
  if (!s.viewport) add(20, "no está adaptada a celulares");
  if (s.anioCopyright && s.anioCopyright < THIS_YEAR - 2) add(10, `el pie dice © ${s.anioCopyright}: se ve desactualizada`);
  if (s.jquery && /^1\./.test(s.jquery)) add(8, `usa tecnología vieja (jQuery ${s.jquery})`);
  if (s.flash) add(15, "usa Flash, que ya no funciona en ningún navegador");
  if (s.legacyTags > 0) add(8, "está hecha con HTML de los 2000 (font/center/marquee)");
  if (s.tablasLayout > 3) add(5, "maqueta con tablas: difícil de adaptar a pantallas chicas");
  if (!s.metaDescription) add(6, "no tiene descripción para Google");
  if (!s.title || s.title.length < 10) add(6, "el título de la página es pobre o falta");
  if (s.h1 === 0) add(4, "no tiene un título principal (H1)");
  if (!s.ogImage) add(4, "al compartirla en WhatsApp/redes no muestra imagen");
  if (!s.favicon) add(3, "no tiene ícono en la pestaña del navegador");
  if (s.imagenes > 0 && s.imagenesSinAlt / s.imagenes > 0.5) add(4, "la mayoría de las imágenes no tiene texto alternativo");
  if (s.ttfbMs > 2500) add(8, `tarda ${(s.ttfbMs / 1000).toFixed(1)} s solo en empezar a responder`);
  if (s.htmlKb > 800) add(4, `la home pesa mucho (${s.htmlKb} KB solo de HTML)`);
  if (/Wix|GoDaddy|Jimdo|Weebly|Blogger/.test(s.plataforma)) add(5, `está en ${s.plataforma}: lenta y limitada para crecer`);

  if (psi?.performance != null) {
    if (psi.performance < 50) add(12, `velocidad en celular: ${psi.performance}/100 según Google`);
    else if (psi.performance < 75) add(6, `velocidad en celular: ${psi.performance}/100 según Google`);
    if (psi.seo != null && psi.seo < 80) add(5, `SEO básico: ${psi.seo}/100 según Google`);
    if (psi.accessibility != null && psi.accessibility < 80) add(4, `accesibilidad: ${psi.accessibility}/100 según Google`);
  }
  return { oportunidad: Math.min(100, p), motivos };
}

async function pagespeed(url) {
  const key = process.env.PSI_API_KEY;
  const q = new URLSearchParams({ url, strategy: "mobile" });
  for (const c of ["performance", "seo", "accessibility", "best-practices"]) q.append("category", c);
  if (key) q.set("key", key);
  try {
    const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${q}`);
    if (!res.ok) return { error: `PSI HTTP ${res.status}${key ? "" : " (falta PSI_API_KEY)"}` };
    const j = await res.json();
    const cat = j.lighthouseResult?.categories ?? {};
    const pct = (k) => (cat[k]?.score != null ? Math.round(cat[k].score * 100) : null);
    const aud = j.lighthouseResult?.audits ?? {};
    return {
      performance: pct("performance"),
      seo: pct("seo"),
      accessibility: pct("accessibility"),
      bestPractices: pct("best-practices"),
      lcp: aud["largest-contentful-paint"]?.displayValue ?? null,
      cls: aud["cumulative-layout-shift"]?.displayValue ?? null,
    };
  } catch (e) {
    return { error: String(e.message) };
  }
}

// De a 4 en paralelo: PSI tarda 20-60 s por sitio y en serie se hace eterno.
async function evaluar(url) {
  const page = await fetchHome(url);
  if (!page.ok || page.status >= 400)
    return { url, caida: true, error: page.error ?? `HTTP ${page.status}`, oportunidad: null, motivos: ["el sitio no responde o da error"] };
  const s = signals(page);
  const psi = flag("--psi") ? await pagespeed(page.finalUrl) : undefined;
  return { url, finalUrl: page.finalUrl, ...s, psi, ...score(s, psi) };
}

const results = [];
const cola = [...urls];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cola.length) results.push(await evaluar(cola.shift()));
}));

results.sort((a, b) => (b.oportunidad ?? -1) - (a.oportunidad ?? -1));

for (const r of results) {
  const tag = r.caida ? "CAÍDO" : String(r.oportunidad).padStart(3);
  const psi = r.psi && !r.psi.error ? ` | PSI perf ${r.psi.performance} seo ${r.psi.seo}` : r.psi?.error ? ` | ${r.psi.error}` : "";
  console.error(`${tag}  ${r.url}  [${r.plataforma ?? r.error}]${psi}`);
  for (const m of r.motivos.slice(0, 6)) console.error(`       - ${m}`);
}

const json = JSON.stringify(results, null, 2);
const out = opt("--json");
if (out) writeFileSync(out, json);
else console.log(json);
