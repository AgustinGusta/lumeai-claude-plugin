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

- **Marketplace de plugins**: el catálogo local tiene nombre, descripción, autor y homepage.
  `~/.claude/plugins/marketplaces/claude-plugins-official/.claude-plugin/marketplace.json`
- **Registro abierto de skills**: `npx skills find <término>` devuelve owner, repo y cantidad de instalaciones.
- **Skill ya instalada**: leé su `SKILL.md` en `~/.claude/skills/<nombre>/` o dentro del plugin.
- **Herramienta externa**: entrá al sitio.

## Paso 0.5 — Elegir el comando de instalación correcto

Hay **dos registros distintos** y cada uno tiene su comando. Confundirlos produce un comando que falla:

| Origen | Comando |
|---|---|
| Marketplace de plugins | `/plugin install <nombre>@claude-plugins-official` |
| Registro abierto de skills | `npx skills add <owner>/<repo>@<skill> -g -y` |
| Herramienta web | ninguno; se usa desde el navegador |

**Una skill instalada localmente no implica que el equipo la tenga.** Las que viven sueltas en `~/.claude/skills/` sin origen conocido no las puede instalar nadie más. Antes de marcarla como no distribuible, buscala en el registro abierto con `npx skills find`: suele estar ahí.

Si la buscaste y aparece con un nombre parecido, **verificá que sea la misma** y no una homónima: compará la descripción del registro contra la del `SKILL.md` local. Si difieren, documentá la del registro y dejalo anotado en Notas.

Recién si no está en ningún registro corresponde `⚠️ pendiente de distribuir al equipo`.

## Paso 1 — Elegir dominio y tipo

El árbol es **dominio → tipo → herramienta**.

### Elegir el dominio: por el momento de uso, no por lo que mide

Esta es la parte que más se erra, y el error no se nota hasta que alguien no encuentra la herramienta.

**La regla: clasificá por lo que la persona está haciendo cuando la necesita, no por la dimensión que la herramienta evalúa.**

Completá esta frase con la herramienta en la mano:

> *"Estoy ______ y necesito esto."*

Lo que va en el hueco es el dominio. Si la respuesta natural es "estoy por entregar un front y quiero revisarlo", el dominio es **Diseño y UI** — aunque la herramienta mida accesibilidad, que suena a calidad web.

**Ya pasó:** `web-design-guidelines` se archivó en `SEO y calidad web` porque mide accesibilidad y cumplimiento de WCAG. Pero nadie la busca pensando "accesibilidad": la busca cuando está por entregar una interfaz. Hubo que moverla a `Diseño y UI`. La señal de que estaba mal fue que alguien que había participado de documentarla igual no la encontró.

| Dominio | La persona está... |
|---|---|
| `Diseño y UI` | diseñando, maquetando o revisando una interfaz |
| `Desarrollo` | escribiendo, revisando o depurando código |
| `Seguridad` | buscando o previniendo vulnerabilidades |
| `SEO y calidad web` | midiendo un sitio **ya publicado** |
| `Documentos` | armando material comercial o presentaciones |

**Si encaja en dos dominios**, elegí aquel donde alguien la buscaría **primero**, y usá el campo "Cuándo NO usarla" para linkear al otro. No la dupliques.

### Elegir el tipo

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
- **Inventar el comando de instalación** → verificalo contra el registro que corresponda; `/plugin install` solo sirve para el marketplace de plugins.
- **Marcar como no distribuible sin buscar** → que esté suelta en tu máquina no significa que no exista en el registro abierto.
- **Guion literal sin `%2D`** → el título sale con espacio en vez de guion.
- **Actualizar solo un índice** → son cuatro; si falta alguno la herramienta queda medio invisible.
- **Linkear con el nombre de archivo** → los links van por título.
- **Clasificar por cómo se instala** → casi todas se instalan igual; clasificá por lo que aportan.
- **Elegir el dominio por lo que la herramienta mide** → clasificá por lo que la persona está haciendo cuando la busca. Una herramienta de accesibilidad que se usa al terminar un front va en Diseño y UI, no en calidad web.
- **Saltear "Cuándo NO usarla"** → es el campo que evita que alguien pierda una tarde.
