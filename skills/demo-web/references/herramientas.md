# Herramientas del proceso de demos web (todas gratis)

## Necesarias

| Herramienta | Para qué | Setup (una vez) |
|---|---|---|
| Node 24 | Scripts y build | ya instalado |
| Playwright MCP / Chrome DevTools MCP | Capturas, extracción de textos/colores, Lighthouse | plugins de Claude Code |
| Cloudflare Pages + `wrangler` | Hosting de las demos (gratis, uso comercial permitido) | crear cuenta en dash.cloudflare.com, **verificar el mail de la cuenta** (sin eso la API rechaza crear proyectos) y correr `! npx wrangler login`. Correr `wrangler` siempre desde una carpeta vacía (ver `demo-web` Paso 7). |
| Skills `frontend-design`, `ui-ux-pro-max` | Dirección visual | ya instaladas |

## Recomendadas

| Herramienta | Para qué | Setup |
|---|---|---|
| PageSpeed Insights API | Puntajes de Google (antes/después) para el mail y para priorizar prospectos | Crear API key gratis en console.cloud.google.com → "PageSpeed Insights API" → Credenciales. Guardarla como variable de entorno de usuario `PSI_API_KEY` (Windows: `setx PSI_API_KEY "..."` y reiniciar Claude Code). Sin key, la API devuelve 429. |
| Google Places API (New) | Fuente principal de prospectos: comercios de Google Maps con su web, teléfono y dirección (`buscar-places.mjs`) | En el proyecto de Google Cloud de Lume: habilitar "Places API (New)" (requiere facturación), crear una clave restringida a esa API y guardarla como `GOOGLE_PLACES_API_KEY`. Pedir la web factura como Text Search Enterprise (1.000 gratis/mes). La cuota diaria de Text Search **no es ajustable** en Google Cloud (verificado 2026-09-23), así que la protección es: el contador del script, que corta en 900/mes (`~/.lume/places-uso.json`); un presupuesto de USD 1 con alerta; y la clave restringida a esa API, sin compartir ni pegar en chats (si se filtra, regenerarla). |
| Pexels API | Fotos de ambientación con licencia simple (`buscar-fotos.mjs`) | Clave gratis en pexels.com/api → guardarla como `PEXELS_API_KEY` (`setx` desde un PowerShell aparte). |
| Impeccable (plugin) | Crítica y pulido de diseño; detecta patrones de "web hecha por IA" | Instalado a nivel proyecto en el repo de prospectos: `claude plugin install impeccable@impeccable --scope project`. Trae hooks que corren al editar y al terminar; su primer uso descarga su programa desde GitHub. |
| Umami de Lume (analytics.lumeai.uy) | Saber si el prospecto abrió la demo | Variables de entorno `LUME_UMAMI_USER` y `LUME_UMAMI_PASSWORD` (idealmente un usuario de Umami solo para demos). |
| Context7 MCP | Docs actualizadas de Next.js/Tailwind mientras se programa la demo | `claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp` |

## Opcionales

| Herramienta | Para qué |
|---|---|
| Firecrawl MCP (tier gratis con API key) | Bajar sitios grandes a markdown de una. Para sitios chicos, Playwright alcanza. |
| Hunter.io (25 búsquedas/mes gratis) | Encontrar el mail cuando el sitio no lo muestra. |
| Wappalyzer (extensión) | Ver la tecnología de un sitio a mano. `evaluar-sitio.mjs` ya detecta las comunes. |
| Skills `brag` / `product-launch-video` | Video corto de la demo para mandar por WhatsApp o Instagram. |
| Unsplash / Pexels | Fotos de ambientación cuando las del cliente no sirven. |
