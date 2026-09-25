---
name: seguimiento-prospectos-web
description: Gestiona el pipeline de prospectos a los que Lume les mandó (o les va a mandar) una demo web, por mail o por WhatsApp. Registra envíos y respuestas, dice a quién hay que hacerle seguimiento hoy y redacta esos mails, muestra quién abrió la demo (Umami) y limpia demos vencidas de Cloudflare. Úsala cuando el usuario diga "ya mandé el mail a X", "ya le mandé el WhatsApp a X", "X respondió", "¿a quién le tengo que escribir hoy?", "seguimientos", "cómo va el pipeline de webs", "quién vio la demo", "borrar demos viejas", o pida un resumen de prospectos web.
---

# Seguimiento de prospectos web

Mantiene el pipeline al día para que ningún prospecto quede colgado y nadie reciba mails de más.

## Antes de empezar: ¿dónde está abierta la sesión?

Si el directorio de trabajo de esta sesión **no** es la carpeta de prospectos web
(`<Lume>/01-Comercial/Prospectos/Webs`, en la máquina de Agustín `C:\Agustin\Lume\01-Comercial\Prospectos\Webs`)
ni una subcarpeta, **avisale al usuario antes de hacer nada**, corto y claro: las herramientas de
ese repo (Impeccable, la skill `redesign-existing-projects` y las reglas de hookify) solo se activan
si Claude Code se abre en esa carpeta; recomendale cerrar y abrir ahí. Si decide seguir igual,
continuá y recordá que esos controles no están corriendo.

## Rutas

- `pipeline.csv` y `_config.md` en `<Lume>/01-Comercial/Prospectos/Webs/` (ver `demo-web`).
- Scripts: `../demo-web/scripts/pipeline.mjs` y `../demo-web/scripts/umami.mjs`.
- Carpeta de cada prospecto: `<Prospectos/Webs>/<slug>/`, con el mensaje en `01-Comercial/mail.md`
  (`canal=mail`) o `01-Comercial/whatsapp.md` (`canal=whatsapp`). Canal vacío = mail.
- Links de WhatsApp: `../demo-web/scripts/wa-link.mjs`.

## Estados

`candidato` → `demo-lista` → `enviado` → `seguimiento-1` → `seguimiento-2` → `perdido`
Salidas en cualquier momento: `respondio` → `reunion` → `cliente`, `descartado` (lo decide Lume),
`baja` (pidió no recibir más mails: **nunca** volver a contactarlo).

## Registrar eventos

- **"Le mandé el mail / el WhatsApp a X"** → `upsert <slug> estado=enviado enviado_el=<hoy>`.
- **"Mandé el seguimiento"** → `estado=seguimiento-1` o `seguimiento-2`, y sumá la fecha a
  `seguimientos` (ej. `2026-09-30;2026-10-08`).
- **"Respondió"** → pedí o resumí qué dijo. Positivo → `respondio`, y ofrecé preparar la reunión.
  "No me interesa" → `perdido`. "No me escriban" → `baja`. Guardá un resumen en `notas`.
  Por WhatsApp vale igual: "no" o "no me escriban" → `baja`.
- **"Firmó"** → `cliente`, y recordá mover la carpeta `<slug>` de Prospectos a
  `02-Clientes/<Nombre-Cliente>` (tiene la estructura de `_Plantilla-web`) y seguir su
  `CHECKLIST.md`. La demo es el punto de partida del código real: se pasa a un repo
  `<cliente>-web` en ADO y se quita el modo demo (noindex, aviso, formulario desactivado). Si era `tipo=nueva`, la web se
  arma sobre la demo igual; además hay que registrar el dominio (lo ve `propuesta-comercial`).

## Revisión diaria ("¿qué tengo hoy?")

1. `node ../demo-web/scripts/pipeline.mjs <csv> list --json`.
2. Para cada prospecto `enviado`/`seguimiento-*` con `umami_id`, consultá visitas desde
   `enviado_el` con `umami.mjs visitas` (si no hay credenciales, salteá esta columna).
3. Calculá días hábiles desde el último contacto contra el ritmo de `_config.md` (default: seg. 1
   en el día 4, seg. 2 en el día 10). Listá:
   - **Hoy toca seguimiento**: con el texto listo, tomado de `mail.md` o `whatsapp.md` según el `canal`
     (para WhatsApp, con su link `wa.me` regenerado con `wa-link.mjs` si cambiaste el texto) y ajustado
     (si abrió la demo, un "¿llegaste a verla?" directo; nunca "vi que entraste").
   - **Demos listas sin enviar**, recordando el tope diario de cada canal (`_config.md`: 10 mails,
     5 WhatsApp).
   - **Sin respuesta tras seguimiento 2** → proponer pasar a `perdido`.
4. Resumen corto del embudo, separado por `tipo` (`rediseno` / `nueva`): cuántos en cada estado y
   tasa de respuesta sobre enviados, para comparar los dos enfoques.

## Limpieza de demos

Proponé borrar (y esperá OK explícito, porque borrar un proyecto no se puede deshacer) las demos de
prospectos en `perdido`, `baja` o `descartado`, o con más días online que los de `_config.md`:

```
npx wrangler pages project delete <proyecto> --yes   # desde una carpeta vacía (ver demo-web Paso 7)
node ../demo-web/scripts/umami.mjs baja <umami_id>
```

Después, `upsert <slug> demo_url= umami_id= notas="<notas>; demo borrada <fecha>"`. La carpeta
local del prospecto se conserva (sirve si vuelve a aparecer).

## Errores comunes

- **Volver a escribirle a alguien en `baja`** → no; es un pedido explícito y además lo exige la ley.
- **Seguimiento 3, 4, 5…** → no hay. Después del 2, se cierra.
- **Mencionar el tracking** ("vi que abriste el link") → incomoda; usalo solo para decidir.
- **Marcar `enviado` sin que el usuario lo confirme** → el envío lo hace el usuario; se registra
  cuando lo confirma.
