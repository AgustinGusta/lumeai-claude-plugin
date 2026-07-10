# lumeai-claude-plugin

Plugin interno de **LumeAI** con las skills reutilizables entre proyectos. Pensado para
correr en **Claude Code** (donde viven git y el MCP de Azure DevOps).

Vive en su propio repo (separado de `lumeai-base`) porque los plugins se instalan y
versionan por separado. Versionado con SemVer.

## Skills

| Skill | Qué hace |
|---|---|
| `setup-proyecto-lumeai` | Automatiza la Fase 0: crea el proyecto en Azure DevOps, el repo desde la plantilla (`lumeai-base/repo-template`), reemplaza placeholders, y siembra Areas, Iterations y el Epic raíz del MVP. |
| `publicar-skill-lumeai` | Agrega/publica una skill nueva en este plugin: scaffold + validación + bump de versión + commit/push a Azure DevOps + refresco del plugin. |

## Requisitos
- Ejecutar desde **Claude Code**.
- MCP oficial de Azure DevOps (`@azure-devops/mcp`) conectado sobre la org `LumeAI`.
- `git` y acceso a Azure Repos.

## Instalación (Claude Code)
1. Cloná este repo desde Azure DevOps.
2. Agregalo como plugin / marketplace en Claude Code (Settings → Capabilities / plugins),
   o referenciá su carpeta `skills/` según tu configuración de skills.
3. Al pedir "creá un proyecto nuevo para el cliente X", Claude Code dispara la skill.

## Convención de versiones
Cada proyecto que use el plugin conviene que fije una versión (no auto-actualizar), para
que un cambio de skill no rompa proyectos en curso. Ver riesgo 7 en `lumeai-base/docs/proceso-y-estructura.md`.
