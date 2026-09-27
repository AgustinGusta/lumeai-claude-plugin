---
name: buscar-prospectos-web
description: Busca empresas con webs desactualizadas o mal hechas para ofrecerles un rediseño de Lume, las puntúa y las carga en el pipeline de prospectos. Úsala cuando el usuario pida "buscar prospectos", "encontrar empresas con webs feas/viejas", "buscar clientes para webs", "armar una lista de <rubro> en <zona> para contactar", o quiera saber qué negocios de un rubro tienen la web floja. Combina búsqueda web, un evaluador automático de señales (celular, HTTPS, año del pie, tecnología vieja, velocidad) y una revisión visual, y devuelve una shortlist priorizada con el contacto de cada una. Además busca comercios sin web con buena ficha de Maps e Instagram activo, para ofrecerles una web nueva. Para armar la demo de una empresa ya elegida, usá demo-web.
---

# Buscar prospectos para demos web

Encuentra negocios cuya web tiene problemas que un dueño entiende y que Lume puede resolver con
una demo convincente. Busca **calidad antes que cantidad**: 5 buenos candidatos valen más que 50
mediocres, porque cada demo lleva trabajo.

Entrada: rubro y zona (ej. "estudios contables en Montevideo"), y opcionalmente cuántos candidatos
buscar (default 10). **Si no da rubro ni zona, se sigue el barrido ordenado** (sección "Barrido
ordenado"): así se recorren todos los rubros de `_config.md` sin repetir búsquedas.

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

## Barrido ordenado (modo por defecto)

La búsqueda se organiza como una grilla de **casillas rubro × rectángulo del mapa**, que se barren
de a una y se tachan en `cobertura.csv` (carpeta de prospectos). Los comercios que se miraron y no
sirven quedan en `descartados.csv`, así ninguna búsqueda posterior los vuelve a evaluar. Los rubros,
en orden y con sus consultas, y el rectángulo inicial están en `_config.md` → `## Barrido`.

Maps devuelve como mucho 60 comercios por búsqueda: si una casilla llega a 60 está **saturada** y
se parte en 4 cuadrantes, que quedan pendientes. Con menos de 60, la casilla está agotada.

`<dir>` = carpeta de prospectos; `<s>` = scripts compartidos; archivos de trabajo en el scratchpad,
el JSON crudo en `<dir>/barridos/` (ignorado por git).

1. **Casilla:** `node <s>/cobertura.mjs <dir> siguiente` → `{ id, rubro, consulta, rect, nombre, archivo }`.
   Exit 1 = primera vuelta terminada: avisale al usuario y pará.
2. **Buscar en el rectángulo** (la consulta va sin zona):
   ```
   node <s>/buscar-places.mjs "<consulta>" --rect <rect> --paginas 3 --json <dir>/barridos/<archivo>.json --resumen resumen-<archivo>.json --sin-web sin-web.json
   ```
   - **Cualquier exit distinto de 0: no cierres la casilla ni la partas.** Exit 4 (`incompleta`) =
     se cortó por el tope mensual (aunque diga `saturada`, manda el 4): seguí el mes que viene.
     Exit 1 = error de Places (tope diario, clave): seguí mañana. Avisale al usuario en los dos casos.
   - `saturada: true` → `node <s>/cobertura.mjs <dir> partir <id>`. Los resultados de esta casilla
     se procesan igual (no se tira la consulta); los cuadrantes filtran lo ya visto.
3. **Filtrar lo ya visto:** `node <s>/cobertura.mjs <dir> filtrar <dir>/barridos/<archivo>.json --salida nuevos.json`
   (saca lo que está en el pipeline o en descartados). Hacé lo mismo con `sin-web.json`
   (`--salida sin-web-nuevos.json`). De `nuevos.json`, las `web` de los que tienen `webPropia`
   van a `urls.txt` (un dominio por línea, sin repetir).
4. **Pasos 2 a 4 de siempre** sobre lo nuevo (evaluar, revisión visual, contacto) y la rama sin web
   sobre `sin-web-nuevos.json`. Sitios caídos: son un descarte (`caida`).
5. **Registrar:**
   - Candidatos → `pipeline.mjs upsert` como en el Paso 5, con `rubro` = el de la casilla.
   - **Todo lo que pasó por el evaluador o por tu revisión y no quedó** → `descartados`, en un lote:
     ```
     node <s>/cobertura.mjs <dir> descartar --lote descartes.json
     ```
     con `[{ "place_id": "<id>", "dominio": "<web o vacío>", "empresa": "...", "rubro": "<rubro>",
     "casilla": "<id de la casilla>", "motivo": "cadena|web-buena|sin-contenido|caida|sin-instagram|tiene-web|otro",
     "detalle": "<una frase>" }]`. Lo que el filtro automático ya sacó (sin web con poca nota o
     pocas reseñas, redes sin celular) no se registra: una búsqueda repetida lo saca solo.
6. **Cerrar la casilla** con sus números y un nombre legible con los barrios que aparecen en las
   direcciones de los resultados:
   ```
   node <s>/cobertura.mjs <dir> cerrar <id> resultados=<n> con_web=<n> sin_web_buena=<n> candidatos=<n> descartados=<n> consultas=<n> nombre="Montevideo › NE (Malvín, Unión, Buceo)"
   ```
   Los números salen de `resumen-<archivo>.json` y de lo que registraste.
7. **Repetir** desde el paso 1 hasta juntar **unos 10 candidatos** (rediseño + sin web) o terminar
   el rubro, lo que llegue primero.
8. **Cerrar la sesión** con las tablas del Paso 5 (y la de sin web) y el avance:
   `node <s>/cobertura.mjs <dir> estado` ("ferreterias | 9/13 casillas | …; Próxima: …").

Si el usuario pide un rubro o una zona puntual, se busca como hasta ahora (Paso 1 con texto), pero
igual se usa `filtrar` antes de evaluar y se registran los descartes (`casilla` = "fuera de grilla").

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
- Sumá `--sin-web sin-web.json` al comando: deja aparte los comercios **sin web propia** con buena
  ficha (nota ≥ 4,3 y ≥ 30 reseñas por defecto; `--nota-min` / `--resenas-min` según `_config.md`)
  y celular. Son el otro enfoque: **web nueva** (ver "Rama sin web" abajo), no rediseño.

**Complemento: WebSearch** con 3-4 formulaciones (`<rubro> <zona>`, `<rubro> en <barrio>`,
`<rubro> mayorista <zona>`) y directorios locales (1122.com.uy, opina.com.uy, todo.com.uy)
para sumar lo que Maps no tenga. Los directorios casi nunca muestran la web: buscá el nombre.

Juntá los **dominios propios** en `urls.txt` (en el scratchpad). Filtrá desde ya:
- Directorios, marketplaces, redes sociales, Mercado Libre, perfiles de Google (no son "su web").
- Cadenas, franquicias, empresas grandes, organismos públicos.
- Dominios que ya están en el pipeline: `node ../demo-web/scripts/pipeline.mjs <csv> existe <url>`.

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
node ../demo-web/scripts/pipeline.mjs <csv> upsert <slug> empresa="..." url=... rubro="..." zona="..." email=... telefono=... instagram=... oportunidad=<n> motivos="<2-3 motivos en lenguaje llano>" estado=candidato tipo=rediseno canal=mail notas="diseño <n>/5: <frase>"
```

(Si no tiene mail pero sí celular, `canal=whatsapp`.)

Mostrá una tabla ordenada por prioridad (oportunidad + diseño + tiene mail):

| # | Empresa | Web | Diseño | Oportunidad | Problemas principales | Contacto |

Cerrá preguntando con cuáles armar la demo (skill `demo-web`). Sugerí empezar por los 2-3 con
problemas más visibles y contacto por mail.

## Rama sin web (prospectos `tipo=nueva`)

Comercios sin web, activos en Instagram y con buena ficha en Maps. Pitch: "ya tienen la vitrina en
Instagram; les falta la web que aparece en Google". Se les arma una demo con `demo-web` y se les
escribe por WhatsApp.

1. **Punto de partida:** `sin-web.json` del Paso 1 (ya filtrado por nota, reseñas y celular, y
   ordenado por `puntajeBase`). Sacá cadenas y franquicias, y los que ya están en el pipeline:
   `pipeline.mjs <csv> existe <mapsId>`.
2. **¿De verdad no tiene web?** Maps muchas veces no trae la web aunque exista. Antes de seguir,
   WebSearch `"<nombre>" <zona>`: si aparece un sitio propio, va a la rama de rediseño (o se
   descarta si está bien), nunca al pitch "no tienen web".
   **Instagram:** si `instagram` vino vacío, buscalo (WebSearch `"<nombre>" <zona> instagram`).
   Mirá solo la vista pública, **sin iniciar sesión** (seguidores, bio, publicaciones, fecha de la
   última si se ve). Si Instagram pide login, anotalo como "Instagram a revisar por el usuario".
   Sin Instagram o con la última publicación de hace más de 3 meses → descartado.
3. **Puntaje:** `oportunidad = puntajeBase + 20` si el Instagram está activo (máximo 100).
4. **Cargar** los que quedan:
   ```
   node ../demo-web/scripts/pipeline.mjs <csv> upsert <slug> tipo=nueva canal=whatsapp estado=candidato empresa="..." url=<mapsId> rubro="..." zona="..." telefono="<celular>" instagram=<url> oportunidad=<n> motivos="<2-3 en lenguaje llano>" notas="<seguidores, última publicación>"
   ```
   `url` es siempre el `mapsId` (link con place_id), nunca el `maps`: es la clave del comercio.
   Ejemplo de motivos: "120 reseñas con 4,7 pero sin web: quien lo busca en Google termina en
   Instagram".
5. **Mostrar** en una tabla aparte de la de rediseños:

   | # | Comercio | Nota (reseñas) | Instagram | Oportunidad | WhatsApp |

   Cerrá preguntando con cuáles armar la demo. Recordá que para empezar cada una el usuario tiene
   que bajar el material de su Instagram (ver `demo-web` Paso 0).

## Errores comunes

- **Quedarse con lo que dice el script sin mirar la web**: un sitio en Wix moderno puede puntuar
  alto por velocidad y verse bien. La revisión visual manda.
- **Cargar al pipeline empresas descartadas**: solo entran los candidatos; los descartes van a
  `descartados.csv` (`cobertura.mjs descartar`).
- **Buscar en un solo lugar**: los primeros resultados de Google suelen ser los que ya invirtieron
  en su web. Los mejores prospectos están en la página 2-3 y en directorios.
- **No registrar los descartes**: si un comercio que se evaluó no queda ni en el pipeline ni en
  `descartados.csv`, el cuadrante siguiente lo vuelve a traer y se evalúa otra vez.
- **Cerrar una casilla incompleta**: si `buscar-places` salió con exit 4, la casilla sigue pendiente.
