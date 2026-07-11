---
name: backlog-a-ado
description: Sube y sincroniza las User Stories del analista a Azure DevOps desde docs/functional/backlog.yml. Úsala cuando el usuario pida cargar/subir el backlog, crear o actualizar las User Stories en ADO, hacer el handoff de US, o pasar el análisis funcional al board (Fase 1 del flujo LumeAI). Respeta la jerarquía Epic(capacidad) → Feature → User Story, valida el yml, mapea los campos, linkea el diseño, y trabaja con dry-run. Idempotencia por ID con write-back al yml (crea lo nuevo, actualiza lo existente, reporta huérfanos sin borrar). Corre en Claude Code (o Cowork) con el MCP de Azure DevOps conectado.
---

# Backlog a Azure DevOps (Fase 1)

Esta skill toma el `docs/functional/backlog.yml` que dejó el analista y crea/actualiza los
work items en Azure DevOps vía MCP, respetando la jerarquía y sin duplicar. Es el handoff
determinístico del análisis funcional al board.

## Responsabilidad y fuente única
Esta skill es dueña de **dos cosas**: la **validez estructural** del yml (Paso 0) y la **escritura
consistente** en ADO (mapeo + casa de estilo). **No** es dueña de la calidad de autoría de las US
—cómo se redactan, cuántos criterios— eso lo define `generar-backlog`. El **modelo canónico** vive
en `lumeai-base/docs/proceso-y-estructura.md` §3; las validaciones de abajo son una **red de
seguridad** (por si alguien editó el yml a mano), no la autoridad. Si el modelo cambia, manda el doc.

## Modelo (leer antes de tocar el board)
- **Epic = capacidad** del producto (Pedidos, Pagos…), estable entre versiones. Es el nivel superior del `backlog.yml` (`epics:`), **no** una versión.
- **Feature** = entregable dentro de la capacidad.
- **User Story** = unidad del analista, con criterios. Lleva **Epic + Iteration**, y **NO lleva Area** (la US es multidisciplinar).
- **Iteration = `version`** (MVP, v1…): el campo `version` del YAML → `<Proyecto>\<version>`. **SIN sprints:** trabajo en flujo continuo (Kanban); se ordena por `priority`.
- **Area = disciplina** (Dev/Diseño/Infra/QA): va **a nivel Task**, y las Tasks se crean río abajo (Fases 2/4/5). **Esta skill NO crea Tasks ni asigna Area.**

## Requisitos (verificar antes de empezar)
- **MCP de Azure DevOps** (`@azure-devops/mcp`) conectado sobre la org `LumeAI`. Sin él, frená.
- Existe el archivo **`docs/functional/backlog.yml`** en el repo (formato del `repo-template`).
- El **proyecto ADO ya existe** y tiene su **Iteration de versión** (`setup-proyecto-lumeai` siembra el nodo `<version>` en Fase 0). Si la versión referenciada no existe, avisá antes de crear la US.

## REGLA DE ORO: mostrá el plan y esperá OK antes de escribir nada
Antes de crear o actualizar cualquier work item, mostrá el **plan completo** (qué se crea,
qué se actualiza, con qué padre) y esperá confirmación explícita del usuario. Este dry-run
es obligatorio.

## Paso 0 — Validación exhaustiva del backlog (antes de tocar ADO)
Leé `docs/functional/backlog.yml` y **validá todo esto**; si algo falla, mostrá el/los error(es) y **frená sin escribir en el board**:

1. **Parseo:** es YAML bien formado.
2. **Estructura:** existe `version` (string no vacío) y `epics` (lista no vacía). Cada Epic tiene `title` y `features`; cada Feature tiene `title` y `stories`; cada Story tiene `title`.
3. **Epic ≠ versión:** ningún `title` de Epic es una versión (`MVP`, `v1`, `v1.0`, "Versión…"). Si lo es, es un error de modelado → reportalo.
4. **US bien formada:** cada story tiene título "Como … quiero … para …", al menos 1 `acceptance_criteria`, `priority` (entero) y `estimate` (número).
5. **Sin Area:** ninguna story trae campo `area` (el Area es de las Tasks). Si aparece, avisá que se ignora.
6. **IDs coherentes:** los `id` presentes son enteros y **únicos** en el archivo (no repetidos).
7. **Iteration de versión existente:** `<Proyecto>\<version>` debe existir en el proyecto (consultá vía MCP). Si falta, reportalo; **no la autocrees**.

Confirmá también el **proyecto ADO destino**. Si no es evidente por el contexto, preguntá.

## Paso 1 — Resolver qué crear y qué actualizar (matcheo por ID)
La **idempotencia se resuelve por `id`**, no por título (así podés renombrar sin duplicar):

- Ítem **con `id`** en el yml → es existente: buscalo por ID (`wit_get_work_item`) y marcá para **actualizar**.
- Ítem **sin `id`** → es nuevo: marcá para **crear** (y en el Paso 3 se le escribe el `id` de vuelta).
- Como red de seguridad, si un ítem sin `id` tiene el **mismo título** que un work item ya existente del proyecto, avisá (posible duplicado) y preguntá antes de crear.
- **Huérfanos:** work items del board (bajo los Epics del producto) que **no** están en el yml → **listalos como huérfanos, NO los borres**. El borrado lo decide el usuario a mano.

## Paso 2 — Armar el plan
Construí y mostrá una lista clara:
- Por cada Epic (capacidad) del YAML: crear/actualizar.
- Por cada Feature: crear/actualizar, con su Epic como padre.
- Por cada Story: crear/actualizar, con su Feature como padre, y los campos mapeados.

Esperá el OK.

