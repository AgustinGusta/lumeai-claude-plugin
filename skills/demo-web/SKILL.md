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

## Antes de empezar: ¿dónde está abierta la sesión?

Si el directorio de trabajo de esta sesión **no** es la carpeta de prospectos web
(`<Lume>/01-Comercial/Prospectos/Webs`, en la máquina de Agustín `C:\Agustin\Lume\01-Comercial\Prospectos\Webs`)
ni una subcarpeta, **avisale al usuario antes de hacer nada**, corto y claro: las herramientas de
ese repo (Impeccable, la skill `redesign-existing-projects` y las reglas de hookify) solo se activan
si Claude Code se abre en esa carpeta; recomendale cerrar y abrir ahí. Si decide seguir igual,
continuá y recordá que esos controles no están corriendo.

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
2. `npx wrangler whoami` (desde una carpeta vacía, ver Paso 7): si no hay sesión de Cloudflare,
   pedile al usuario que corra `! npx wrangler login` (abre el navegador). La sesión puede vencer
   o invalidarse: si un comando dice "Not logged in", repetir el login. La cuenta tiene que tener
   el **mail verificado** (si no, Cloudflare rechaza con el código 8000077).
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

La carpeta de prospectos (`<Lume>/01-Comercial/Prospectos/Webs/`) es un repo git local: commiteá
en `main` el relevamiento. Definí la **clave** de la demo, `AAAA-MM-DD-<slug>` (fecha del día en
que arranca el diseño), y anotala en `FICHA.md`: todo lo que produce el diseño la lleva.

## Paso 2 — Relevar el sitio actual (el "antes")

Usá el **Playwright MCP** (o Chrome DevTools MCP). Por cada página importante (home, servicios /
productos, nosotros, contacto; máximo ~6):

- Captura **full-page** en desktop (1440 px) y mobile → la mobile con emulación de iPhone real
  (`isMobile`, `hasTouch` y user agent de iPhone, ver `buscar-prospectos-web` Paso 3), no una
  ventana angosta: Wix y otros sirven otra versión según el dispositivo →
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
  (`--psi` solo si hay `PSI_API_KEY`; si no, corré `lighthouse_audit` del Chrome DevTools MCP —que
  **no mide velocidad**: para eso `performance_start_trace`— en
  mobile y guardá los puntajes).
- Anotá en `auditoria/resumen.md` los **3 a 5 problemas que un dueño de negocio entiende**
  (no se ve bien en el celular, tarda 8 s en cargar, dice © 2016, no aparece en Google con una
  descripción, el botón de WhatsApp no existe…). Esto alimenta el mail; nada de jerga técnica.
- **Diagnóstico de diseño:** recorré el sitio viejo con la skill `redesign-existing-projects` (checklist de
  tipografía, color, layout, estados) y anotá en `auditoria/resumen.md`, sección "Diagnóstico de diseño",
  lo que la demo tiene que resolver. Sus sugerencias de relleno (picsum, cambiar la tipografía "por Inter")
  no aplican: mandan las reglas de contenido real y de marca.

## Paso 3 — Diseño dibujado (el usuario elige mirando)

**Nunca describas la dirección visual solo en texto ni con dibujos ASCII**: se decide mirando.
Una decisión tomada sobre algo descrito es provisional hasta verlo dibujado.

- **Si existe `docs/diseno/README.md` en el repo de prospectos, seguilo**: es el procedimiento con
  pencil (clave, 2-4 direcciones, conservadora, home completa de la elegida, PNG, spec aprobado,
  y las trampas conocidas del MCP de pencil).
- **Si no existe** (otra máquina, sin pencil): igual dibujá 2-4 direcciones del hero con el
  contenido real del cliente, una de ellas **conservadora** (pegada a su marca actual pero
  ordenada), como HTML locales, y mostralas como capturas a 1440 y 390×844. El usuario elige
  viéndolas.

**Moodboard (antes de dibujar):** buscá 3-4 referencias del rubro (SiteInspire, Land-book y webs de
competidores bien hechas), capturá su portada a 1440 con Playwright y guardalas en
`04-Diseño/referencias/<clave>/`. Ponelas en el `.pen` en un marco "Referencias" al lado de las
direcciones: el usuario las ve, no decide sobre ellas. Al cerrar el diseño, ese marco se borra (el PNG ya
está en `referencias/`).

**Fotos de ambientación:** solo si las del cliente no alcanzan, con
`node scripts/buscar-fotos.mjs "<consulta>" --dir <slug>/03-Material-cliente/fotos/stock --n 6`
(requiere `PEXELS_API_KEY`). Revisalas una por una (la búsqueda trae resultados que no corresponden),
nunca personas presentadas como su equipo ni productos que no venden, y anotalas en `04-Diseño/notas.md`.

**Roles de las skills de diseño** (para que no se pisen):

