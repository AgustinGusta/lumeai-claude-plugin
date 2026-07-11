# lumeai-claude-plugin

Plugin interno de **LumeAI** con las skills reutilizables entre proyectos. Pensado para
correr en **Claude Code** (donde viven git y el MCP de Azure DevOps).

Vive en su propio repo (separado de `lumeai-base`) porque los plugins se instalan y
versionan por separado. Versionado con SemVer.

## Skills

| Skill | Qué hace |
|---|---|
| `setup-proyecto-lumeai` | Automatiza la Fase 0: crea el proyecto en Azure DevOps, el repo desde la plantilla (`lumeai-base/repo-template`), reemplaza placeholders, y siembra los ejes del board (Areas por disciplina e Iterations por versión\sprint). |
| `generar-backlog` | Fase 1: genera o extiende `docs/functional/backlog.yml` desde el análisis (visión/glosario) — Epics=capacidad, US con Gherkin, prioridad, estimación y sprint. Preserva los `id`. |
| `backlog-a-ado` | Fase 1: sincroniza el `backlog.yml` con Azure DevOps (jerarquía Epic=capacidad → Feature → US, validación exhaustiva, dry-run, idempotencia por ID con write-back, reporte de huérfanos). |
| `definir-design-system` | Fase 2: completa los valores de marca del proyecto en `design/design-system/tokens.css` (esqueleto estándar de `lumeai-base`). Paso previo a las pantallas. |
| `disenar-pantalla` | Fase 2: genera las pantallas HTML con el design system, registra el mapeo N:M en `screens-map.yml`, crea/mueve el Task de diseño (Area Diseño) y linkea cada pantalla a las US vía MCP. |
| `provisionar-infra` | Fase 3: genera el Terraform de Azure (staging) siguiendo la convención de recursos y muestra el plan/costo. **El `apply` lo dispara una persona** (recursos facturables). Cablea Key Vault + Variable Group. |
| `scaffold-solucion` | Fase 3: genera la estructura de código — solución .NET 8 Clean Architecture (Api/Core/Infra/Jobs/Tests) + Next.js. Solo estructura; las entidades van en Fase 4. |
| `desarrollar-us` | Fase 4: desarrolla UNA US de punta a punta — rama, backend/frontend (según la pantalla linkeada), tests desde criterios, DoD, y PR linkeado. Con checkpoints; para en el PR abierto (el merge lo confirma una persona). |
| `validar-us` | Fase 5: valida una US en staging contra sus criterios (tests de API/integración, suite de regresión). Con OK del tester mueve la US a Closed; si falla, carga bugs y la devuelve a Active. |
| `cargar-bug` | Fase 5: crea un Bug bien formado desde el testing manual de UI — linkeado a la US, Area QA, repro steps, severidad, screenshot opcional. Reabre la US a Active si es bloqueante. |
| `release-version` | Fase 6: corta un release — propone SemVer, PR develop→main, tag, release notes auto desde las US Closed, y deploy a prod (tag + approval). Dos gates humanos; no cierra Epics. |
| `publicar-skill-lumeai` | Agrega/publica una skill nueva en este plugin: scaffold + validación + bump de versión + commit/push a Azure DevOps + refresco del plugin. |

## Requisitos
- Ejecutar desde **Claude Code**.
- MCP oficial de Azure DevOps (`@azure-devops/mcp`) conectado sobre la org `LumeAI`.
- `git` y acceso a Azure Repos.

## Instalación para el equipo (Claude Code)

> **No hace falta clonar el repo para *usar* las skills.** `/plugin marketplace add` lo clona
> solo dentro de `~/.claude/plugins/`. Clonar a mano es solo para **publicar/editar** skills (Rol B).

### Rol A — Usar las skills (la mayoría)

1. **Autenticar git contra Azure DevOps una sola vez** (el repo es privado; Claude Code necesita poder
   clonarlo). En una terminal externa, con tu propia cuenta LumeAI/Microsoft (GCM abre el navegador):
   ```bash
   git clone https://dev.azure.com/LumeAI/LumeAI-Base/_git/lumeai-base
   ```
   Con eso queda la credencial cacheada (cifrada, Windows Credential Manager). No compartas PAT entre personas.
2. **En Claude Code:**
   ```
   /plugin marketplace add https://dev.azure.com/LumeAI/LumeAI-Base/_git/lumeai-claude-plugin
   /plugin install lumeai-claude-plugin@lumeai     # en el menú, elegí scope "User"
   /reload-plugins
   ```
3. **Tener el MCP de Azure DevOps conectado** con tu PAT. Las skills operan sobre ADO; sin el MCP
   aparecen pero no pueden crear proyecto/repo/work items.

### Rol B — Publicar/editar skills (mantenedores)

Necesitan **clonar** y tener **permiso de push** en ADO:
```bash
git clone https://dev.azure.com/LumeAI/LumeAI-Base/_git/lumeai-claude-plugin
```
Para agregar una skill nueva, usá la skill `publicar-skill-lumeai` (pedí *"publicá una skill nueva
llamada X"*): hace scaffold + validación + bump de versión + commit/push + refresco del plugin.

### Actualizar a skills nuevas

Cuando se publica una versión nueva:
```
/plugin marketplace update lumeai
/plugin update lumeai-claude-plugin@lumeai
/reload-plugins
```
(O activá auto-update del marketplace desde el menú `/plugin`.)

### Uso

Una vez instalado, las skills se auto-disparan según su descripción (ej. "creá un proyecto nuevo para
el cliente X" → `setup-proyecto-lumeai`), o las invocás explícitas como `/lumeai-claude-plugin:<skill>`.

## Convención de versiones
Cada proyecto que use el plugin conviene que fije una versión (no auto-actualizar), para
que un cambio de skill no rompa proyectos en curso. Ver riesgo 7 en `lumeai-base/docs/proceso-y-estructura.md`.
