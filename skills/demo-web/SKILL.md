---
name: demo-web
description: Arma una demo de rediseño de la web de una empresa (prospecto) a partir de su sitio actual, la publica en un link privado de Cloudflare Pages y deja listo el mail de contacto con el antes/después. Úsala cuando el usuario pase la URL de una empresa y pida "armar la demo", "rehacer/renovar/mejorar su web para mandársela", "prepararle una propuesta de web", "hacer la demo-web de X", o cuando un prospecto de 01-Comercial/Prospectos/Webs pase a la etapa de demo. Captura y audita el sitio actual, rediseña sobre el boilerplate webb-institucional conservando su marca y contenido, verifica que la demo sea no indexable y esté marcada como propuesta de Lume, la publica, mide el antes/después y redacta el mail y los seguimientos.
---

# Demo de rediseño web para un prospecto

La idea comercial: la empresa recibe un mail con un link y ve **su propia web, pero bien hecha**.
Que se reconozca al instante (su logo, sus colores, sus textos, sus fotos) y que la mejora salte a
la vista. Eso vende más que cualquier portfolio. El usuario no toca código: esta skill hace todo y
le pide confirmación solo en los puntos que publican algo o salen hacia afuera.

Entrada: la URL del sitio actual (y, si lo hay, el `slug` del prospecto en el pipeline).

## Rutas

- **Carpeta de prospectos web:** `<Lume>/01-Comercial/Prospectos/Webs/` (en la máquina de Agustín,
  `C:\Agustin\Lume`). Si no la encontrás, preguntá dónde está.
- **Pipeline:** `<Prospectos/Webs>/pipeline.csv`, siempre vía `scripts/pipeline.mjs` (no lo edites a
  mano: tiene comillas y BOM para Excel).
- **Config comercial:** `<Prospectos/Webs>/_config.md` (firma, casilla, días de seguimiento, etc.).
  Si no existe, creala copiando `references/config-ejemplo.md` y pedile al usuario que complete
  lo que falte.
- **Plantilla de carpeta:** `<Lume>/02-Clientes/_Plantilla-web/`. La demo de un prospecto usa la
  misma estructura, así si firma se mueve tal cual a `02-Clientes/`.
- **Boilerplate:** `<Lume>/04-Herramientas/webb-institucional/` (si existe clon del repo de ADO,
  preferilo; si no, la carpeta local).
- **Scripts:** `scripts/` dentro de esta skill (Node 24, sin dependencias).

## Paso 0 — Chequeos (no avanzar si algo falla)

1. `node scripts/pipeline.mjs <pipeline.csv> existe <url>`: si ya existe y está en `enviado` o más
   adelante, avisá y no hagas otra demo salvo que el usuario insista.
2. `npx wrangler whoami`: si no hay sesión de Cloudflare, pedile al usuario que corra
   `! npx wrangler login` (abre el navegador; se hace una sola vez).
3. ¿La empresa es un buen candidato? Descartá y avisá si: la web ya es moderna y está bien (no hay
   pitch creíble), es una cadena grande o una marca con agencia, o el sitio es una tienda con
   carrito (eso es `webb-ecommerce`, fuera del alcance de una demo rápida: proponé hacer solo la
   home institucional).

## Paso 1 — Carpeta del prospecto

Copiá `_Plantilla-web` a `<Prospectos/Webs>/<slug>/` (slug = kebab-case del nombre comercial, sin
acentos). Completá en `FICHA.md` lo que ya sepas (empresa, URL, plataforma, fecha de captura).
Registrá o actualizá el prospecto en el pipeline:

```
node scripts/pipeline.mjs <csv> upsert <slug> empresa="..." url=... rubro="..." zona="..."
```

## Paso 2 — Relevar el sitio actual (el "antes")

Usá el **Playwright MCP** (o Chrome DevTools MCP). Por cada página importante (home, servicios /
productos, nosotros, contacto; máximo ~6):

- Captura **full-page** en desktop (1440 px) y mobile (390 px) →
  `02-Sitio-actual/capturas/<pagina>-desktop.png` / `-mobile.png`.
- Texto completo de la página → `03-Material-cliente/textos/<pagina>.md`. Copiá los textos tal
  cual; después los mejorás, pero partís de lo que ellos dicen.
