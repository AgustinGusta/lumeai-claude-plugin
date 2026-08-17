---
name: crear-pagina-wiki
description: Crea o edita páginas de la wiki de Azure DevOps respetando las convenciones del repo. Úsala cuando el usuario pida agregar una página a la wiki, documentar algo en la wiki, crear una sección nueva, mover o renombrar páginas, o actualizar una página existente. Cubre el naming de archivos (%2D, .order), el formato que hace que la página sea recuperable por search_wiki, el flujo de git contra ADO y la verificación posterior. Corre en Claude Code con el repo de wiki clonado y el MCP de ADO.
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
- **Verificá con `get_page_content`, nunca con `search_wiki`.** El índice de búsqueda de ADO **tarda** en actualizarse tras un push; buscar una página recién creada devuelve contenido viejo o nada.
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
- **Escribí para que sea recuperable.** `search_wiki` es **léxico** (matchea palabras, no significado) y devuelve **fragmentos sueltos**, no la página entera. Entonces:
  - Cada línea tiene que entenderse sola. Nada de "esta herramienta hace X" refiriéndose a un título de más arriba: si ese fragmento sale solo en un resultado, no dice nada.
  - Sembrá el vocabulario que la persona usaría de verdad al describir la tarea, con sinónimos y forma coloquial.
- **Si la página habla *sobre* la wiki** (convenciones, índices, meta) **no incluyas frases de búsqueda reales**, ni entre comillas como ejemplo: el match exacto la hace ganar y tapa a la página que corresponde. Describí el patrón en abstracto.

> Si la página que estás creando es una **herramienta del catálogo**, el formato específico
> (plantilla, valores del campo Estado, cómo redactar "Cuándo usarla") vive en la wiki, en
> `/Herramientas/Cómo agregar una herramienta`. Leela antes de escribir: acá está la mecánica
> del wiki, allá está la política del catálogo.

## Paso 3 — Actualizar `.order` y el índice padre

El archivo `.order` de cada carpeta define el orden del sidebar. Una línea por página, **sin `.md`** y **con el `%2D`**:

```
Cómo-agregar-una-herramienta
frontend%2Ddesign
template.net
```

Si la página no está en `.order` igual existe, pero queda al final y desordenada.

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

## Paso 6 — Probar que se encuentra

Una página que nadie recupera es una página que no existe, y **nadie se entera**: el equipo consulta la wiki por búsqueda, no navegando, así que un fallo de indexación es invisible.

Probá con `search_wiki` **una consulta en lenguaje natural**, como la escribiría un compañero — no el título de la página. La página nueva debería salir primera. Si no sale, le falta vocabulario: volvé al Paso 2.

Por el retraso del índice, esta prueba **puede requerir esperar** después del push. Si devuelve contenido viejo (comparable por `contentId`), todavía no indexó: no es un fallo de la página.

## Errores comunes
- **Reescribir una página y perder lo que ya tenía** → leela entera antes de tocarla.
- **Guion literal sin `%2D`** → el título sale con espacio en vez de guion.
- **Olvidar el `.order`** → la página queda suelta al final del sidebar.
- **Linkear con el nombre de archivo** (`/Herramientas/frontend%2Ddesign`) → el link va con el **título** (`/Herramientas/frontend-design`).
- **Crear la subpágina sin agregarla al índice padre** → solo se llega por búsqueda.
- **Dar por fallido un push por el `fatal:` de GCM** → mirá la línea del rango de commits.
- **Verificar con `search_wiki` recién pusheado** → el índice va atrasado; usá `get_page_content`.
