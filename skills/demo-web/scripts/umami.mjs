#!/usr/bin/env node
// Alta y consulta de sitios en el Umami de Lume (API v2). Sin dependencias.
//
// Variables de entorno (NUNCA en archivos del repo, que es público):
//   LUME_UMAMI_URL       default https://analytics.lumeai.uy
//   LUME_UMAMI_USER      usuario de Umami
//   LUME_UMAMI_PASSWORD  contraseña de Umami
//
// Uso:
//   node umami.mjs alta "<nombre>" <dominio>        → imprime el websiteId
//   node umami.mjs visitas <websiteId> [AAAA-MM-DD] → visitas desde esa fecha (default: 90 días)
//   node umami.mjs baja <websiteId>

const BASE = (process.env.LUME_UMAMI_URL || "https://analytics.lumeai.uy").replace(/\/$/, "");
const { LUME_UMAMI_USER: user, LUME_UMAMI_PASSWORD: pass } = process.env;
const [cmd, ...args] = process.argv.slice(2);

if (!user || !pass) {
  console.error("Faltan LUME_UMAMI_USER / LUME_UMAMI_PASSWORD en el entorno. Sin eso, seguí sin analytics.");
  process.exit(3);
}

async function api(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → HTTP ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

const { token } = await api("/auth/login", { method: "POST", body: { username: user, password: pass } });
const num = (v) => (typeof v === "object" && v !== null ? v.value : v) ?? 0;

switch (cmd) {
  case "alta": {
    const [name, domain] = args;
    if (!name || !domain) throw new Error('Uso: alta "<nombre>" <dominio>');
    const w = await api("/websites", { method: "POST", token, body: { name, domain } });
    console.log(w.id);
    break;
  }
  case "visitas": {
    const [id, desde] = args;
    const startAt = desde ? Date.parse(`${desde}T00:00:00`) : Date.now() - 90 * 864e5;
    const s = await api(`/websites/${id}/stats?startAt=${startAt}&endAt=${Date.now()}`, { token });
    console.log(JSON.stringify({ desde: new Date(startAt).toISOString().slice(0, 10), visitantes: num(s.visitors), visitas: num(s.visits), paginas: num(s.pageviews) }));
    break;
  }
  case "baja": {
    await api(`/websites/${args[0]}`, { method: "DELETE", token });
    console.log("ok");
    break;
  }
  default:
    console.error("Uso: node umami.mjs alta|visitas|baja ...");
    process.exit(2);
}
