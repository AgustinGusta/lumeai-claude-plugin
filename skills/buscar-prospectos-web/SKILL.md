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

## Rutas

- Carpeta de prospectos web, `_config.md` y `pipeline.csv`: como en la skill `demo-web`
  (`<Lume>/01-Comercial/Prospectos/Webs/`).
- Scripts compartidos: `../demo-web/scripts/` (relativo a esta skill).

## Paso 1 — Buscar candidatos

Usá **WebSearch** con varias formulaciones, como buscaría un cliente de ese negocio:
`<rubro> <zona>`, `<rubro> en <barrio>`, `mejor <rubro> <zona>`, `<rubro> <zona> teléfono`.
También directorios locales (Páginas Amarillas Uruguay, guías del rubro, cámaras empresariales) y
los links a web que aparecen en fichas de Google / Instagram de negocios del rubro.

Juntá unas 3 veces la cantidad pedida de **dominios propios** en `urls.txt` (en el scratchpad).
Filtrá desde ya:
- Directorios, marketplaces, redes sociales, Mercado Libre, perfiles de Google (no son "su web").
- Cadenas, franquicias, empresas grandes, organismos públicos.
- Dominios que ya están en el pipeline: `node ../demo-web/scripts/pipeline.mjs <csv> existe <url>`.

Negocios **sin web** (solo Instagram): anotalos aparte en el resumen como "sin web"; son otro
pitch (web nueva), no demo de rediseño.

## Paso 2 — Puntuar automáticamente

```
node ../demo-web/scripts/evaluar-sitio.mjs --file urls.txt --json evaluacion.json [--psi]
```

`--psi` solo si existe `PSI_API_KEY` (hace todo más lento pero suma la velocidad real en celular).
"oportunidad" alto = web más floja. Los sitios **caídos** son un caso aparte: mencionalos, pero no
son candidatos a demo (no hay de dónde sacar contenido).

## Paso 3 — Revisión visual de los mejores

Las señales automáticas no ven el diseño. Para los ~15 mejores, sacá una captura mobile (390 px)
y una desktop de la home con Playwright y mirala. Calificá **diseño 1-5** (1 = muy viejo o
roto, 5 = moderno y prolijo) y anotá en una frase qué se ve mal.

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
