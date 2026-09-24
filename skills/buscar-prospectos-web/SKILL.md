---
name: buscar-prospectos-web
description: Busca empresas con webs desactualizadas o mal hechas para ofrecerles un rediseño de Lume, las puntúa y las carga en el pipeline de prospectos. Úsala cuando el usuario pida "buscar prospectos", "encontrar empresas con webs feas/viejas", "buscar clientes para webs", "armar una lista de <rubro> en <zona> para contactar", o quiera saber qué negocios de un rubro tienen la web floja. Combina búsqueda web, un evaluador automático de señales (celular, HTTPS, año del pie, tecnología vieja, velocidad) y una revisión visual, y devuelve una shortlist priorizada con el contacto de cada una. Para armar la demo de una empresa ya elegida, usá demo-web.
---

# Buscar prospectos para demos web

Encuentra negocios cuya web tiene problemas que un dueño entiende y que Lume puede resolver con
una demo convincente. Busca **calidad antes que cantidad**: 5 buenos candidatos valen más que 50
mediocres, porque cada demo lleva trabajo.

Entrada: rubro y zona (ej. "estudios contables en Montevideo"), y opcionalmente cuántos candidatos
buscar (default 10). Si no los da, usá los de `_config.md`.

## Antes de empezar: ¿dónde está abierta la sesión?

Si el directorio de trabajo de esta sesión **no** es la carpeta de prospectos web
(`<Lume>/01-Comercial/Prospectos/Webs`, en la máquina de Agustín `C:\Agustin\Lume\01-Comercial\Prospectos\Webs`)
ni una subcarpeta, **avisale al usuario antes de hacer nada**, corto y claro: las herramientas de
ese repo (Impeccable, la skill `redesign-existing-projects` y las reglas de hookify) solo se activan
si Claude Code se abre en esa carpeta; recomendale cerrar y abrir ahí. Si decide seguir igual,
continuá y recordá que esos controles no están corriendo.

## Rutas

- Carpeta de prospectos web, `_config.md` y `pipeline.csv`: como en la skill `demo-web`
  (`<Lume>/01-Comercial/Prospectos/Webs/`).
- Scripts compartidos: `../demo-web/scripts/` (relativo a esta skill).

## Paso 1 — Buscar candidatos

**Fuente principal: Google Maps** (Places API). Casi todo comercio tiene ficha y la ficha trae
su web; los buscadores, en cambio, muestran primero a los que ya tienen buena web (justo los
que no nos sirven). En la prueba con papelerías de Montevideo, Maps dio 60 comercios y 26 webs
contra 14 webs de buscadores + directorios.

```
node ../demo-web/scripts/buscar-places.mjs "<rubro> en <zona>" --paginas 3 --json places.json --urls urls.txt
```

- Requiere `GOOGLE_PLACES_API_KEY`. Cada página (20 comercios) es 1 consulta; hay 1.000 gratis
  por mes y el script corta solo en 900. Si no hay key o se alcanzó el tope, seguí con WebSearch.
- Para zonas grandes, repetí por barrio o ciudad (`papelería en Pocitos`, `… en Cordón`) en
  vez de subir `--paginas`: Maps devuelve como mucho ~60 resultados por consulta.
- El JSON trae también los comercios **sin web** o **solo con redes**: listalos en el resumen
  como pitch de "web nueva" (no demo de rediseño).

**Complemento: WebSearch** con 3-4 formulaciones (`<rubro> <zona>`, `<rubro> en <barrio>`,
`<rubro> mayorista <zona>`) y directorios locales (1122.com.uy, opina.com.uy, todo.com.uy)
para sumar lo que Maps no tenga. Los directorios casi nunca muestran la web: buscá el nombre.

