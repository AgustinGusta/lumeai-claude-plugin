---
name: publicar-skill-lumeai
description: Agrega y publica una skill nueva (o actualiza una existente) dentro del plugin lumeai-claude-plugin. Úsala cuando el usuario pida crear, agregar, publicar, subir o actualizar una skill del plugin de LumeAI en Claude Code. Automatiza scaffold + validación + bump de versión + commit/push a GitHub + refresco del plugin, evitando los tropiezos conocidos (author como objeto, credenciales, versión).
---

# Publicar una skill en lumeai-claude-plugin

Esta skill deja una skill nueva **instalada y disponible** en Claude Code, con el mínimo de pasos.
Se apoya en que `lumeai-claude-plugin` **ya es un plugin/marketplace** publicado en **GitHub**
(`AgustinGusta/lumeai-claude-plugin`), que es de donde el marketplace `lumeai` instala. Agregar una skill **no** es
una instalación nueva: es contenido nuevo dentro del mismo plugin.

## Requisitos (verificar antes de empezar)
- Estás en **Claude Code** (no Cowork), con `git` disponible.
- Tenés el repo `lumeai-claude-plugin` clonado localmente (contiene `.claude-plugin/plugin.json`,
  `.claude-plugin/marketplace.json` y `skills/`). Si no, cloná:
  `git clone https://github.com/AgustinGusta/lumeai-claude-plugin.git`
- La credencial de **GitHub** está cacheada en Git Credential Manager, así que el push es
  no-interactivo. Si el push pide password, ver **Errores comunes**.

## REGLA DE ORO: mostrá el plan y esperá OK antes de escribir/pushear
Antes de crear archivos o pushear, mostrale al usuario **qué skill vas a crear** (nombre, descripción,
carpeta) y **qué versión** vas a publicar. Esperá confirmación. No pushees sin OK.

## Paso 0 — Recolectar datos
Preguntá (o confirmá si ya los dio):
- **Nombre de la skill** en `kebab-case` (ej. `handoff-backlog-lumeai`). Es también el nombre de la carpeta.
- **Descripción** de una línea para el frontmatter: cuándo se dispara y qué hace (esto es lo que Claude
  usa para decidir invocarla, así que sé específico con los verbos-gatillo).
- ¿Es **skill nueva** o **actualización** de una existente?

## Paso 1 — Scaffold del SKILL.md
Creá `skills/<nombre>/SKILL.md` con frontmatter válido. **El `name` del frontmatter debe ser idéntico
al nombre de la carpeta.**

```markdown
---
name: <nombre-kebab-case>
description: <cuándo se dispara y qué hace, con verbos-gatillo>
---

# <Título legible>

<cuerpo de la skill: pasos, reglas, errores comunes>
```

Si la skill necesita archivos auxiliares, ponelos dentro de `skills/<nombre>/` y referencialos con rutas
relativas.

## Paso 2 — Bump de versión en plugin.json (OBLIGATORIO)

**Regla dura: TODO push que cambie el contenido de una skill lleva bump de versión, aunque sea un
cambio de una línea.** El criterio es mecánico: si el diff toca **cualquier archivo bajo `skills/`**,
hay bump. Sin excepción por "es chico".

Por qué no es negociable: el marketplace distribuye por número de versión. Si pusheás contenido
nuevo bajo la **misma** versión, `plugin update` no detecta nada y quedan **dos contenidos distintos
publicados bajo el mismo número** — unas máquinas con una cosa y otras con otra. Es exactamente lo
que pasó con la 0.17.0 (salió, y un segundo push la "completó" sin bump: hubo que sacar la 0.17.1
para que se distribuyera).

Editá `.claude-plugin/plugin.json` y subí `version` con SemVer:
- **Skill nueva o funcionalidad nueva** → **minor** (ej. `0.1.0` → `0.2.0`).
- **Corrección o complemento** de una skill existente (incluye completar un push anterior) → **patch**
  (ej. `0.2.0` → `0.2.1`).
- Cambio que rompe uso previo → **major**.

Si un push previo cambió una skill sin bump, el fix es sacar un **patch** que solo suba la versión,
para que el contenido ya pusheado se distribuya.

El bump es lo que hace que Claude Code detecte la actualización al hacer `plugin update`.

## Paso 3 — Actualizar el README (si corresponde)
Agregá la skill nueva a la tabla de skills del `README.md`.

