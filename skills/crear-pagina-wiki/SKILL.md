---
name: crear-pagina-wiki
description: Crea o edita páginas de la wiki de Azure DevOps respetando las convenciones del repo. Úsala cuando el usuario pida agregar una página a la wiki, documentar algo en la wiki, crear una sección nueva, mover o renombrar páginas, o actualizar una página existente. Cubre el naming de archivos (%2D, .order), los links por título, el flujo de git contra ADO y la verificación posterior. EXCEPCIÓN: si lo que se agrega es una herramienta al catálogo de Herramientas (un plugin, una skill, un MCP server), usá agregar-herramienta-wiki en vez de esta. Corre en Claude Code con el repo de wiki clonado y el MCP de ADO.
---

# Crear o editar una página de wiki

Las wikis de ADO son **repos de git**: cada página es un `.md` y el naming de archivo no es libre.
Equivocarse en el naming no da error, simplemente **la página aparece con el título mal** o no aparece.

Esta skill cubre las convenciones ya verificadas contra el render real de ADO.

## Requisitos
- **Claude Code** + el repo de wiki **clonado localmente** (para lotes) o el **MCP de ADO** (para una página suelta).
- Saber en qué **sección** va la página, o acordarlo con el usuario antes de escribir.

## Guardrails (fijos)
- **Nunca pises contenido existente.** Antes de reescribir una página, leela entera. Si tiene contenido que no vas a conservar, avisá y preguntá — no lo borres en silencio.
- **No inventes.** Si documentás una herramienta, comando o URL, verificalo antes. Un comando de instalación inventado es peor que no tener la página.
- **Verificá leyendo la página con `get_page_content`.** No confirmes por búsqueda: el índice de ADO tarda en actualizarse tras un push y devuelve contenido viejo.
- **El contenido va en español**, siguiendo el tono del resto de la wiki (rioplatense, directo).

## Paso 0 — Elegir el mecanismo

| Caso | Mecanismo |
|---|---|
| Una página suelta, cambio chico | MCP: `wiki_upsert_page` |
| Varias páginas, sección nueva, mover archivos | **Clone de git** (permite `.order`, mover y revisar el diff antes de subir) |

Para el clone, si no está en la máquina:

```
git clone https://LumeAI@dev.azure.com/LumeAI/Interno/_git/Interno.wiki
```

La rama de una wiki de ADO es **`wikiMaster`**, no `main`.

## Paso 1 — Nombrar el archivo (lo más importante)

El nombre del `.md` determina el título de la página:

| En el título querés | En el archivo va | Ejemplo |
|---|---|---|
| espacio | `-` | `Control-de-versiones.md` → "Control de versiones" |
| guion literal | `%2D` | `frontend%2Ddesign.md` → "frontend-design" |
| punto | `.` (tal cual) | `template.net.md` → "template.net" |
| acento / ñ | tal cual, en UTF-8 | `Lineamientos-arquitectónicos.md` |

**El error clásico:** escribir `frontend-design.md` pensando en el guion literal. Eso renderiza como
"frontend design", con espacio. Todo guion que el lector deba ver va como `%2D`.

Una página con subpáginas necesita **archivo + carpeta del mismo nombre**: `Herramientas.md` y `Herramientas/`.

## Paso 2 — Escribir la página

- Si es larga, arrancá con `[[_TOC_]]`.
- **Links internos:** usan el **título real** con `%20` por espacio, **no** el nombre de archivo:
  `[Cómo agregar una herramienta](/Herramientas/Cómo%20agregar%20una%20herramienta)`
- **Escribí para que se lea.** La wiki la leen personas navegando, no un agente buscando: prioridad a que se entienda de un vistazo, no a repetir palabras clave.
- **Toda página nueva tiene que quedar enlazada** desde su índice padre. Si no, solo se llega por el sidebar y en la práctica no existe.
- **Empezá por el problema que resuelve**, no por la descripción formal. Y si hay un límite o una alternativa mejor, decilo.

> Si lo que estás agregando es una **herramienta del catálogo** (un plugin, una skill, un MCP
> server), **esta no es la skill**: usá `agregar-herramienta-wiki`, que además de la mecánica
> trae la plantilla, la regla para elegir el tipo y los cuatro índices que hay que actualizar.

## Paso 3 — Actualizar `.order` y el índice padre

El archivo `.order` de cada carpeta define el orden del sidebar. Una línea por página, **sin `.md`** y **con el `%2D`**:

```
Cómo-agregar-una-herramienta
frontend%2Ddesign
template.net
```

Si la página no está en `.order` igual existe, pero queda al final y desordenada.

> Esto **incluye a `Home`**. ADO no le da tratamiento especial: si no la ponés en el `.order` de la raíz, la página de entrada de la wiki aparece última en el sidebar.

Si la sección tiene una página índice (tipo `Herramientas.md`), **agregá también la fila ahí**. Una página nueva que nadie linkea solo se encuentra por búsqueda.

## Paso 4 — Commit y push

Contra `dev.azure.com` hay que habilitar el prompt de credenciales, o git falla con
`could not read Password ... terminal prompts disabled`:

```
$env:GIT_TERMINAL_PROMPT=1; $env:GCM_INTERACTIVE='auto'; git push origin wikiMaster
```

> GCM imprime `fatal: Cannot determine the organization name for this 'dev.azure.com' remote URL`
> aunque el push **funcione**. Es ruido de un helper de la cadena; otro resuelve la credencial.
> **Mirá el resultado real** (`abc123..def456  wikiMaster -> wikiMaster`), no ese `fatal:`.

Los repos de wiki van a **push directo**, sin PR.

## Paso 5 — Verificar el render

Con el MCP, confirmá que ADO resolvió bien los títulos:

```
wiki → get_page, path=/LaSección, recursionLevel=OneLevel
```

Revisá que cada `path` sea el título esperado (no uno con guiones donde iban espacios) y que el orden coincida con `.order`. Para el contenido, `get_page_content`.

## Paso 6 — Chequear los links

Los links rotos no dan error: llevan a una página vacía. Y como van por **título** y no por nombre de archivo, es el error más fácil de cometer.

Listá los links internos de la wiki y confirmá que cada destino existe:

```bash
grep -rhoE "\]\(/[^)]*\)" --include="*.md" . | sort -u
```

Compará contra los `path` que devuelve `get_page` con `recursionLevel=Full`. Cualquier link que use guiones donde el título tiene espacios está roto.

## Errores comunes
- **Reescribir una página y perder lo que ya tenía** → leela entera antes de tocarla.
- **Mover una carpeta sin reescribir los links que apuntaban ahí** → después de cualquier `git mv`, corré el chequeo del Paso 6 sobre toda la wiki, no solo sobre lo que moviste.
- **Guion literal sin `%2D`** → el título sale con espacio en vez de guion.
- **Olvidar el `.order`** → la página queda suelta al final del sidebar.
- **Linkear con el nombre de archivo** (`/Herramientas/frontend%2Ddesign`) → el link va con el **título** (`/Herramientas/frontend-design`).
- **Crear la subpágina sin agregarla al índice padre** → queda huérfana; en la práctica nadie la encuentra.
- **Dar por fallido un push por el `fatal:` de GCM** → mirá la línea del rango de commits.
- **Confirmar por búsqueda una página recién pusheada** → el índice de ADO va atrasado; leé la página con `get_page_content`.
