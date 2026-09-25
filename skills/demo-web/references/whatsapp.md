# Cómo escribir el WhatsApp de la demo (comercios sin web)

Para prospectos `tipo=nueva`, `canal=whatsapp`. Mismos principios que [`mail.md`](mail.md)
(sobre ellos, honesto, es un boceto, pedido chico, baja por Ley 18.331), adaptados al canal.
Lo manda el usuario a mano desde el WhatsApp de Lume (`_config.md` → "WhatsApp"): **Claude no
envía nada**.

## Principios propios del canal

- **Presentarse primero:** es un número desconocido. "Hola, les escribe <nombre>, de Lume."
- **Más corto que el mail:** 50-80 palabras el primero; 1-2 líneas los seguimientos.
- **La imagen va antes y aparte:** `01-Comercial/hoy-propuesta.png` en un mensaje solo, y
  después el texto. En WhatsApp la imagen se ve sin abrir nada.
- **Un solo link** (la demo). Nada de links a lumeai.uy en el primer mensaje.
- **Lo que les falta, no lo que tienen mal:** "quien los busca en Google llega a la ficha, no a
  una web". Nunca criticar su Instagram.
- **Nota de Google solo como dato** ("4,7 con 120 reseñas"), nunca citar reseñas.
- **Tope:** 5 mensajes nuevos por día desde el número de Lume (con más, WhatsApp bloquea el
  número). Nunca automatizar el envío.
- Trato usted/ustedes según `_config.md`.

## Plantilla de referencia (adaptar, no copiar literal)

**Mensaje 1** (imagen `hoy-propuesta.png`, sin texto).

**Mensaje 2:**

> Hola, les escribe <nombre>, de Lume. Vimos que <Empresa> tiene <nota> con <n> reseñas en Google
> y un Instagram muy cuidado, pero no tiene web: quien los busca termina en la ficha de Maps.
>
> Les armamos un boceto de cómo podría ser, con sus fotos y sus datos: <link a la demo>
>
> Es privado, no aparece en Google y no tiene compromiso. ¿Les parece si lo vemos 15 minutos?
>
> Si no les interesa, avísennos y no volvemos a escribirles.

**Seguimiento 1** (día 4 hábil, mismo chat):

> Hola, les dejo de nuevo el boceto de la web por si se traspapeló: <link>. ¿Llegaron a verlo?

**Seguimiento 2** (día 10 hábil, mismo chat, cierre):

> Último mensaje sobre esto para no molestarlos: el boceto queda online hasta el <fecha de
> vencimiento>. Si en algún momento quieren la web, acá estamos.

Después del seguimiento 2, sin respuesta → `perdido`. No hay seguimiento 3.

## Formato de `01-Comercial/whatsapp.md`

Para cada mensaje (primero, seguimiento 1, seguimiento 2): el texto tal cual se manda y, debajo,
el link `wa.me` armado con `scripts/wa-link.mjs <telefono> <archivo con el texto>` (el texto en un
`.txt` del scratchpad, sin el `> ` de las citas). El usuario abre el link, adjunta la imagen en el
primero y manda.
