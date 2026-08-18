---
name: agregar-herramienta-wiki
description: Agrega una herramienta al catálogo de Herramientas de la wiki Interno. Úsala cuando el usuario pida sumar una herramienta al catálogo, documentar un plugin, una skill o un MCP server en la wiki, o diga que encontró una herramienta que le puede servir al equipo. Crea la página en el dominio y tipo que corresponde, y actualiza los cuatro índices que la hacen visible. Para cualquier OTRA página de la wiki que no sea una herramienta, usá crear-pagina-wiki. Corre en Claude Code con el repo Interno.wiki clonado.
---

# Agregar una herramienta al catálogo

El catálogo lo lee **gente navegando la wiki**, no un agente buscando. La vara de calidad es:
¿un compañero que nunca vio esta herramienta entiende en treinta segundos si le sirve?

## Requisitos
- El repo `Interno.wiki` clonado (rama **`wikiMaster`**).
- Saber qué hace la herramienta **de verdad**, no lo que dice su landing.

## Guardrails (fijos)
- **No inventes.** Verificá el nombre exacto, el comando de instalación y la URL antes de escribirlos. Un comando que falla es peor que no tener la página. Si no podés verificarlo, decilo y pará.
- **Si nadie del equipo la usó**, el Estado es `disponible, sin validar por el equipo`. No la vendas como probada.
- **"Cuándo NO usarla" es obligatorio.** Es el campo más útil de la página. Si no se te ocurre un límite, todavía no entendiste la herramienta.
- **Nunca pises contenido existente.** Si la página ya existe, leela entera antes de tocarla.

## Paso 0 — Verificar qué es

Antes de escribir, confirmá contra una fuente real:

- **Si es del marketplace oficial**, el catálogo local tiene el nombre, la descripción, el autor y el homepage:
  `~/.claude/plugins/marketplaces/claude-plugins-official/.claude-plugin/marketplace.json`
- **Si es una skill ya instalada**, leé su `SKILL.md` en `~/.claude/skills/<nombre>/` o dentro del plugin.
- **Si es externa**, entrá al sitio.

Si no aparece en el marketplace oficial, **el comando `/plugin install` no va a funcionar**: averiguá cómo se instala de verdad antes de documentarlo.

## Paso 1 — Elegir dominio y tipo

El árbol es **dominio → tipo → herramienta**. Dominios actuales: `Diseño y UI`, `Desarrollo`, `Seguridad`, `SEO y calidad web`, `Documentos`.

Para el tipo, **el mecanismo de instalación no sirve para clasificar** (casi todas usan `/plugin install`). La regla es qué aporta:

| Tipo | Aporta |
|---|---|
| **Skills** | Una skill: incluida en Claude Code o instalada suelta |
| **Plugins** | Skills, comandos o hooks empaquetados |
| **MCP servers** | Herramientas nuevas para Claude vía MCP |
| **Herramientas web** | No se integra con Claude; se usa desde el navegador |

Un plugin que **trae un MCP server adentro** va en **MCP servers**: se instala como plugin, pero lo que aporta son herramientas MCP.

Si el dominio o el tipo no existen, creá la carpeta con su página índice y sumala al `.order` del nivel de arriba.

## Paso 2 — Crear la página

En `Herramientas/<Dominio>/<Tipo>/`, con el nombre de archivo en la convención del wiki:
**espacio → `-`, guion literal → `%2D`**. Es decir, `frontend-design` se guarda como `frontend%2Ddesign.md`.

```markdown
# nombre-de-la-herramienta

**Tipo:** plugin oficial de Anthropic / MCP server / skill / herramienta web externa · **Estado:** disponible
**Instalación:** `/plugin install nombre@claude-plugins-official`
**Sitio:** https://...

**Cuándo usarla:** los casos concretos en que conviene.

**Cuándo NO usarla:** el límite real, y a qué otra herramienta ir en ese caso (linkeala).

## Qué hace
Dos o tres oraciones. Qué problema resuelve, no qué features tiene.

## Cómo se usa
El comando o el flujo concreto.

## Notas
Cuándo conviene en el proceso de Lume, advertencias, si está validada o no.
```

Valores de **Estado**: `disponible` · `disponible, sin validar por el equipo` · `en uso por el equipo` · `⚠️ pendiente de distribuir al equipo` · `desactualizado`.

Al redactar: empezá por el problema que resuelve, no por la descripción formal. Nada de marketing.

## Paso 3 — Actualizar los cuatro índices

Una página que no está en los índices **no la encuentra nadie**. Sumá una línea de "nombre — qué hace" en:

1. El `.order` de la carpeta (solo el nombre de archivo, sin `.md`, con el `%2D`)
2. La página del **tipo** — ej. `Herramientas/Diseño-y-UI/Skills.md`
3. La página del **dominio** — ej. `Herramientas/Diseño-y-UI.md`, en la sección del tipo
4. La página [Por tipo](/Herramientas/Por%20tipo) — `Herramientas/Por-tipo.md`

Los links internos van con el **título** y `%20` por espacio, **no** con el nombre de archivo:
`/Herramientas/Diseño%20y%20UI/Skills/improve-ui`

## Paso 4 — Commit y push

```
$env:GIT_TERMINAL_PROMPT=1; $env:GCM_INTERACTIVE='auto'; git push origin wikiMaster
```

GCM imprime `fatal: Cannot determine the organization name...` aunque el push funcione. Mirá el rango de commits, no ese mensaje. Los repos de wiki van a push directo, sin PR.

## Paso 5 — Verificar

Con el MCP de ADO, confirmá que el título resolvió bien y que la página cuelga donde corresponde:

```
wiki → get_page, path=/Herramientas/<Dominio>/<Tipo>, recursionLevel=OneLevel
```

Chequeá que el `path` de la página nueva sea el título esperado (no uno con guiones donde iban espacios).

## Errores comunes
- **Inventar el comando de instalación** → verificalo contra el marketplace; si no está ahí, ese comando falla.
- **Guion literal sin `%2D`** → el título sale con espacio en vez de guion.
- **Actualizar solo un índice** → son cuatro; si falta alguno la herramienta queda medio invisible.
- **Linkear con el nombre de archivo** → los links van por título.
- **Clasificar por cómo se instala** → casi todas se instalan igual; clasificá por lo que aportan.
- **Saltear "Cuándo NO usarla"** → es el campo que evita que alguien pierda una tarde.