## Paso 3 — Crear/actualizar + write-back de IDs (vía MCP `wit_create_work_item` / `wit_update_work_item`)
Respetá el orden **Epic → Features → Stories** para poder linkear padres.

### Mapeo de campos (YAML → ADO)
| YAML | Campo ADO (reference name) |
|---|---|
| `id` | `System.Id` (matcheo; **write-back**, ver abajo) |
| `title` (epic/feature/story) | `System.Title` |
| `description` | `System.Description` |
| `acceptance_criteria` (lista) | `Microsoft.VSTS.Common.AcceptanceCriteria` (unir en HTML/lista) |
| `priority` | `Microsoft.VSTS.Common.Priority` |
| `estimate` | `Microsoft.VSTS.Scheduling.StoryPoints` |
| `version` | `System.IterationPath` (= `<Proyecto>\<version>`) |

**Area NO se mapea:** la US no lleva `System.AreaPath` de disciplina (queda en el nodo raíz del proyecto). El Area se asigna a nivel Task, y las Tasks las crean otras skills/fases.

**Diseño NO se mapea:** el `backlog.yml` es puro funcional (sin `design_url`). El vínculo US↔pantalla lo maneja la skill `disenar-pantalla` en Fase 2 (vía `design/screens/screens-map.yml` + MCP). No agregues links de diseño acá.

### Casa de estilo (para que todos los proyectos queden idénticos en forma)
Aplicá siempre estas convenciones al escribir el work item, sin importar cómo venga redactado el yml:
- **Estado inicial:** al **crear**, `System.State = New`. No cambiar el estado al **actualizar** (respetá el que tenga en el board).
- **Título:** el `title` del yml tal cual (sin prefijos ni `[Área]`).
- **Descripción:** `System.Description` en HTML simple; el `description` del yml como uno o más `<p>`.
- **Criterios de aceptación:** SIEMPRE como lista HTML `<ul><li>…</li></ul>`, un `<li>` por criterio del yml. Nunca texto plano concatenado.
- **AreaPath:** el **nodo raíz del proyecto** (la US no lleva disciplina). Nunca `\Dev`, `\QA`, etc.
- **IterationPath:** `<Proyecto>\<version>` exacto (sin sprint).
- **Tags:** no inventar. Solo poner `System.Tags` si el yml los trae (transversales tipo `tech-debt`, `blocked`); la versión NO va como tag (va en la Iteration).
- **Tipos:** `Epic` (capacidad), `Feature`, `User Story`.

### Write-back de IDs (clave para poder modificar después)
Cada vez que **creás** un work item (Epic/Feature/Story), tomá el `System.Id` que devuelve ADO y
**escribilo de vuelta en el nodo correspondiente del `backlog.yml`** como campo `id:`. Para los
ítems que **actualizás**, el `id` ya está y no cambia. Al terminar, el yml queda anotado con todos
los IDs → así en la próxima corrida el matcheo por ID es exacto y podés renombrar sin duplicar.
Guardá el yml modificado y avisá al usuario que **debe commitear** esa versión anotada.

### Jerarquía
Linkeá cada work item con su padre usando la relación **`System.LinkTypes.Hierarchy-Reverse`**
(hijo → padre) al crear la Feature/US. Tipos de work item: `Epic` (capacidad), `Feature`,
`User Story` (proceso Agile del proyecto base).

### Notas a validar en el primer run (posibles gotchas)
- Los **reference names** de `AcceptanceCriteria` y `StoryPoints` son de proceso **Agile**; si el
  proyecto usa otro proceso, ajustá. Confirmá contra `GET .../wit/fields` si algo no toma.
- `IterationPath` debe existir **exactamente** (`<Proyecto>\<version>`, sembrado en Fase 0). No se autocrea acá.

## Paso 4 — Idempotencia (por ID) y huérfanos
- **No duplicar:** el matcheo es por `id` (Paso 1). Ítem con `id` → se actualiza; sin `id` → se crea y se le escribe el `id` (Paso 3). Así el analista corrige el yml, incluso renombrando, y vuelve a correr sin ensuciar el board.
- **Huérfanos:** los work items del board que no están en el yml se **reportan**, nunca se borran. El usuario decide.

## Paso 5 — Cierre: reporte
Mostrá:
- Cuántos work items se **crearon** y cuántos se **actualizaron** (Epics/Features/Stories).
- Links a los work items creados/actualizados.
- **Recordatorio de commit:** el `backlog.yml` quedó anotado con los `id` nuevos → hay que **commitear + pushear** esa versión (si no, la próxima corrida no tendrá los IDs y puede duplicar).
- **Huérfanos** detectados (work items en el board sin entrada en el yml), si los hubo.
- Iterations faltantes, si las hubo (para sembrarlas y re-correr).
- Próximo paso: **Fase 2** (diseño) — el diseñador cubre las US con pantallas y linkea el HTML.

## Errores comunes
- **No hay MCP de ADO** → frená y avisá.
- **YAML inválido o incompleto** → mostrá los errores del Paso 0 y no toques el board.
- **Iteration de versión inexistente** (`<version>`) → reportala; no crees la US con path inválido.
- **Asignar Area a la US** → no. La US va sin Area de disciplina; el Area es de las Tasks.
- **Crear un Epic por versión** → no. Los Epics son capacidades; la versión va en la Iteration.
- **Matchear por título en vez de por ID** → no. El título puede cambiar; el matcheo es por `id` (Paso 1).
- **No commitear el yml con los IDs** → rompe el próximo run (duplica). Recordáselo al usuario en el cierre.
- **Borrar huérfanos automáticamente** → no. Solo reportar.
- **Cargar US en un proyecto equivocado** → confirmá el proyecto destino en el Paso 0.
