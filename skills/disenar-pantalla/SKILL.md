---
name: disenar-pantalla
description: Diseña las pantallas (HTML) que cubren las User Stories y las linkea al board (Fase 2 del flujo LumeAI). Úsala cuando el usuario pida diseñar pantallas, crear las mockups/HTML de las US, cubrir US con diseño, o linkear diseños a las historias. Genera el HTML usando el design system del proyecto, lo guarda en design/screens/, registra el mapeo N:M en screens-map.yml, crea/mueve el Task de diseño (Area Diseño) y linkea cada pantalla a las US que cubre vía MCP. Corre en Cowork + Claude Design (parte creativa) y necesita el MCP de Azure DevOps para el board.
---

# Diseñar pantallas y linkearlas al board (Fase 2)

Cubre las User Stories con pantallas consistentes y refleja el trabajo de diseño en el board. La
parte creativa es libre (Claude Design); esta skill garantiza **consistencia** (usa el design
system), **trazabilidad** (mapeo N:M + link a la US) y **visibilidad** (Task de diseño con estados).

## Requisitos
- **Design system definido:** existe `design/design-system/tokens.css` con los valores del proyecto (skill `definir-design-system`). Si no, frená y pedí que se defina primero.
- **MCP de Azure DevOps** para crear/mover el Task de diseño y linkear la pantalla a la US. Sin MCP podés generar el HTML, pero no tocar el board.
- Las **US ya existen** en el board (Fase 1) y tienen `id` (en el `backlog.yml` tras `backlog-a-ado`).

## Modelo (recordar)
- Relación **N:M**: una pantalla puede cubrir varias US y una US puede necesitar varias pantallas. El mapeo vive en `design/screens/screens-map.yml` (dominio del diseñador).
- El **Task de diseño** (`Diseñar pantalla…`) va con **Area `Diseño`**, bajo la US. Estados: **To Do → Done** (sin paso intermedio; el diseño es rápido). Se crea al planificar (To Do), no ya-resuelto.
- **Todo lo del board es vía MCP** (crear el Task, linkear, cerrarlo): lo hace esta skill, nunca a mano. ADO no se toca manualmente.
- El **link** pantalla→US se pone por MCP como **hyperlink** al archivo en Azure Repos. El `backlog.yml` NO lleva diseño.

## REGLA DE ORO: mostrá el plan y esperá OK antes de escribir en el board
Antes de crear Tasks, mover estados o linkear, mostrá el plan (qué Tasks, qué links) y esperá el OK.

## Modo A — Planificar (poblar la cola del diseñador)
Para un conjunto de US (una feature, una versión, o las de mayor prioridad) que necesitan diseño:
- Por cada US, creá (si no existe) un Task **`Diseñar pantalla: <título corto de la US>`**, con:
  - Padre = la US (`System.LinkTypes.Hierarchy-Reverse`).
  - `System.AreaPath` = `<Proyecto>\Diseño`.
  - `System.IterationPath` = la misma iteration de la US.
  - Estado inicial **To Do** (`System.State`).
- Idempotencia: no dupliques; si ya existe el Task de diseño de esa US, dejalo.

Esto deja la cola visible. La generación de cada pantalla es el Modo B.

## Modo B — Diseñar y linkear (por US o pantalla)
1. **Generar el/los HTML** de la pantalla con Claude Design:
   - Cada archivo importa `../design-system/tokens.css` y usa **solo** las variables/componentes del design system (nada hardcodeado). Partí de `design-system/base.html`.
   - Guardá en `design/screens/<nombre-descriptivo>.html`.
2. **Actualizar `design/screens/screens-map.yml`:** agregá/actualizá la entrada de la pantalla con `file`, `title`, y las US que cubre en `us_ids` (los `id` de ADO; `us_titles` opcional para legibilidad). Respetá N:M: una pantalla puede listar varias US.
3. **Linkear la pantalla a cada US que cubre (vía MCP):** agregá un **Hyperlink** al work item de la US apuntando a la URL del archivo en Azure Repos:
   `https://dev.azure.com/LumeAI/<Proyecto>/_git/<repo>?path=/design/screens/<archivo>.html`
   No dupliques el hyperlink si ya está.
4. **Cerrar el Task a Done** (`System.State = Done`, vía MCP) cuando la pantalla está hecha y linkeada a todas sus US. Si el Task no existía (fuiste directo al Modo B sin planificar), crealo y cerralo en la misma corrida.

## Cierre
- Resumen: pantallas generadas, US cubiertas (N:M), Tasks creados/movidos.
- Recordá **commit + push** de `design/` (HTML + `screens-map.yml` + design system) — guardar no es subir.
- El link a la US apunta al archivo en Azure Repos: el commit tiene que estar pusheado para que el link resuelva.
- Efecto en la DoR de dev: la US con su pantalla linkeada ya puede entrar a desarrollo (Fase 4).

## Errores comunes
- **Diseñar sin design system definido** → frená; corré `definir-design-system` primero.
- **Hardcodear estilos** en el HTML en vez de usar `tokens.css` → no; rompe la consistencia.
- **Crear el Task de diseño ya en Done** → no; se crea en To Do (para ver la cola) y se cierra en Done al terminar. Todo por MCP, nunca a mano.
- **Meter el link en el `backlog.yml`** → no; el vínculo va por MCP + `screens-map.yml`.
- **Asumir 1 US = 1 pantalla** → es N:M; usá `screens-map.yml` para el mapeo real.
- **Linkear a un archivo no pusheado** → el hyperlink de Azure Repos no resolvería; commiteá y pusheá antes o avisá.
