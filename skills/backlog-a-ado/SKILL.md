---
name: backlog-a-ado
description: Sube las User Stories del analista a Azure DevOps desde docs/functional/backlog.yml. Úsala cuando el usuario pida cargar/subir el backlog, crear las User Stories en ADO, hacer el handoff de US, o pasar el análisis funcional al board (Fase 1 del flujo LumeAI). Respeta la jerarquía Epic → Feature → User Story, mapea los campos, linkea el diseño, y trabaja con dry-run e idempotencia. Corre en Claude Code (o Cowork) con el MCP de Azure DevOps conectado.
---

# Backlog a Azure DevOps (Fase 1)

Esta skill toma el `docs/functional/backlog.yml` que dejó el analista y crea/actualiza los
work items en Azure DevOps vía MCP, respetando la jerarquía y sin duplicar. Es el handoff
determinístico del análisis funcional al board.

## Modelo (leer antes de tocar el board)
- **Epic = capacidad** del producto (Pedidos, Pagos…), estable entre versiones. Es el nivel superior del `backlog.yml` (`epics:`), **no** una versión.
- **Feature** = entregable dentro de la capacidad.
- **User Story** = unidad del analista, con criterios. Lleva **Epic + Iteration**, y **NO lleva Area** (la US es multidisciplinar).
- **Iteration = `version\sprint`**: se arma con el campo `version` del YAML + el `sprint` de cada story (ej. `MVP` + `Sprint 1` → `<Proyecto>\MVP\Sprint 1`).
- **Area = disciplina** (Dev/Diseño/Infra/QA): va **a nivel Task**, y las Tasks se crean río abajo (Fases 2/4/5). **Esta skill NO crea Tasks ni asigna Area.**

## Requisitos (verificar antes de empezar)
- **MCP de Azure DevOps** (`@azure-devops/mcp`) conectado sobre la org `LumeAI`. Sin él, frená.
- Existe el archivo **`docs/functional/backlog.yml`** en el repo (formato del `repo-template`).
- El **proyecto ADO ya existe** y tiene sus **Iterations** (`setup-proyecto-lumeai` siembra `<version>\<sprint>` en Fase 0). Si una Iteration referenciada no existe, avisá antes de crear la US.

## REGLA DE ORO: mostrá el plan y esperá OK antes de escribir nada
Antes de crear o actualizar cualquier work item, mostrá el **plan completo** (qué se crea,
qué se actualiza, con qué padre) y esperá confirmación explícita del usuario. Este dry-run
es obligatorio.

## Paso 0 — Ubicar y validar el backlog
- Leé `docs/functional/backlog.yml`. Validá que sea YAML bien formado (si falla el parseo, mostrá el error y frená).
- Confirmá el **proyecto ADO destino** (nombre). Si no es evidente por el contexto, preguntá.
- Tomá el campo **`version`** (ej. `MVP`). Para cada story, la Iteration destino es `<Proyecto>\<version>\<sprint>`.
- Chequeá que esas **Iterations** existan en el proyecto (vía MCP). Reportá las que falten (no las autocrees).

## Paso 1 — Leer lo existente (para no duplicar)
Consultá los work items actuales del proyecto (por título) para saber qué ya existe. La
**idempotencia se resuelve por título**: si un Epic/Feature/US con el mismo título ya existe,
se **actualiza**; si no, se **crea**.

## Paso 2 — Armar el plan
Construí y mostrá una lista clara:
- Por cada Epic (capacidad) del YAML: crear/actualizar.
- Por cada Feature: crear/actualizar, con su Epic como padre.
- Por cada Story: crear/actualizar, con su Feature como padre, y los campos mapeados.

Esperá el OK.

## Paso 3 — Crear/actualizar (vía MCP `wit_create_work_item` / `wit_update_work_item`)
Respetá el orden **Epic → Features → Stories** para poder linkear padres.

### Mapeo de campos (YAML → ADO)
| YAML | Campo ADO (reference name) |
|---|---|
| `title` (epic/feature/story) | `System.Title` |
| `description` | `System.Description` |
| `acceptance_criteria` (lista) | `Microsoft.VSTS.Common.AcceptanceCriteria` (unir en HTML/lista) |
| `priority` | `Microsoft.VSTS.Common.Priority` |
| `estimate` | `Microsoft.VSTS.Scheduling.StoryPoints` |
| `version` + `sprint` | `System.IterationPath` (= `<Proyecto>\<version>\<sprint>`) |
| `design_url` | link/hyperlink en la US (o al final de la descripción si no hay pantalla aún) |

**Area NO se mapea:** la US no lleva `System.AreaPath` de disciplina (queda en el nodo raíz del proyecto). El Area se asigna a nivel Task, y las Tasks las crean otras skills/fases.

### Jerarquía
Linkeá cada work item con su padre usando la relación **`System.LinkTypes.Hierarchy-Reverse`**
(hijo → padre) al crear la Feature/US. Tipos de work item: `Epic` (capacidad), `Feature`,
`User Story` (proceso Agile del proyecto base).

### Notas a validar en el primer run (posibles gotchas)
- Los **reference names** de `AcceptanceCriteria` y `StoryPoints` son de proceso **Agile**; si el
  proyecto usa otro proceso, ajustá. Confirmá contra `GET .../wit/fields` si algo no toma.
- `IterationPath` debe existir **exactamente** (`<Proyecto>\<version>\<sprint>`, sembrado en Fase 0). No se autocrea acá.
- `design_url` es una ruta relativa del repo (ej. `design/screens/login.html`); dejala como
  texto/relación, no intentes resolverla a URL absoluta salvo que el usuario lo pida.

## Paso 4 — Idempotencia
Nunca crees un duplicado: si el título ya existe en el proyecto, actualizá ese work item
(campos + relaciones) en vez de crear uno nuevo. Así el analista puede corregir el YAML y
volver a correr la skill sin ensuciar el board.

## Paso 5 — Cierre: reporte
Mostrá:
- Cuántos work items se **crearon** y cuántos se **actualizaron** (Epics/Features/Stories).
- Links a los work items creados.
- Iterations faltantes, si las hubo (para sembrarlas y re-correr).
- Próximo paso: **Fase 2** (diseño) — el diseñador cubre las US con pantallas y linkea el HTML.

## Errores comunes
- **No hay MCP de ADO** → frená y avisá.
- **YAML inválido** → mostrá el error de parseo y no toques el board.
- **Iteration inexistente** (`<version>\<sprint>`) → reportala; no crees la US con path inválido.
- **Asignar Area a la US** → no. La US va sin Area de disciplina; el Area es de las Tasks.
- **Crear un Epic por versión** → no. Los Epics son capacidades; la versión va en la Iteration.
- **Duplicar en vez de actualizar** → siempre matchear por título primero (Paso 1).
- **Cargar US en un proyecto equivocado** → confirmá el proyecto destino en el Paso 0.
