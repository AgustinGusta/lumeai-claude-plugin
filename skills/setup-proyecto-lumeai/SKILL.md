---
name: setup-proyecto-lumeai
description: Automatiza la Fase 0 de un proyecto nuevo de LumeAI en Azure DevOps. Úsala cuando el usuario pida crear, dar de alta, arrancar o setear un proyecto nuevo (para un cliente o producto): crea el proyecto en Azure DevOps, crea el repo copiando la plantilla de lumeai-base, reemplaza los placeholders, y siembra los ejes del board (Areas por disciplina e Iterations por versión, sin sprints). No crea Epics ni US. Corre en Claude Code con el MCP de Azure DevOps conectado.
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

## Paso 4 — Crear el proyecto en Azure DevOps (vía REST API)
**El MCP de Azure DevOps NO expone crear-proyecto**; hacelo por REST API con el PAT (auth Basic; el
PAT sale de la config del MCP `azure-devops`). Nombre del proyecto:
- Multi-tenant → nombre del producto (ej. `TottemApp`).
- Dedicada → cliente (ej. `Cliente-A`).

El `templateTypeId` debe ser un **type id base** de `GET /_apis/work/processes` (Agile
`adcc42ab-9882-485e-a3ed-7678f01f66bc`, Scrum `6b724908-…`, Basic `b8a3a935-…`). **No uses** el
`CurrentProcessTemplateId` del proyecto base: no es un type id válido y da `VS402362 ProcessNotFound`.
Para matchear el proceso del proyecto base, mirá su `System.ProcessTemplateType`
(`GET /_apis/projects/{id}/properties`) y usá ese id (LumeAI-Base = Agile).

La creación es **asíncrona**: el POST devuelve `202` con un operation id; hacé poll a
`/_apis/operations/{id}` hasta `succeeded`.

```bash
# PAT del MCP (base64 de user:PAT) -> header Basic
AUTH=$(python -c "import json;print(json.load(open('<~/.claude.json>'))['mcpServers']['azure-devops']['env']['PERSONAL_ACCESS_TOKEN'])")
curl -sS -X POST "https://dev.azure.com/LumeAI/_apis/projects?api-version=7.1" \
  -H "Authorization: Basic $AUTH" -H "Content-Type: application/json" \
  -d '{"name":"<PROYECTO>","description":"...","capabilities":{"versioncontrol":{"sourceControlType":"Git"},"processTemplate":{"templateTypeId":"adcc42ab-9882-485e-a3ed-7678f01f66bc"}}}'
# luego poll /_apis/operations/{id} hasta status=succeeded
```

Nota: crear proyecto requiere permisos de admin en la org. Si el PAT no los tiene, pedile al usuario
que lo cree una vez desde la web y seguí con el repo.

## Paso 5 — Repo en ADO y pushear
**Ojo:** al crear el proyecto con control Git (Paso 4), ADO **auto-genera un repo default** con el
mismo nombre del proyecto (ej. `TottemApp`). Los nombres de repo son **case-insensitive**, así que
crear uno nuevo `<nombre-repo>` (minúsculas) choca con `409 GitRepositoryNameAlreadyExists`.
El MCP tampoco expone crear-repo. Entonces, **renombrá el repo default** al nombre del Paso 0 (vía REST):

```bash
# id del repo default del proyecto
RID=$(curl -sS "https://dev.azure.com/LumeAI/<PROYECTO>/_apis/git/repositories?api-version=7.1" \
      -H "Authorization: Basic $AUTH" | python -c "import sys,json;print(json.load(sys.stdin)['value'][0]['id'])")
# renombrar a <nombre-repo> (minúsculas)
curl -sS -X PATCH "https://dev.azure.com/LumeAI/<PROYECTO>/_apis/git/repositories/$RID?api-version=7.1" \
  -H "Authorization: Basic $AUTH" -H "Content-Type: application/json" -d '{"name":"<nombre-repo>"}'
```

