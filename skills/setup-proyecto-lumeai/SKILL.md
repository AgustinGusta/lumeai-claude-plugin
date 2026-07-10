---
name: setup-proyecto-lumeai
description: Automatiza la Fase 0 de un proyecto nuevo de LumeAI en Azure DevOps. Úsala cuando el usuario pida crear, dar de alta, arrancar o setear un proyecto nuevo (para un cliente o producto): crea el proyecto en Azure DevOps, crea el repo copiando la plantilla de lumeai-base, reemplaza los placeholders, y siembra Areas, Iterations y el Epic raíz del MVP. Corre en Claude Code con el MCP de Azure DevOps conectado.
---

# Setup de proyecto nuevo LumeAI (Fase 0)

Esta skill deja lista la fundación de un proyecto nuevo: proyecto en Azure DevOps + repo
desde la plantilla estándar + board inicial. Se apoya en el repo **`lumeai-base`** (proyecto
`LumeAI-Base` en la org `LumeAI`), que contiene el molde `repo-template/` y la doc de proceso.

## Requisitos (verificar antes de empezar)
- Estás en **Claude Code** (no Cowork).
- El **MCP de Azure DevOps** (`@azure-devops/mcp`) está conectado sobre la org `LumeAI`.
- Hay `git` disponible y acceso a Azure Repos.

Si falta el MCP, avisá al usuario y no sigas: sin él no se pueden crear proyecto/repo/work items.

## REGLA DE ORO: mostrá el plan y esperá OK antes de escribir nada
Antes de crear el proyecto, el repo o cualquier work item, mostrale al usuario el **plan
completo** (qué vas a crear y con qué nombres) y esperá su confirmación explícita. Nada de
crear recursos sin OK. Este es un paso obligatorio.

## Paso 0 — Recolectar datos del proyecto
Preguntá (o confirmá si el usuario ya los dio):

- **Nombre del producto/proyecto** (ej. `TottemApp`). De acá salen los placeholders:
  - `{{PROJECT}}` / `__PROJECT__` = el nombre tal cual (ej. `TottemApp`)
  - `{{project}}` = el nombre en minúsculas (ej. `tottemapp`)
- **Tipo**: producto **multi-tenant compartido** o **instancia dedicada de un cliente**.
  - Multi-tenant → nombre de repo = `<producto>` (ej. `tottemapp`).
  - Dedicada → nombre de repo = `<cliente>-<producto>` (ej. `cliente-a-appventas`).
- **Cliente** (si es instancia dedicada).
- **Service connection de Azure** en ADO (para `{{AZURE_SERVICE_CONNECTION}}` de los pipelines). Si no existe todavía, dejalo como placeholder y avisá que Infra lo completa en Fase 3.

No inventes ninguno de estos valores. Si falta el nombre del producto, pedilo.

## Paso 1 — Traer la plantilla (fuente única: lumeai-base en ADO)
Cloná `lumeai-base` desde Azure DevOps para tener siempre la última versión de la plantilla:

```bash
git clone https://dev.azure.com/LumeAI/LumeAI-Base/_git/lumeai-base /tmp/lumeai-base
```

La plantilla es `/tmp/lumeai-base/repo-template/`. No copies desde una carpeta local vieja:
usá siempre la del repo para no quedar desactualizado.

## Paso 2 — Armar el repo local del proyecto nuevo
Creá la carpeta del proyecto y copiá el **contenido** de `repo-template/` (no la carpeta en sí):

```bash
mkdir -p <ruta-destino>/<nombre-repo>
cp -r /tmp/lumeai-base/repo-template/. <ruta-destino>/<nombre-repo>/
```

## Paso 3 — Reemplazar placeholders
En todo el árbol del repo nuevo, reemplazá:
- `__PROJECT__` y `{{PROJECT}}` → nombre del producto (ej. `TottemApp`)
- `{{project}}` → nombre en minúsculas (ej. `tottemapp`)
- `{{AZURE_SERVICE_CONNECTION}}` → service connection (o dejar el placeholder si aún no existe)

Incluye **renombrar las carpetas** `backend/src/__PROJECT__.Api` (y `.Core/.Infra/.Jobs`) y
`backend/tests/__PROJECT__.Tests` al nombre real. Revisá que no queden placeholders sueltos:

```bash
grep -rn "__PROJECT__\|{{PROJECT}}\|{{project}}\|{{AZURE_SERVICE_CONNECTION}}" <nombre-repo> || echo "sin placeholders pendientes"
```

Dejá los `.gitkeep` por ahora (Infra los borra en Fase 3 al scaffoldear la solución .NET).

## Paso 4 — Crear el proyecto en Azure DevOps (vía MCP)
Con el MCP, creá el proyecto en la org `LumeAI`:
- Multi-tenant → nombre del proyecto = nombre del producto (ej. `TottemApp`).
- Dedicada → nombre del proyecto = cliente (ej. `Cliente-A`).

Nota: crear un **proyecto** puede requerir permisos de administrador de la organización.
Si el MCP no puede crearlo, pedile al usuario que lo cree una vez desde la web y seguí con el repo.

## Paso 5 — Crear el repo en ADO y pushear
Creá el repo Git vacío en el proyecto (vía MCP `repo_create`) con el nombre definido en el Paso 0.
Después, desde la carpeta del repo local:

```bash
cd <ruta-destino>/<nombre-repo>
git init
git add .
git commit -m "Initial commit: scaffold desde lumeai-base/repo-template"
git branch -M main
git remote add origin https://dev.azure.com/LumeAI/<PROYECTO>/_git/<nombre-repo>
git push -u origin main
git checkout -b develop && git push -u origin develop
```

## Paso 6 — Sembrar el board (vía MCP)
- **Areas**: `Backend`, `Frontend`, `Infra`, `QA` bajo el nodo del proyecto.
- **Iterations**: `Sprint 0` (Setup y Fundación), `Sprint 1`, `Backlog`.
- **Epic raíz del MVP**: crear un work item Epic con título `MVP <Producto>` (ej. `MVP TottemApp`),
  en Area `Backend`, Iteration `Sprint 1`. Este es el contenedor del MVP.

**No cargues User Stories acá.** Las US reales las produce el analista en Fase 1 y se suben
desde `docs/functional/backlog.yml` con el prompt de handoff (ver Paso 8).

## Paso 7 — Branch policies (recomendado)
En `main` y `develop` del repo nuevo, configurá (vía MCP o indicando al usuario):
- PR requerido (sin push directo).
- Build validation (cuando existan los pipelines).
- Link a work item obligatorio.

## Paso 8 — Cierre: resumen y próximos pasos
Mostrale al usuario:
- Links al proyecto, al repo y al Epic creados.
- Placeholders que quedaron pendientes (ej. service connection), si los hubo.
- Próximo paso: **Fase 1** — el analista redacta en Cowork, guarda `docs/functional/backlog.yml`
  y lo sube con el prompt de handoff que está en `docs/process/prompts/handoff-backlog-a-ado.md`
  del repo recién creado.
- Recordá crear el **proyecto en Claude Cowork** del cliente/producto y conectar este repo
  (la tercera pata del "de a tres": proyecto ADO + repo + proyecto Cowork).

## Errores comunes
- **No hay MCP de ADO** → frená y avisá; no sigas.
- **No podés crear el proyecto** (permisos) → que lo cree el usuario en la web; seguí con el repo.
- **Quedaron placeholders** → volvé al Paso 3; no pushees con `__PROJECT__` sin reemplazar.
- **Cargar US en Fase 0** → no. Solo el Epic raíz; las US van en Fase 1.
