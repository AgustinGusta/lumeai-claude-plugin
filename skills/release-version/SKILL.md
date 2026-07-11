---
name: release-version
description: Corta un release de una versión de un proyecto LumeAI (Fase 6, Release). Úsala cuando el usuario pida sacar/cortar un release, publicar una versión, salir a producción, taggear el MVP, o hacer el deploy a prod. Propone el número SemVer, abre el PR develop→main, crea el tag, genera release notes desde las US Closed de la versión, y deja que el pipeline despliegue a prod (con approval). No cierra Epics (son capacidades). Corre en Claude Code con el MCP de ADO.
---

# Cortar un release (Fase 6)

Publica una versión: `develop → main`, tag SemVer, release notes, y deploy a prod. Con **dos
compuertas humanas** (revisión del PR a `main` + aprobación del deploy a prod), porque es producción.

## Responsabilidad y guardrails (fijos)
- **Tag siempre en `main`** (nunca en develop). El deploy a prod se dispara **solo por tag** (stage `Deploy_Prod`), con **approval check** del environment `production`.
- **Dos gates humanos:** el **PR `develop→main`** lo revisa/aprueba una persona; el **deploy a prod** lo aprueba una persona en el environment.
- **No se cierran Epics.** Los Epics son **capacidades** (persisten entre versiones). Se pueden **cerrar Features** cuyas US estén todas Closed. La versión se marca con el tag + release notes, no cerrando work items.
- **La primera vez a producción** hay que **aprovisionar prod** antes (ver Paso 0).

## Requisitos
- **Claude Code** + MCP de ADO, en la raíz del repo.
- **Todas las US de la versión en Closed** (validadas en Fase 5). Si hay US sin cerrar o bugs bloqueantes, **frená** y reportá.
- Prod **aprovisionado** (o correr `provisionar-infra` con `env=prod` primero — solo el primer release).

## Paso 0 — Precondiciones
- Verificá (vía MCP) que **todas las US de la iteration/versión** estén **Closed**. Listá las que falten; si hay pendientes, frená.
- Si es el **primer release**, confirmá que **prod está aprovisionado**. Si no, indicá correr `provisionar-infra` (`env=prod`) y aplicar antes de seguir.

## Paso 1 — Proponer el número de versión (SemVer)
Mirá el último tag y qué entra en esta versión:
- MVP inicial → `v1.0.0`.
- Solo **features** nuevas → **minor** (`v1.1.0`).
- Solo **fixes** → **patch** (`v1.0.1`).
**Proponé** el número y **esperá que el usuario lo confirme**. No taggees sin confirmación.

## Paso 2 — Release notes (auto desde las US Closed)
Compilá las notas desde las **US Closed de la versión**, agrupadas por **capacidad (Epic) → Feature**.
Guardalas en `docs/decisions/releases/<vX.Y.Z>.md` (título, fecha, resumen, y la lista de US por capacidad).
Commit + push a la rama del release.

## Paso 3 — PR develop → main (gate humano 1)
Abrí un **PR de `develop` a `main`** titulado `Release <vX.Y.Z>`, con las release notes en la descripción.
**Parás acá para el gate:** una persona revisa y **completa el PR**. No lo mergees vos (la policy de `main` exige revisor).

## Paso 4 — Tag en main
Con el PR ya mergeado a `main`:
```bash
git checkout main && git pull
git tag -a <vX.Y.Z> -m "Release <vX.Y.Z>"
git push origin <vX.Y.Z>
```
El tag dispara el stage **`Deploy_Prod`** de los pipelines (backend a App Service prod, frontend a Vercel `--prod`).

## Paso 5 — Deploy a prod (gate humano 2)
El deploy a prod queda esperando el **approval check** del environment `production`. **Una persona lo aprueba** en ADO. La skill no puede saltear ese gate (ni debe).

## Paso 6 — Cierre
- (Opcional) Cerrá las **Features** cuyas US estén todas Closed. **No cierres Epics.**
- Resumen: versión publicada, link al tag y a las release notes, estado del deploy a prod.
- Recordá que la próxima versión abre un nuevo nodo de Iteration (`\v1`, `\v2`…), sin sprints.

## Errores comunes
- **Taggear sin que todas las US estén Closed** → frená; el release es de lo validado.
- **Tag en develop** → no; el tag va en `main`.
- **Mergear el PR a main vos** → no; lo aprueba/completa una persona (gate 1).
- **Saltear el approval de prod** → no; lo aprueba una persona (gate 2).
- **Cerrar Epics** → no; son capacidades. A lo sumo se cierran Features completas.
- **Olvidar aprovisionar prod** en el primer release → correr `provisionar-infra` (env=prod) antes.
