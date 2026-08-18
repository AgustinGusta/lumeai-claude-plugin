# lumeai-claude-plugin

Plugin interno de **LumeAI** con las skills reutilizables entre proyectos. Corre en **Claude Code**
y en **Claude Cowork** (analista y diseñador desde Cowork; infra, dev y tester desde Code).

**Vive en GitHub (público):** `https://github.com/AgustinGusta/lumeai-claude-plugin` (temporalmente
en la cuenta personal; se migrará a la org **LumeAI** en GitHub — al migrar, actualizar esta URL y
re-agregar el marketplace en cada runtime). Está en GitHub —y no
en Azure DevOps como el resto— porque el marketplace de **Cowork solo acepta github/gitlab/bitbucket**.
Al estar en GitHub, **los dos runtimes consumen la misma fuente** (una sola publicación, sin espejos).

> **Fuente única = GitHub.** Este plugin vive **SOLO en GitHub**; su antiguo repo en Azure DevOps queda **archivado** (read-only, sin publicar). No hay espejo ni sincronización con ADO — cualquier cambio se hace y se pushea contra GitHub. `lumeai-base` y los repos de proyecto **siguen en Azure DevOps** con normalidad.

Versionado con SemVer.

## Skills

| Skill | Qué hace |
|---|---|
| `setup-proyecto-lumeai` | Automatiza la Fase 0: crea el proyecto en Azure DevOps, el repo desde la plantilla (`lumeai-base/repo-template`), reemplaza placeholders, y siembra los ejes del board (Areas por disciplina e Iterations por versión, sin sprints). |
| `generar-backlog` | Fase 1: genera o extiende `docs/functional/backlog.yml` desde el análisis (visión/glosario) — Epics=capacidad, US con Gherkin, prioridad y estimación. Preserva los `id`. |
| `backlog-a-ado` | Fase 1: sincroniza el `backlog.yml` con Azure DevOps (jerarquía Epic=capacidad → Feature → US, validación exhaustiva, dry-run, idempotencia por ID con write-back, reporte de huérfanos). |
| `definir-design-system` | Fase 2: completa los valores de marca del proyecto en `design/design-system/tokens.css` (esqueleto estándar de `lumeai-base`). Paso previo a las pantallas. |
| `disenar-pantalla` | Fase 2: genera las pantallas HTML con el design system, registra el mapeo N:M en `screens-map.yml`, crea/mueve el Task de diseño (Area Diseño) y linkea cada pantalla a las US vía MCP. |
| `provisionar-infra` | Fase 3/6: genera el Terraform de Azure por ambiente (staging/prod) y muestra el plan/costo. **El `apply` lo dispara una persona** (recursos facturables). Cablea Key Vault + Variable Group. |
| `scaffold-solucion` | Fase 3: genera la estructura de código — solución .NET 8 Clean Architecture (Api/Core/Infra/Jobs/Tests) + Next.js. Solo estructura; las entidades van en Fase 4. |
| `desarrollar-us` | Fase 4: desarrolla UNA US de punta a punta — rama, backend/frontend (según la pantalla linkeada), tests desde criterios, DoD, y PR linkeado. Con checkpoints; para en el PR abierto (el merge lo confirma una persona). |
| `validar-us` | Fase 5: valida una US en staging contra sus criterios (tests de API/integración, suite de regresión). Con OK del tester mueve la US a Closed; si falla, carga bugs y la devuelve a Active. |
| `cargar-bug` | Fase 5: crea un Bug bien formado desde el testing manual de UI — linkeado a la US, Area QA, repro steps, severidad, screenshot opcional. Reabre la US a Active si es bloqueante. |
| `release-version` | Fase 6: corta un release — propone SemVer, PR develop→main, tag, release notes auto desde las US Closed, y deploy a prod (tag + approval). Dos gates humanos; no cierra Epics. |
| `auditar-repo` | Gobernanza (transversal): audita que un proyecto siga el estándar (estructura, placeholders, pipelines, secretos, design system, board). Read-only; reporta pass/warning/fail contra `lumeai-base`. |
| `publicar-skill-lumeai` | Agrega/publica una skill nueva en este plugin: scaffold + validación + bump de versión + commit/push a **GitHub** + refresco del plugin. |
| `agregar-herramienta-wiki` | Transversal: agrega una herramienta al catálogo de la wiki — la ubica en el dominio y tipo correctos, usa la plantilla del catálogo y actualiza los cuatro índices que la hacen visible. |
| `crear-pagina-wiki` | Transversal: crea o edita páginas de la wiki de ADO respetando las convenciones del repo (naming `%2D`, `.order`, links por título), el formato que las hace recuperables por `search_wiki`, el push a `wikiMaster` y la verificación posterior. |
| `publicar-instagram` | Convierte una idea en una publicación lista para el Instagram de Lume: elige el pilar, redacta el texto dentro de los límites del design system (título, apoyo, caption) y entrega el prompt para Claude Design + el caption. Corre en Cowork; no necesita MCP. |

## Requisitos
- **MCP oficial de Azure DevOps** (`@azure-devops/mcp`) conectado sobre la org `LumeAI` (en Code y/o Cowork).
- Para las skills que tocan git/terminal (infra, dev, tester): correr desde **Claude Code**.
- No hace falta clonar este repo para *usar* las skills: el marketplace lo hace por vos.

## Instalación (para el equipo)

Como el repo es **público en GitHub**, no hace falta autenticación de git para consumirlo.

### En Claude Cowork (analista, diseñador)
1. Pestaña **Cowork** → **Customize** (barra izquierda) → pestaña **Plugins** → **Personal plugins** → **"+"** → **Add marketplace**.
2. Pegá la URL: `https://github.com/AgustinGusta/lumeai-claude-plugin` → **Sincronizar**.
3. Instalá el plugin `lumeai-claude-plugin` y, si aparece, activá **auto-update**.
4. Tené el **MCP de Azure DevOps conectado en Cowork** (las skills operan sobre ADO).

### En Claude Code (infra, dev, tester)
```
/plugin marketplace add https://github.com/AgustinGusta/lumeai-claude-plugin
/plugin install lumeai-claude-plugin@lumeai
/reload-plugins
```
Y tené el MCP de Azure DevOps conectado en Code.

## Publicar una skill nueva o una actualización
Usá la skill `publicar-skill-lumeai` (pedí *"publicá una skill nueva llamada X"*): hace scaffold +
validación + bump de versión + **commit/push a GitHub**. Después, cada runtime toma la versión nueva:

- **Cowork:** menú de plugins → update (o auto-update activado).
- **Claude Code:**
  ```
  /plugin marketplace update lumeai
  /plugin update lumeai-claude-plugin@lumeai
  ```

## Uso
Una vez instalado, las skills se auto-disparan según su descripción (ej. "creá un proyecto nuevo
para el cliente X" → `setup-proyecto-lumeai`), o las invocás explícitas (`/lumeai-claude-plugin:<skill>`
en Code). En Cowork, si el plugin no está instalado, también podés pedirle a Claude que **lea la
`SKILL.md`** del repo conectado y la siga (camino sin instalar).

## Convención de versiones
Cada proyecto que use el plugin conviene que fije una versión (no auto-actualizar), para
que un cambio de skill no rompa proyectos en curso. Ver riesgo 7 en `lumeai-base/docs/proceso-y-estructura.md`.