*(Si el proyecto ya existía y no hay repo default, ahí sí creá el repo por REST:
`POST /_apis/git/repositories` con `{"name":"<nombre-repo>"}`.)*

Después, desde la carpeta del repo local:

```bash
cd <ruta-destino>/<nombre-repo>
export GIT_TERMINAL_PROMPT=0   # que no cuelgue pidiendo credenciales
git init
git add .
git commit -m "Initial commit: scaffold desde lumeai-base/repo-template"
git branch -M main
git remote add origin https://dev.azure.com/LumeAI/<PROYECTO>/_git/<nombre-repo>
git push -u origin main
git checkout -b develop && git push -u origin develop
```

Si el push cuelga o pide password, falta la credencial cacheada de `dev.azure.com` (ver los requisitos).

## Paso 6 — Sembrar el board (vía MCP)
Solo la clasificación (los ejes del board). **No se crean work items en Fase 0.**

- **Areas = disciplina** (a nivel Task): `Infra`, `Dev`, `Diseño`, `QA` bajo el nodo del proyecto.
- **Iterations = versión** (SIN sprints, flujo continuo/Kanban): crear el nodo de versión **`MVP`** a
  nivel raíz, más `Backlog` para lo no planificado:
  ```
  <Proyecto>
   ├─ MVP
   └─ Backlog
  ```
  (La `v1` y siguientes se agregan al abrir cada versión, no acá.)
  Nota: los nodos de versión son **planos**, así que el MCP (`work_create_iterations`) los crea sin problema — no hace falta REST para esto (a diferencia de crear el proyecto/repo).

**No crees Epics ni User Stories acá.** Los Epics son **capacidades** (Pedidos, Pagos…) y todavía
no se conocen en Fase 0: los crea `backlog-a-ado` en Fase 1 a partir de `docs/functional/backlog.yml`.
El seed deja solo los ejes (Areas + Iterations) listos para que las US aterricen encima.

## Paso 7 — Branch policies (recomendado)
En `main` y `develop` del repo nuevo, configurá (vía MCP o indicando al usuario):
- PR requerido (sin push directo).
- Build validation (cuando existan los pipelines).
- Link a work item obligatorio.

## Paso 7b — Permiso para que el pipeline resuelva work items
El pipeline `backend-pipeline.yml` (de la plantilla) tiene un stage que, al mergear a `develop`,
pasa las **US/Bug** asociadas a **Resolved** usando la identidad del build (`System.AccessToken`).
Para que funcione, esa identidad necesita permiso de **edición de work items**:
- Identidad: **`<Proyecto> Build Service (<Org>)`** (o `Project Collection Build Service`).
- Permiso: **"Edit work items in this node"** en el/los Area Path del proyecto (namespace de seguridad de work items).
- Cómo: por REST (security namespaces/ACLs) o, si resulta fiddly, **otorgarlo una vez desde la web**
  (Project Settings → Permissions / Area Paths → Security). **Verificá esto en el primer run real** —
  el nombre exacto de la build identity y el alcance del permiso se afinan la primera vez.

Si el permiso no está, el stage falla al hacer el PATCH; el resto del pipeline no se ve afectado.

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
- **`VS402362 ProcessNotFound` al crear proyecto** → usaste un `templateTypeId` inválido (ej. el
  `CurrentProcessTemplateId`). Usá un type id base de `/_apis/work/processes` (Paso 4).
- **`409 GitRepositoryNameAlreadyExists` al crear el repo** → el proyecto ya tiene un repo default con
  su nombre. No crees uno nuevo: **renombrá el default** al nombre del Paso 0 (Paso 5).
- **Quedaron placeholders** → volvé al Paso 3; no pushees con `__PROJECT__` sin reemplazar.
- **Crear Epics o US en Fase 0** → no. El seed deja solo Areas + Iterations; los Epics=capacidad y las US los crea `backlog-a-ado` en Fase 1.
