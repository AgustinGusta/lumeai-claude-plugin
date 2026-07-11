---
name: validar-us
description: Valida una User Story en staging contra sus criterios de aceptación (Fase 5, Tester). Úsala cuando el usuario pida validar/testear una US, probar en staging, verificar los criterios, o cerrar una historia. Genera y corre tests de API/integración contra el entorno de staging desplegado, reporta por criterio, persiste una suite de regresión, y —con la confirmación del tester— mueve la US a Closed. Si falla, ayuda a cargar bugs (ver cargar-bug) y devuelve la US a Active. Corre en Claude Code con el MCP de ADO.
---

# Validar una User Story en staging (Fase 5)

Valida que una US **funciona de verdad en staging** contra sus **criterios de aceptación**. Es una
capa distinta a los unit tests del dev (Fase 4): acá se prueba el sistema **desplegado**.

## Responsabilidad y fuente única
- Los **criterios de aceptación** de la US son el contrato: se valida contra ellos.
- El **modelo de estados** es canónico en `lumeai-base/docs/proceso-y-estructura.md` §3.5.
- Esta skill cubre la **capa automática (API/integración)**. El **testing de UI lo hace el tester a mano**; sus hallazgos se cargan con `cargar-bug`.

## Guardrails (fijos)
- Se valida **contra staging** (entorno desplegado), no a mano alzada ni en local.
- **No cerrar** una US con **bugs bloqueantes** abiertos.
- El paso a **Closed** requiere **confirmación del tester** (incluye lo exploratorio/UI).

## Requisitos
- **Claude Code** en la raíz del repo + MCP de ADO.
- La US está en **Resolved** y desplegada en **staging** (URL de la API de staging disponible: `<project>-api-staging`).
- La US tiene criterios de aceptación.

## Paso 0 — Contexto
- Tomá la US (por `id`). Verificá que esté en **Resolved**; si no, avisá (no se valida algo que no se desarrolló/mergeó).
- Conseguí la **URL de la API de staging** (App Service `<project>-api-staging`, o config del repo). Si no la tenés, pedila.
- Leé los **criterios de aceptación** de la US (del work item o del `backlog.yml`).

## Paso 1 — Generar/actualizar la suite de regresión (API/integración)
- Los tests viven en un proyecto **`tests/<Proyecto>.IntegrationTests`** (xUnit), que pega a la **URL de staging** (base URL por config/env, no hardcodeada).
- Por cada **criterio de aceptación**, escribí (o actualizá) un test de API que lo verifique: request al endpoint, assert de status/respuesta/estado resultante. Un test por criterio relevante (happy path + borde).
- Es **suite de regresión**: se acumula entre US y se re-corre en cada validación.

## Paso 2 — Correr y reportar por criterio
```bash
dotnet test tests/<Proyecto>.IntegrationTests
```
Mostrá un **reporte por criterio**: cuáles pasaron y cuáles no. Dejá evidencia (resultado/resumen) en `docs/qa/` si el tester lo quiere.

## Paso 3 — Según el resultado
- **Todos los criterios de API pasan:** pedile al tester que complete el **testing manual de UI** en staging. Con su **confirmación** (API + UI OK), mové la US a **Closed** (MCP).
- **Algún criterio falla:** por cada falla, cargá un **Bug** (usá `cargar-bug`: linkeado a la US, Area QA, repro steps, el criterio que falló). Si es **bloqueante**, mové la US a **Active** (vuelve al dev). No cierres.

## Paso 4 — Cierre
- Resumen: criterios validados, bugs creados (si hubo), estado final de la US.
- **Commit + push** de `tests/<Proyecto>.IntegrationTests` (la suite es parte del repo).
- Si la US quedó Closed: listo para el release (Fase 6). Si volvió a Active: el dev retoma con los bugs linkeados.

## Errores comunes
- **Validar en local en vez de staging** → no; se prueba el entorno desplegado.
- **Cerrar con bugs bloqueantes abiertos** → no.
- **Cerrar sin la confirmación del tester** (solo con la API verde, sin el manual de UI) → no; Closed es un juicio del tester.
- **Repetir unit tests del dev** → no; esta capa es API/integración contra el sistema corriendo.
- **Hardcodear la URL de staging** en los tests → usá config/env.