- Logo e imágenes útiles → `03-Material-cliente/logos/` y `fotos/` (descargalas con `curl`; nunca
  enlaces a su servidor desde la demo). Preferí la versión más grande que exista (srcset, og:image).
- Colores de marca: sacalos del logo y del CSS (`browser_evaluate` con `getComputedStyle` del
  header, botones, links). Tipografías usadas.
- Datos de contacto: teléfono, WhatsApp, mail, dirección, horarios, redes.
- Inventario de URLs (sitemap.xml si existe) → `02-Sitio-actual/urls-actuales.csv`.

Auditoría del antes → `02-Sitio-actual/auditoria/`:

- `node scripts/evaluar-sitio.mjs <url> --psi --json 02-Sitio-actual/auditoria/evaluacion.json`
  (`--psi` solo si hay `PSI_API_KEY`; si no, corré `lighthouse_audit` del Chrome DevTools MCP en
  mobile y guardá los puntajes).
- Anotá en `auditoria/resumen.md` los **3 a 5 problemas que un dueño de negocio entiende**
  (no se ve bien en el celular, tarda 8 s en cargar, dice © 2016, no aparece en Google con una
  descripción, el botón de WhatsApp no existe…). Esto alimenta el mail; nada de jerga técnica.

## Paso 3 — Dirección de diseño (mostrar y esperar OK)

Invocá las skills `frontend-design` y `ui-ux-pro-max` para decidir la dirección visual. Reglas:

- **Reconocible:** mismo logo, misma paleta base (podés ajustar tonos para que cumplan contraste
  AA), mismo tono de voz. Si su paleta es muy mala, mantené el color principal y rediseñá el resto.
- **Mismo contenido, mejor contado:** mismas secciones y servicios, textos editados para ser más
  claros y escaneables. **No inventes datos**: nada de testimonios, cifras, años de trayectoria,
  premios, clientes o precios que no estén en su sitio. Si una sección necesita algo que no
  existe, dejala afuera.
- **Lo que un negocio chico valora:** que se vea bien en el celular, que el WhatsApp / teléfono
  estén a un toque, horarios y ubicación claros, velocidad.
- Fotos: usá las suyas. Si son de muy baja calidad, podés usar fotos de Unsplash/Pexels **solo
  como ambientación** (nunca personas presentadas como su equipo, ni productos que no venden).
  Anotá en `04-Diseño/notas.md` qué fotos son de stock.

Mostrale al usuario en 5-8 líneas: paleta, tipografías, estructura de páginas, y 2-3 mejoras
principales. Esperá OK antes de programar.

## Paso 4 — Construir la demo

1. `node scripts/preparar-demo.mjs <boilerplate> <slug>/05-Código/demo` y `npm install` ahí.
2. Leé el `AGENTS.md` del boilerplate y la guía de Next que indique **antes** de escribir código
   (la versión de Next tiene cambios que no están en tu entrenamiento).
3. Contenido e identidad en `src/content/site.ts` (única fuente de verdad), tokens de marca en
   `src/app/globals.css`, fuentes en `src/app/layout.tsx`, logo e imágenes optimizadas (WebP,
   ~1200 px, < 200 KB) en `public/images/`. `site.url` = la URL de la demo en Cloudflare (la
   sabés recién al crear el proyecto en el Paso 6; mientras, usá `https://lume-<slug>.pages.dev`).
4. Páginas: adaptá las del boilerplate (inicio, servicios, nosotros, contacto) a lo que tenga la
   empresa. Borrá las que no apliquen y agregá las que su sitio tenga y valgan la pena.
