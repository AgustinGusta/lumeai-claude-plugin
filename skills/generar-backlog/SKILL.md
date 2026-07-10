---
name: generar-backlog
description: Genera o extiende el docs/functional/backlog.yml del analista a partir del análisis funcional (visión, glosario, conversación). Úsala cuando el usuario pida armar el backlog, generar las User Stories, redactar el yml de US, o pasar el análisis a formato estructurado (Fase 1 del flujo LumeAI, paso previo a backlog-a-ado). Produce Epics=capacidad → Features → US con criterios en Gherkin, prioridad, estimación y sprint, listo para subir con backlog-a-ado. Corre en Cowork (o Code); no necesita MCP.
---

# Generar backlog.yml (Fase 1 — paso previo al handoff)

Esta skill convierte el análisis funcional en un `docs/functional/backlog.yml` **bien formado y
completo**, con el schema exacto que espera `backlog-a-ado`. No inventa producto: estructura lo
que el analista ya definió. No sube nada a Azure DevOps (eso lo hace `backlog-a-ado`).

## Responsabilidad y fuente única
Esta skill es la **dueña de la calidad de autoría** de las User Stories: cómo se redactan, cuántos
criterios llevan, qué las hace estar "listas". La contraparte `backlog-a-ado` solo valida la
estructura y escribe en ADO — no re-define cómo se escribe una buena US.

El **modelo canónico** (Epic=capacidad, Iteration=versión\sprint, Area a nivel Task) vive en
`lumeai-base/docs/proceso-y-estructura.md` §3, y la **Definition of Ready** en
`docs/process/definition-of-ready-done.md` del repo. Esta skill **implementa** esas reglas; si el
modelo cambia, la autoridad es el doc, no una copia local. Ante duda, consultá el doc.

## Requisitos
- No necesita MCP (solo escribe un archivo). Corre en **Cowork** (herramienta del analista) o en Code.
- Idealmente hay `docs/functional/vision.md` y `domain-glossary.md` como insumo. Si no, la skill los pide o trabaja de la conversación.

## Dos modos
- **Crear:** no existe `backlog.yml` (o está en su estado plantilla) → generarlo de cero.
- **Extender/editar:** ya existe con contenido → agregar Epics/Features/US o modificar los existentes.
  **PRESERVÁ los campos `id` existentes** (los escribe `backlog-a-ado` al subir; si los borrás,
  se rompe el matcheo y se duplican work items). Nunca inventes ni renumeres `id`.

## El modelo (respetar al pie)
- **Epic = CAPACIDAD** del producto (Pedidos, Pagos, Cocina…), estable entre versiones.
  Test antes de crear un Epic: "¿seguiría existiendo en la v3?". Si la respuesta es "no, es el MVP/una
  versión" → **no es Epic**, es una versión (va en `version`/`sprint`, no en la jerarquía).
- **Feature** = entregable dentro de la capacidad.
- **User Story** = "Como <rol> quiero <objetivo> para <valor>", con criterios en Gherkin.
- **version** (raíz del yml) = la versión que se planifica (MVP, v1…). **sprint** por story.
- **La US NO lleva Area** (el Area es de las Tasks, se asigna río abajo). No agregues `area`.

## Schema de salida (exacto)
```yaml
version: "MVP"
epics:
  - title: "<Capacidad>"           # ej. Pedidos
    # id: <se completa solo al subir con backlog-a-ado; no lo pongas vos>
    description: "<qué abarca la capacidad>"
    features:
      - title: "<Entregable>"      # ej. Alta de pedido
        stories:
          - title: "Como <rol> quiero <objetivo> para <valor>"
            description: >
              <contexto de la US>
            acceptance_criteria:
              - "Dado <contexto>, cuando <acción>, entonces <resultado>"
            priority: 1            # 1 = más alta
            estimate: 5            # story points
            sprint: "Sprint 1"     # + version → IterationPath = <Proyecto>\<version>\<sprint>
            design_url: "design/screens/<pantalla>.html"   # opcional; lo completa Diseño en Fase 2
```

## Procedimiento
1. **Leer insumos:** `vision.md`, `domain-glossary.md` y lo conversado. Si falta contexto clave, preguntá; no inventes capacidades ni US.
2. **Identificar capacidades (Epics):** agrupá el producto en áreas funcionales estables (aplicá el test de la v3). Evitá el anti-patrón Epic=versión.
3. **Derivar Features y US:** por cada capacidad, los entregables y sus US en formato "Como… quiero… para…".
4. **Completar cada US según la DoR** (`docs/process/definition-of-ready-done.md`): título "Como <rol> quiero <objetivo> para <valor>", descripción con el valor de usuario, criterios en Gherkin (al menos 1, idealmente 2-3, cubriendo happy path y un borde), `priority` y `estimate` cargados, sin dependencias sin resolver. Si el analista no definió prioridad/estimación, proponé un valor y marcalo para que lo revise — no lo dejes vacío. (La pantalla de diseño de la DoR se linkea en Fase 2, no acá.)
5. **Modo extender:** si el `backlog.yml` ya existe, mergeá sin pisar lo previo y **conservando los `id`**. Agregá lo nuevo; para lo modificado, cambiá los campos dejando el `id` intacto.
6. **Escribir el archivo** en `docs/functional/backlog.yml`.
7. **Validar** antes de cerrar (o delegá en `backlog-a-ado`, que valida): que parsee, que ningún Epic sea una versión, que cada US tenga título en formato correcto, ≥1 criterio Gherkin, priority, estimate y sprint.

## Cierre
- Mostrá un resumen: cuántos Epics/Features/US quedaron, cuáles son nuevos vs modificados.
- Recordá los próximos pasos: **commit + push** del `backlog.yml` (guardar no es subir) y después
  **`backlog-a-ado`** para crear/actualizar los work items en el board.

## Errores comunes
- **Epic = versión** (ej. "MVP", "v1") → mal. Los Epics son capacidades; la versión va en `version`/`sprint`.
- **Borrar o inventar `id`** en modo extender → rompe el matcheo de `backlog-a-ado` y duplica work items.
- **Agregar `area` a la US** → no. El Area es de las Tasks.
- **US sin criterios/priority/estimate/sprint** → incompleta; completala o proponé valores para revisión.
- **Inventar capacidades o US** que el analista no definió → no. Ante la duda, preguntá.