| Skill | Rol | Cuándo |
|---|---|---|
| `redesign-existing-projects` | Diagnóstico del sitio viejo | Paso 2 |
| `frontend-design`, `ui-ux-pro-max` | Generar direcciones (paleta, tipografía, layout) | Paso 3 |
| Impeccable | Revisar las direcciones contra sus anti-patrones antes de mostrarlas; criticar (`critique`) y pulir (`polish`) lo construido | Pasos 3 y 5 |
| `improve-ui` | Planes de mejora sobre interfaces grandes | Proyectos de clientes, no demos |

Usá `frontend-design` y `ui-ux-pro-max` para generar las direcciones. Reglas que valen siempre:

- **Reconocible:** mismo logo, misma paleta base (ajustable para contraste AA), mismo tono.
- **Mismo contenido, mejor contado.** **No inventes datos**: nada de testimonios, cifras, años de
  trayectoria, premios, clientes o precios que no estén en su sitio.
- **Lo que un negocio chico valora:** celular, WhatsApp/teléfono a un toque, horarios y ubicación
  claros, velocidad.
- Fotos: las suyas; stock (Unsplash/Pexels) solo como ambientación, anotado en `04-Diseño/notas.md`.

No se construye nada sin la dirección elegida y, si hay README, sin el spec aprobado.

## Paso 4 — Construir la demo

0. Creá la rama `demo/<clave>` (después de commitear el diseño en `main`) y construí desde el
   spec aprobado.
1. `node scripts/preparar-demo.mjs <boilerplate> <slug>/05-Código/demo`, después `npm install` y
   `npx next typegen` ahí. Sin `typegen`, en una copia nueva `npm run check` falla en el
   typecheck (`Cannot find name 'LayoutProps'`) antes de llegar a compilar: esos tipos los
   genera Next y la copia no trae `.next/`.
2. Leé el `AGENTS.md` del boilerplate y la guía de Next que indique **antes** de escribir código
   (la versión de Next tiene cambios que no están en tu entrenamiento).
3. Contenido e identidad en `src/content/site.ts` (única fuente de verdad), tokens de marca en
   `src/app/globals.css`, fuentes en `src/app/layout.tsx`, logo e imágenes optimizadas (WebP,
   ~1200 px, < 200 KB) en `public/images/`. `site.url` = la URL de la demo en Cloudflare (la
   sabés recién al crear el proyecto en el Paso 7; mientras, usá `https://lume-<slug>.pages.dev`).
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
   - **Analytics:** se da de alta en el Paso 7, después de crear el proyecto de Cloudflare, con el
     dominio definitivo (ver ahí).
6. `npm run check` (lint + typecheck + build) hasta que pase limpio.

## Paso 5 — Verificar

1. **Impeccable** sobre lo construido: `critique` y después `polish`; guardá la crítica en
   `04-Diseño/critica.md` (qué se corrigió y qué no, y por qué).
2. Desde `<slug>/05-Código/demo` (después de `npm run build`):
   `npm run qa -- --diseno ../../04-Diseño/pantallas/<clave> --informe ../../06-Entrega/qa`
   (`--diseno` espera `home-desktop.png` y `home-celular.png` exportados a escala 1; una vez por
   máquina: `npx playwright install chromium`). Los **errores** (accesibilidad grave, links
   internos rotos, vista previa al compartir incompleta) no se negocian; la comparación con el diseño
   solo informa: mirá `diff-*.png` y explicá las diferencias grandes. Si el boilerplate de la demo no
   tiene `npm run qa`, avisá al usuario y seguí solo con `verificar-demo.mjs`.
3. `node scripts/verificar-demo.mjs out "<Empresa>" <dominio-actual>` → tiene que dar OK.
   Los ERROR no se negocian; los AVISO se revisan.
4. Levantá `out/` local (`npx serve out`) y recorrela con Playwright en 390 px y 1440 px: sin
   scroll horizontal, sin texto cortado, menú mobile funcionando, imágenes cargando.
5. Mirá las capturas vos mismo con ojo crítico: ¿se nota claramente mejor que el antes? ¿Se
   reconoce como la misma empresa? Si la respuesta a cualquiera es "más o menos", iterá.
6. Compará capturas de lo construido a 1440 y 390 contra `04-Diseño/pantallas/<clave>/` (o las
   capturas de la dirección elegida) y corregí las diferencias antes de pasar a la revisión del
   usuario.

## Paso 6 — Revisión del usuario (devoluciones, análisis y corrección)

La demo pasa por los ojos del usuario **entera**, no solo la home dibujada: las páginas internas se
construyeron sin dibujo previo y es acá donde se revisan como diseño. No se publica hasta que el
usuario diga que está lista.

1. **Vista previa.** Levantá `out/` local en background (`npx serve out`) y pasale al usuario la
   URL local para la computadora y la de red (misma wifi) para mirarla en su celular; si el celular
   no llega, que use el modo dispositivo de Chrome (`F12` → ícono de celular, 390 px). Sumá la
   lista de páginas y qué se decidió en cada una sin dibujo (el spec lo dice). Decile que anote
   todo lo que no le cierre, grande o chico, con la página y lo que ve.