## Paso 4 — Validar ANTES de pushear (evita los bugs conocidos)
Corré estas verificaciones; si alguna falla, arreglala antes de seguir:

```bash
cd <repo>
# JSON válido en ambos manifests
python -c "import json;json.load(open('.claude-plugin/plugin.json'));json.load(open('.claude-plugin/marketplace.json'));print('JSON ok')"
# author DEBE ser objeto {\"name\": ...}, NO string (un string rompe el install en silencio)
python -c "import json;a=json.load(open('.claude-plugin/plugin.json')).get('author');assert isinstance(a,dict),'author debe ser objeto {name:...}';print('author ok')"
# la skill nueva tiene SKILL.md con frontmatter name que matchea la carpeta
python -c "import re,sys,os;n='<nombre>';p=f'skills/{n}/SKILL.md';t=open(p,encoding='utf-8').read();m=re.search(r'name:\s*(\S+)',t);assert m and m.group(1)==n,'name del frontmatter != carpeta';print('skill ok')"
# no quedaron placeholders sin reemplazar
grep -rn "__PROJECT__\|{{PROJECT}}\|{{project}}\|<nombre-kebab-case>\|<Título legible>" skills/<nombre> && echo "REVISAR placeholders" || echo "sin placeholders"
```

## Paso 5 — Commit y push a GitHub
La credencial ya está cacheada en Git Credential Manager; el push es no-interactivo:

```bash
cd <repo>
git add skills/<nombre>/ .claude-plugin/plugin.json README.md
git commit -m "Add skill <nombre> (vX.Y.Z)"
git push origin main
```

## Paso 6 — Refrescar el plugin en Claude Code
El CLI `claude plugin ...` corre desde Bash (no confundir con el slash `/plugin`, que es interactivo):

```bash
claude plugin marketplace update lumeai
claude plugin update lumeai-claude-plugin@lumeai
```

Después decile al usuario que corra **`/reload-plugins`** en su sesión para activar la skill en la
sesión actual (esto no lo puede hacer la skill; en sesiones nuevas arranca sola).

## Paso 7 — Verificar
```bash
# el sha instalado debe ser el del último commit, y la skill nueva debe estar en el cache
python -c "import json;d=json.load(open(r'C:\\Users\\<user>\\.claude\\plugins\\installed_plugins.json',encoding='utf-8'));print([ (k,i.get('version'),i.get('scope'),str(i.get('gitCommitSha'))[:7]) for k,v in d['plugins'].items() for i in v if 'lumeai' in k])"
find "$HOME/.claude/plugins/cache/lumeai" -path "*<nombre>*SKILL.md" -not -path "*/.git/*"
```

## Paso 8 — Cierre
Mostrale al usuario: nombre de la skill, versión publicada, commit, y el recordatorio de `/reload-plugins`.
La skill queda disponible como `/lumeai-claude-plugin:<nombre>` o por auto-trigger según su `description`.

## Errores comunes (lecciones aprendidas)
- **`author` como string en plugin.json** → el install falla en silencio ("(no content)"). Debe ser
  objeto `{"name": "LumeAI"}`. Lo cubre la validación del Paso 4.
- **Olvidar el bump de versión** → `plugin update` no detecta cambios y quedan dos contenidos
  distintos bajo la misma versión (le pasó a la 0.17.0). Si el diff toca `skills/`, hay bump, sí o
  sí. Siempre bumpeá en el Paso 2.
- **El push cuelga o pide password** → Git Credential Manager no tiene credencial de GitHub, y en
  Claude Code el prompt está deshabilitado (`GIT_TERMINAL_PROMPT=0`, `GCM_INTERACTIVE=never`), así que
  falla con `could not read Password`. Reintentá habilitando el flow interactivo, que abre el navegador:
  `$env:GIT_TERMINAL_PROMPT=1; $env:GCM_INTERACTIVE='auto'; git push origin main`.
  Corré ese push **en background**, porque puede quedar esperando a que el usuario elija la cuenta.
- **Confundir este repo con uno de Azure DevOps** → el plugin se publica en **GitHub**. Los repos de
  proyecto y las wikis sí viven en ADO, pero este no.
- **Usar el slash `/plugin` esperando flags** → `--scope` y demás flags solo existen en el CLI
  `claude plugin ...`. El slash `/plugin` es interactivo (menú).
- **`name` del frontmatter != carpeta** → la skill no se descubre bien. Deben coincidir.
