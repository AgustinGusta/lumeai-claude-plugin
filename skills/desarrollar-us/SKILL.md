---
name: desarrollar-us
description: Desarrolla una User Story de punta a punta en un proyecto LumeAI (Fase 4, Desarrollador). Úsala cuando el usuario pida desarrollar/implementar una US, tomar la próxima historia, codear una feature del board, o avanzar el desarrollo. Trabaja UNA US por corrida: crea la rama, implementa backend (.NET Clean Architecture) y frontend (Next.js) tomando la pantalla linkeada como referencia, escribe tests desde los criterios, verifica la DoD y abre un PR linkeado a la US. Con checkpoints; para en el PR abierto (el merge lo confirma una persona). Corre en Claude Code con el MCP de ADO.
---

# Desarrollar una User Story (Fase 4)

Convierte **una** US del board en código, con checkpoints y calidad verificada, y la deja en un **PR
abierto** linkeado a la US. No mergea (eso lo confirma una persona).

## Responsabilidad y fuente única
- El **modelo** de work items es canónico en `lumeai-base/docs/proceso-y-estructura.md` §3.
- La **DoD** es `docs/process/definition-of-ready-done.md` del repo — esta skill la **implementa**, no la recopia.
- Las **convenciones de código** están en `CLAUDE.md` (raíz) + `backend/CLAUDE.md` + `frontend/CLAUDE.md`.

## Guardrails (fijos)
- **Una US por corrida.** 1 US = 1 rama = 1 PR. No mezcles US en un PR.
- **PR siempre linkeado** a la US (`AB#<id>`).
- **Nunca push directo** a `develop`/`main`. Todo por rama de trabajo + PR (las policies igual lo bloquean).
- **Parás en el PR abierto.** El merge lo confirma un humano; la US pasa a *Resolved* al mergear.
- La **pantalla linkeada** (Fase 2) es la referencia obligatoria para el frontend.

## Requisitos
- **Claude Code** en la raíz del repo (git + MCP de ADO).
- La US **cumple la DoR** (criterios de aceptación, pantalla linkeada, entorno listo). Si no, frená y reportá qué falta.
- Entorno de Fase 3 listo (solución compila, staging aprovisionado).

## Paso 0 — Tomar la US y verificar DoR
- Obtené la US: por `id` indicado, o la de mayor prioridad de la iteration actual (`wit_my_work_items` / consulta por prioridad).
- Verificá la **DoR**: criterios presentes, **pantalla linkeada** (hyperlink / `screens-map.yml`), entorno listo. Si falta algo, **frená** y decilo (no desarrolles una US que no está lista).
- Mové la US a **Active** (`System.State`, vía MCP).

## Paso 1 — Plan + desglose (CHECKPOINT 1)
Mostrá un **plan breve**: enfoque técnico, qué proyectos/archivos vas a tocar (Core/Infra/Api/Front), si toca el modelo de datos (entidad + migración), y el **mapeo criterio de aceptación → test**.
Del plan salen los **Tasks de dev** (Area `Dev`): creá pocos y gruesos (ej. `Backend: endpoint + entidad`, `Frontend: pantalla`, `Tests`), bajo la US, en **To Do**, misma iteration.
**Esperá el OK** antes de codear.

## Paso 2 — Rama
```bash
git checkout develop && git pull
git checkout -b feature/US-<id>-<slug>
```

## Paso 3 — Implementar (mové el Task a In Progress)
- **Backend** (Clean Architecture): dominio/casos de uso en `Core`, datos/servicios en `Infra`, endpoint delgado en `Api`. Respetá las convenciones (`Guid` PK, `DateTimeOffset`, `string` enums, navegación; multi-tenant por `venue_id` si aplica).
- **Migración**: si agregaste/cambiaste entidades, `dotnet ef migrations add <Nombre> -p src/<Proyecto>.Infra -s src/<Proyecto>.Api`.
- **Frontend**: implementá la pantalla en Next.js **usando la pantalla linkeada como referencia** (mismo layout/flujo) y el design system.

## Paso 4 — Tests desde los criterios
- Escribí unit tests en `tests/<Proyecto>.Tests` que **mapean los criterios de aceptación** (un test por criterio relevante, happy path + bordes).
- Corré: `dotnet build`, `dotnet test`, y en el front `npm run lint && npm run build`. **Todo tiene que pasar.**

## Paso 5 — Verificar la DoD (antes del PR)
Chequeá contra `docs/process/definition-of-ready-done.md`: código listo, tests pasando, **criterios cubiertos**, **pantalla implementada según diseño**, sin warnings de build.

## Paso 6 — Commit + PR (CHECKPOINT 2)
- Mostrá el **diff** y esperá OK antes de commitear.
- Commit + push de la rama.
- Abrí el **PR a `develop`** linkeado a la US (`AB#<id>`), completando `pull_request_template.md` (qué cambia + checklist DoD).
- Mové los **Tasks de dev a Done**.

## Paso 7 — Cierre (parás acá)
- Reportá: link del PR, US, Tasks, y estado de CI si ya corrió.
- **No mergeás.** El merge lo confirma una persona (aunque sea el mismo dev). Recordá que al mergear a `develop` el pipeline despliega a **staging**.
- **US → Resolved al mergear:** cuando el PR se mergea, mové la US a *Resolved* (puede ser una corrida corta: *"la US <id> ya mergeó, pasala a Resolved"*).

## Errores comunes
- **Desarrollar una US que no cumple la DoR** (sin pantalla, sin criterios) → frená y reportá.
- **Meter varias US en un PR** → no; 1 US = 1 PR.
- **Push directo a develop/main** → no; siempre por rama + PR.
- **Mergear el PR desde la skill** → no; parás en PR abierto (el humano mergea).
- **Saltear tests o el build** → no; la DoD exige tests pasando y build limpio.
- **Ignorar la pantalla linkeada** → el front tiene que seguir el diseño de Fase 2.
- **Recopiar la DoD/convenciones** → referenciá los archivos fuente, no los dupliques.
