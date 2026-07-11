---
name: cargar-bug
description: Carga un Bug en Azure DevOps a partir de lo que el tester encontró probando (Fase 5, Tester). Úsala cuando el usuario pida cargar/levantar/reportar un bug, registrar un error encontrado en la app, o anotar una falla del testing manual de UI. Crea el work item Bug bien formado (linkeado a la US, Area QA, pasos de reproducción, severidad, screenshot opcional) y, si es bloqueante, devuelve la US a Active. Corre en Claude Code con el MCP de ADO.
---

# Cargar un Bug (Fase 5)

Convierte un hallazgo del tester (típicamente del **testing manual de UI**, que hace a mano en la app)
en un **Bug bien formado** en el board, sin que el tester tenga que armar el work item a mano.

## Requisitos
- **Claude Code** + MCP de ADO.
- Saber **a qué US** pertenece el bug (por `id`), o el contexto para inferirla.

## Guardrails (fijos)
- El **Bug siempre linkeado** a su US (relación *Related*) y con **Area `QA`**.
- **Pasos de reproducción** obligatorios (sin repro, el bug no es accionable).
- Si el bug es **bloqueante**, la **US vuelve a Active** (el dev lo retoma). Los no bloqueantes no reabren la US.

## Paso 0 — Recolectar
Pedí (o inferí del contexto):
- **US** a la que pertenece (`id`).
- **Qué pasó:** título corto + descripción.
- **Pasos de reproducción:** qué hizo el tester, en qué pantalla, con qué datos.
- **Esperado vs obtenido.**
- **Severidad:** 1-Crítica / 2-Alta / 3-Media / 4-Baja. Y si es **bloqueante** (sí/no).
- **Ambiente:** normalmente staging.
- **Screenshot** (opcional): ruta del archivo si el tester lo guardó.
Si falta la US o los pasos, pedilos; no inventes.

## Paso 1 — Crear el Bug (vía MCP)
Creá un work item **Bug** con:
- `System.Title` = título corto y claro.
- `Microsoft.VSTS.TCM.ReproSteps` = pasos de reproducción + esperado/obtenido, en HTML (lista `<ol>`).
- `Microsoft.VSTS.Common.Severity` = la severidad elegida.
- `System.AreaPath` = `<Proyecto>\QA`.
- `System.IterationPath` = la misma iteration que la US.
- **Link a la US:** relación `System.LinkTypes.Related` hacia la US.
- **Tag** `blocked` si es bloqueante (opcional, además del reabrir).

## Paso 2 — Screenshot (si hay)
Si el tester dio una ruta de imagen, **adjuntala** al Bug (attachments API: subir el archivo y linkearlo como `AttachedFile`).

## Paso 3 — Reabrir la US si es bloqueante
- **Bloqueante:** mové la **US a Active** (MCP) para que el dev la retome; el Bug queda linkeado.
- **No bloqueante:** dejá la US como está (puede cerrarse con bugs conocidos no bloqueantes, a criterio del tester).

## Paso 4 — Cierre
- Mostrá: link del Bug creado, la US afectada y su nuevo estado.
- Si reabriste la US, avisá que el dev la retoma (con el Bug como referencia).

## Errores comunes
- **Bug sin pasos de reproducción** → no accionable; pedilos.
- **Bug sin linkear a la US** → siempre `Related` a su US.
- **Area distinta de QA** → los bugs del tester van a `QA`.
- **No reabrir una US con bug bloqueante** → si es bloqueante, la US vuelve a Active.
- **Inventar detalles** que el tester no dio → preguntá.