2. **Registro.** Cada devolución va a `04-Diseño/devoluciones.md`, una fila por punto:
   `| # | Ronda | Página | Qué ve el usuario | Análisis | Decisión | Estado |`. Anotalo con sus
   palabras; no lo resumas en otra cosa.
3. **Análisis en conjunto.** Antes de tocar código, repasá los puntos con el usuario: qué lo causa,
   opciones de arreglo (si es visual, mostrala con captura o dibujo, no descripta) y una
   recomendación. Él decide cada uno: **corregir**, **no corregir** (con el motivo) o **cambiar el
   spec** (se actualiza `<clave>-spec.md` en el mismo commit). Lo que pida inventar contenido
   (testimonios, cifras, fotos de su equipo) se explica y se descarta.
4. **Corrección.** Corregí lo decidido, corré otra vez el Paso 5 (`npm run check`, `npm run qa`,
   `verificar-demo.mjs`) y mostrale el antes/después de lo que cambió (capturas a 1440 o 390 de esas
   partes). Marcá cada punto como hecho en `devoluciones.md` y commiteá la ronda en la rama.
5. **Otra ronda** hasta que el usuario diga que está lista. Ese "está lista" es el OK de diseño;
   el OK para publicar se pide aparte en el Paso 7.
6. Cortá el servidor local al terminar.

## Paso 7 — Publicar (pedir OK antes)

Con la revisión del Paso 6 cerrada, pedí OK para publicar. Cada recurso externo
(proyecto de Cloudflare, sitio en Umami) se nombra en el pedido de OK.

**Correr `wrangler` SIEMPRE desde una carpeta vacía** (por ejemplo una en el scratchpad), nunca
desde la carpeta de la demo. Las versiones actuales de `wrangler` detectan Next.js y "delegan"
Pages a Workers: reescriben `package.json`, `package-lock.json`, `next.config.ts`, `.gitignore` y
`_headers`, instalan `@opennextjs/cloudflare`, crean `wrangler.jsonc`/`open-next.config.ts` y
fallan en el build. Si pasa: `git checkout` de esos archivos, borrar lo creado y `npm ci`.

1. Crear el proyecto (única vez que va `--force`: fuerza Pages clásico en vez de Workers):
   ```
   cd <carpeta-vacía>
   npx wrangler pages project create lume-<slug> --production-branch main --force
   ```
   Si el nombre está tomado, Cloudflare asigna otro subdominio: usá el que devuelva el comando.
2. **Umami** (si hay credenciales, ver `references/herramientas.md`), con el dominio real:
   `node scripts/umami.mjs alta "Demo <Empresa>" <subdominio>.pages.dev`. Guardá el id en
   `<demo>/.env.production.local` como `NEXT_PUBLIC_UMAMI_WEBSITE_ID=<id>` (git lo ignora).
3. Si `site.url` es distinto de la URL real, corregilo. Rebuild (`npm run build`) y
   `verificar-demo.mjs` otra vez; confirmá que el id de Umami está en `out/index.html`.
4. Publicar solo `out/`, con ruta absoluta y desde la carpeta vacía (sin `--force`):
   ```
   npx wrangler pages deploy "<ruta-absoluta>/out" --project-name lume-<slug> --branch main --commit-dirty=true
   ```
5. Revisá que todas las páginas respondan 200 (`curl`). Un **522** en los primeros minutos es
   propagación de Cloudflare: reintentá a los 20-30 s antes de tocar nada. Chequeá también
   `X-Robots-Tag: noindex` en los headers y la franja `data-lume-demo`.

Guardá en el pipeline: `demo_url=<url> umami_id=<id> estado=demo-lista`. Uní la rama
`demo/<clave>` a `main` y marcá la clave como `publicada` en el índice del README de diseño.

## Paso 8 — Medir el después y armar el material del mail

- Corré la misma medición sobre la demo publicada (PSI; sin PSI, `lighthouse_audit` + `performance_start_trace`, porque `lighthouse_audit` no incluye velocidad) →
  `06-Entrega/despues.json`.
- **Imagen antes/después** → `01-Comercial/antes-despues.png`: una sola imagen horizontal con la
  home mobile de antes y la de después lado a lado, con los rótulos "Hoy" y "Propuesta". Armala con
  un HTML local de dos columnas y sacale captura con Playwright. Va adjunta o pegada en el mail:
  muchos no hacen clic en links de desconocidos, pero sí miran una imagen.
- Opcional, si el usuario lo pide: video corto de la demo con la skill `brag` o
  `product-launch-video`.

## Paso 9 — Mail y seguimientos

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
- **Saltear la revisión del usuario** porque los controles dan OK → `npm run qa` y Impeccable no
  ven si la demo convence al dueño; las páginas internas, además, nunca se dibujaron. Sin el
  "está lista" del Paso 6 no se publica.