Juntá los **dominios propios** en `urls.txt` (en el scratchpad). Filtrá desde ya:
- Directorios, marketplaces, redes sociales, Mercado Libre, perfiles de Google (no son "su web").
- Cadenas, franquicias, empresas grandes, organismos públicos.
- Dominios que ya están en el pipeline: `node ../demo-web/scripts/pipeline.mjs <csv> existe <url>`.

Negocios **sin web** (solo Instagram): anotalos aparte en el resumen como "sin web"; son otro
pitch (web nueva), no demo de rediseño.

## Paso 2 — Puntuar automáticamente

```
node ../demo-web/scripts/evaluar-sitio.mjs --file urls.txt --json evaluacion.json [--psi]
```

`--psi` solo si existe `PSI_API_KEY` (suma la velocidad real en celular; evalúa de a 4 sitios en
paralelo, ~3 min cada 15 sitios). Si ya evaluaste parte de la lista, sacá esas URLs antes.
"oportunidad" alto = web más floja. Los sitios **caídos** son un caso aparte: mencionalos, pero no
son candidatos a demo (no hay de dónde sacar contenido).

## Paso 3 — Revisión visual de los mejores

Las señales automáticas no ven el diseño. Para los ~15 mejores, sacá una captura mobile y una
desktop de la home con Playwright (`browser_run_code_unsafe`) y miralas. Calificá **diseño 1-5**
(1 = muy viejo o roto, 5 = moderno y prolijo) y anotá en una frase qué se ve mal.

- **Mobile = emulación de iPhone real**, no solo ventana angosta: Wix y otros constructores
  sirven otra versión según el user agent, y con una ventana angosta de escritorio una web que
  en el celular se ve bien parece rota. Usá un contexto nuevo:
  `browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
  userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" })`
  y medí `document.documentElement.scrollWidth` (> 390 = scroll horizontal = rota en celular).
- Para no leer 30 imágenes sueltas, armá **una hoja de contactos**: un HTML local con las
  capturas en grilla (en base64) y una sola captura de esa página.
- Un "Sitio en construcción" o una web caída que figura en Google Maps es un **muy buen
  candidato** (sus clientes llegan a una página vacía), aunque el contenido de la demo salga de
  su Instagram y su ficha de Maps.

Descartá si: diseño ≥ 4 (no hay mejora obvia que mostrar), es una tienda online grande, o el
contenido es tan escaso que la demo quedaría vacía.

## Paso 4 — Contacto

Para cada candidato que queda, buscá el mail en su sitio (`emails` del evaluador, página de
contacto, pie), en su Instagram / Facebook o en su ficha de Google. Preferí mails de dueño o
genéricos del negocio (info@, contacto@). Si no hay mail, anotá WhatsApp o Instagram como canal.
No uses listas compradas ni mails personales que no estén publicados por el propio negocio.

## Paso 5 — Cargar y mostrar

Por cada candidato elegido:

```
node ../demo-web/scripts/pipeline.mjs <csv> upsert <slug> empresa="..." url=... rubro="..." zona="..." email=... telefono=... instagram=... oportunidad=<n> motivos="<2-3 motivos en lenguaje llano>" estado=candidato notas="diseño <n>/5: <frase>"
```

Mostrá una tabla ordenada por prioridad (oportunidad + diseño + tiene mail):

| # | Empresa | Web | Diseño | Oportunidad | Problemas principales | Contacto |

Cerrá preguntando con cuáles armar la demo (skill `demo-web`). Sugerí empezar por los 2-3 con
problemas más visibles y contacto por mail.

## Errores comunes

- **Quedarse con lo que dice el script sin mirar la web**: un sitio en Wix moderno puede puntuar
  alto por velocidad y verse bien. La revisión visual manda.
- **Cargar al pipeline empresas descartadas**: solo entran los candidatos; los descartes
  quedan en el resumen de la sesión.
- **Buscar en un solo lugar**: los primeros resultados de Google suelen ser los que ya invirtieron
  en su web. Los mejores prospectos están en la página 2-3 y en directorios.
