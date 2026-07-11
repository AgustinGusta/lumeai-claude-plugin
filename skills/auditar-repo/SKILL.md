---
name: auditar-repo
description: Audita que un repo de proyecto LumeAI siga el estándar (plantilla + convenciones). Úsala cuando el usuario pida auditar/revisar un proyecto, chequear que cumple el estándar, verificar consistencia, detectar drift, o hacer un health-check del repo. Es READ-ONLY: entrega un reporte pass/warning/fail con qué corregir, no arregla nada. Compara contra lumeai-base como fuente de verdad. Chequea archivos/estructura/secretos y, si hay MCP, el board (Areas, Iterations, Epics=capacidad, policies). Corre en Claude Code.
---

# Auditar repo contra el estándar LumeAI (gobernanza)

Verifica que un proyecto siga el estándar y **reporta el drift**. Protege la consistencia a medida
que crecen los proyectos. **No entrega producto ni corrige** — solo informa.

## READ-ONLY (fijo)
- **No modifica nada.** Ni archivos, ni board, ni git. Solo lee y reporta.
- Si detecta algo para arreglar, lo **describe con la corrección sugerida**; el humano decide y ejecuta.

## Fuente de verdad
El estándar es **`lumeai-base`** (no un checklist hardcodeado, para no desactualizarse):
- Cloná/leé `lumeai-base` (`git clone https://dev.azure.com/LumeAI/LumeAI-Base/_git/lumeai-base /tmp/lumeai-base`).
- La estructura esperada sale de `repo-template/`; las convenciones, de `docs/proceso-y-estructura.md`.

## Requisitos
- **Claude Code**, en la raíz del repo a auditar.
- MCP de ADO **opcional**: si está, se auditan los chequeos de board; si no, se saltean con aviso (los de archivos corren igual).

## Severidades
- **FAIL** (bloqueante): rompe el estándar o hay riesgo real.
- **WARNING**: desvío tolerable o dependiente de la fase.
- **PASS**: cumple.

## Chequeos A — Estructura y contexto (archivos)
- **Árbol** vs `repo-template/`: existen `backend/` (proyectos Clean Architecture), `frontend/`, `infra/` (Terraform), `design/design-system` + `design/screens`, `docs/functional/backlog.yml`, `docs/qa/`, `.azuredevops/pipelines/`. (faltantes → FAIL)
- **`CLAUDE.md`**: raíz + `backend/` + `infra/` presentes (frontend opcional → WARNING si falta).
- **Placeholders sin reemplazar** (`{{PROJECT}}`, `__PROJECT__`, `{{project}}`, `{{AZURE_SERVICE_CONNECTION}}`) en cualquier archivo versionado → **FAIL**.

## Chequeos B — Config y seguridad
- **Pipelines**: `backend-pipeline.yml` y `frontend-pipeline.yml` presentes. El backend **tiene el stage `Resolve_WorkItems`** → si falta, WARNING (US no pasan solas a Resolved).
- **Secretos**: `terraform.tfvars` **no está trackeado** por git; no hay connection strings ni tokens hardcodeados en `.tf`, `appsettings*.json`, ni en el repo → cualquier secreto commiteado = **FAIL**.
- **`.gitignore`**: incluye `.terraform/`, `*.tfstate`, `terraform.tfvars`, `node_modules/`, `bin/`/`obj/`.
- **Design system**: `design/design-system/tokens.css` **sin placeholders `{{...}}`** (valores de marca puestos) → placeholders = WARNING (diseño no definido aún).
- **Terraform**: `infra/environments/staging/` con sus `.tf`. (`prod/` puede faltar si aún no hubo release → WARNING/OK según contexto.)

## Chequeos C — Board (vía MCP; si no hay MCP, saltear con aviso)
- **Areas**: existen `Infra`, `Dev`, `Diseño`, `QA`. (faltantes → FAIL)
- **Iterations = versión** (MVP, v1…), sin sprints. Si hay sprints o falta el nodo de versión → WARNING.
- **Epics = capacidad**: ningún Epic con título de versión (`MVP`, `v1`…) → si lo hay, **FAIL** (anti-patrón Epic=versión).
- **US sin Area de disciplina**: las US no deben tener `AreaPath` de `Dev/Diseño/Infra/QA` (el Area es de las Tasks) → si la tienen, WARNING.
- **Branch policies** en `develop` y `main`: PR requerido, build validation, link a work item. (faltantes → WARNING/FAIL según criticidad).

## Salida — Reporte
Entregá un reporte claro, agrupado por A/B/C, con una línea por chequeo:
```
[PASS|WARN|FAIL] <chequeo> — <detalle> — Corrección: <qué hacer>
```
Cerrá con un **resumen**: cantidad de PASS/WARN/FAIL, y los **FAIL primero** (lo que hay que arreglar sí o sí). Si se saltearon los chequeos de board (sin MCP), decilo explícito.

## Errores comunes
- **Arreglar algo** → no; esta skill es read-only. Solo reportá y sugerí.
- **Usar un checklist propio** en vez de `lumeai-base` → no; el estándar es el repo base vigente.
- **Marcar FAIL algo dependiente de la fase** (ej. falta `prod/` antes del release) → usá WARNING con contexto.
- **Exponer un secreto** que encontraste en el reporte → señalá el archivo/línea, **no** el valor.