5. **Modo demo (obligatorio, lo chequea el Paso 5):**
   - **No indexable:** `robots` del layout y de `pageMetadata` (`src/lib/seo.ts`) siempre
     `{ index: false, follow: false }`; `src/app/robots.ts` con `disallow: "/"` y sin sitemap;
     `public/_headers` con:
     ```
     /*
       X-Robots-Tag: noindex, nofollow
     ```
   - **Aviso de propuesta:** una franja fina arriba de todo, con `data-lume-demo`, que diga
     "Propuesta de rediseño preparada por Lume para <Empresa> · No es el sitio oficial" y un link
     a lumeai.uy. Discreta pero visible en todas las páginas. Esto es lo que hace que la demo sea
     una propuesta honesta y no una copia que alguien pueda confundir con el sitio real.
   - **Formulario desactivado:** el `<form>` de contacto lleva `data-lume-demo-form`, no envía
     nada y al enviar muestra "Esto es una demo: en tu web real, este mensaje te llega por mail".
     Botones de WhatsApp / teléfono pueden quedar con sus datos reales.
   - **Analytics:** si hay credenciales de Umami (ver `references/herramientas.md`), dá de alta el
     sitio con `node scripts/umami.mjs alta "Demo <Empresa>" lume-<slug>.pages.dev` y usá ese id
     en `NEXT_PUBLIC_UMAMI_WEBSITE_ID` al buildear. Así sabemos si abrieron el link.
6. `npm run check` (lint + typecheck + build) hasta que pase limpio.

## Paso 5 — Verificar

1. `node scripts/verificar-demo.mjs out "<Empresa>" <dominio-actual>` → tiene que dar OK.
   Los ERROR no se negocian; los AVISO se revisan.
2. Levantá `out/` local (`npx serve out`) y recorrela con Playwright en 390 px y 1440 px: sin
   scroll horizontal, sin texto cortado, menú mobile funcionando, imágenes cargando.
3. Mirá las capturas vos mismo con ojo crítico: ¿se nota claramente mejor que el antes? ¿Se
   reconoce como la misma empresa? Si la respuesta a cualquiera es "más o menos", iterá.

## Paso 6 — Publicar (pedir OK antes)

Mostrale al usuario las capturas del después y pedí OK para publicar. Con OK:

```
npx wrangler pages project create lume-<slug> --production-branch main
npx wrangler pages deploy out --project-name lume-<slug> --branch main --commit-dirty=true
```

Si el nombre está tomado, Cloudflare asigna otro subdominio: usá el que devuelva el comando.
Si `site.url` quedó distinto de la URL real, corregilo, rebuildeá y redeployá.
Guardá en el pipeline: `demo_url=<url> umami_id=<id> estado=demo-lista`.

## Paso 7 — Medir el después y armar el material del mail

- Corré la misma medición sobre la demo publicada (PSI o `lighthouse_audit`) →
  `06-Entrega/despues.json`.
- **Imagen antes/después** → `01-Comercial/antes-despues.png`: una sola imagen horizontal con la
  home mobile de antes y la de después lado a lado, con los rótulos "Hoy" y "Propuesta". Armala con
  un HTML local de dos columnas y sacale captura con Playwright. Va adjunta o pegada en el mail:
  muchos no hacen clic en links de desconocidos, pero sí miran una imagen.
- Opcional, si el usuario lo pide: video corto de la demo con la skill `brag` o
  `product-launch-video`.

## Paso 8 — Mail y seguimientos

Escribí `01-Comercial/mail.md` siguiendo `references/mail.md` (asunto, cuerpo, seguimiento 1 y 2),
con la firma y casilla de `_config.md`. El mail sale desde la casilla @lumeai.uy del usuario:
**esta skill no envía nada**, deja el texto listo para copiar y pegar.

Cerrá con un resumen corto: link de la demo, puntajes antes → después, dónde está el mail y la
imagen, y el recordatorio: "cuando lo mandes, avisame y lo marco como enviado" (eso lo registra
`seguimiento-prospectos-web`).

## Errores comunes

- **Demo indexable** → Google la toma como copia del sitio real y perjudica a la empresa. Por eso
  el noindex triple (meta, header, robots) y el verificador.
- **Inventar contenido** para que quede más lindo (testimonios, "más de 20 años") → destruye la
  confianza apenas lo lean. Solo lo que está en su sitio.
- **Rediseño irreconocible** → el dueño no se ve reflejado y no conecta. Cambiá la calidad, no la
  identidad.
- **Hotlinkear imágenes de su servidor** → la demo se rompe si cambian algo y les consume ancho de
  banda. Descargar y optimizar.
- **Publicar sin OK** o **mandar el mail por el usuario** → no; publicar y contactar son decisiones
  del usuario.
