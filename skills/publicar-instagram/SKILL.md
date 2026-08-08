---
name: publicar-instagram
description: Convierte una idea suelta en una publicación lista para el Instagram de Lume. Úsala cuando el usuario diga que quiere postear algo, armar un post, una historia o un carrusel, publicar una novedad, contar un caso de un cliente, o pedir contenido para redes. Elige el pilar, redacta el texto dentro de los límites del sistema (título, apoyo y caption), y entrega el prompt listo para pegar en Claude Design más el caption para Instagram. Corre en Cowork; no necesita MCP.
---

# Publicar en Instagram (marca Lume)

Lume tiene un design system de marca ya armado y publicado en **Claude Design**
("Lume Design System"), con plantillas para post, historia y carrusel. Esta skill **no diseña**:
redacta el contenido respetando los límites del sistema y devuelve el prompt que se pega en
Claude Design, más el caption del post.

El cuello de botella real no es armar la pieza, es escribir texto que entre. Los topes de
caracteres son estrictos y no se estiran: si el texto no entra, se reescribe el texto.

## Fuente de verdad

Está en el **proyecto Claude "LumeAI"**, carpeta `marca/`:

- `marca/manual-instagram.md` — cómo operar el sistema (esta skill lo automatiza)
- `marca/sistema-visual.md` — paleta, tipografía y reglas, con los contrastes medidos

Si la sesión tiene el proyecto adjunto, **leelos antes de escribir**. Los valores de abajo son
el resumen operativo para poder trabajar aunque no estén disponibles; ante discrepancia, manda
el proyecto.

## Requisitos

- **Cowork** (o Code). No necesita MCP.
- El usuario necesita acceso a **claude.ai/design** con el sistema "Lume Design System"
  disponible (está publicado, no es el default de la organización: hay que elegirlo).

## Guardrails (fijos, no se negocian)

- **Nunca inventes datos, cifras ni estadísticas.** Si una idea necesita un número para
  funcionar, o el usuario lo aporta, o se reescribe sin el número. Un "el 70% de los comercios…"
  inventado es un riesgo reputacional, no un recurso creativo.
- **Nunca prometas resultados** ("duplicá tus ventas"). Lume vende software, no resultados.
- **Tres de cada cuatro piezas no piden nada.** El CTA vive solo en el pilar Novedades y en el
  cierre de carrusel. Educativo, Casos y Detrás de escena no llevan "escribinos" ni link.
- **El caso de éxito se cuenta como historia del cliente**, no como publicidad de Lume: qué le
  pasaba, qué cambió. Lume aparece solo en el isotipo.
- **Sin emojis en la pieza.** En el caption, como mucho uno, y solo si aporta.
- **No hardcodees colores ni medidas en el prompt.** El design system ya los tiene; repetirlos
  invita a que Claude Design los reinterprete.

## Límites duros del sistema

| Elemento | Límite |
|---|---|
| Título | **8 palabras** |
| Apoyo en post y carrusel | **72 caracteres** (caja de 644px) |
| Apoyo en historia | **80 caracteres** (caja de 720px) |
| Acento de color en el título | **2 palabras**, las que cargan el sentido |

**Contá los caracteres de verdad**, no los estimes: `len(texto)`. Un apoyo de 99 caracteres se va
a tres líneas y rompe la composición. El tope es conservador a propósito, porque una frase con
palabras largas ocupa más que una con palabras cortas.

## Los cuatro pilares

| Pilar | Cuándo | Plantilla |
|---|---|---|
| **Educativo** | Un tip, un error común, algo que enseña | post-feed o carrusel-instagram |
| **Caso de éxito** | La historia de un cliente | post-feed o caso-carrusel |
| **Detrás de escena** | Equipo, día a día, cómo se trabaja | post-feed o historia |
| **Novedades** | Lanzamiento, función nueva | post-feed |

El color lo define el pilar, no el gusto del momento: cada uno tiene su fondo fijo y eso es lo
que hace que la grilla del perfil se lea como un sistema.

## Tono

Voseo uruguayo, frases cortas, cero jerga técnica. El público son dueños de comercios y pymes,
no desarrolladores. Se les habla de su negocio, no del stack. La landing y el playbook comercial
ya tienen este tono: "Sabés en todo momento", "Contanos brevemente", "te respondemos en menos de
24 horas".

Evitá: "solución integral", "potenciamos", "transformación digital", "llevá tu negocio al
siguiente nivel". Si una frase podría estar en cualquier empresa de software, no sirve.

## Procedimiento

### Paso 0 — Entender la idea

Pedí lo mínimo que falte, agrupado en una sola tanda:

- **De qué querés hablar** (si el usuario ya lo dijo, no lo repreguntes).
- **Formato**, si no es obvio: post, historia o carrusel. Ante la duda, post.
- **Datos concretos**, si la idea los pide: nombre del cliente, qué pasó, qué número real hay.

Si el usuario da una idea que necesita un dato que no tiene, decilo y ofrecé la versión sin dato.

### Paso 1 — Elegir pilar y plantilla

Del cuadro de arriba. Si la idea entra en dos pilares, elegí el menos vendedor.
Si la idea tiene más de un concepto, es un carrusel, no un post.

### Paso 2 — Redactar

- **Título:** hasta 8 palabras. Que diga algo, no que anuncie el tema. "Fotos sueltas no son un
  catálogo" funciona; "La importancia del catálogo digital" no.
- **Acento:** elegí vos las dos palabras que van en color y decilas explícitamente en el prompt.
  Si no las indicás, Claude Design elige y suele pintar media frase.
- **Apoyo:** una idea, dentro del tope. Contá los caracteres y mostrá el número.
- Ofrecé **dos versiones del título** cuando la frase se pueda cortar de más de una forma.

### Paso 3 — Entregar

Devolvé tres cosas, en este orden:

1. **El prompt para Claude Design**, en un bloque de código, con este molde:

```
Usá la plantilla [nombre], variante [pilar]. Una sola pieza.

Eyebrow: [...]
Título: [...]
Apoyo: [...]
Acentuá "[dos palabras]".
```

2. **El caption para Instagram.** Dos o tres frases que amplíen lo que la pieza no dice —
   no que lo repitan. Sin CTA salvo Novedades. Hashtags: entre tres y cinco, específicos
   (`#comerciosuruguay`, no `#business`), o ninguno.

3. **La verificación**, en una línea: título de N palabras, apoyo de N caracteres sobre el
   tope del formato.

## Cierre

Recordale al usuario:

- Entrar a **claude.ai/design → New design → elegir "Lume Design System"** y pegar el prompt.
- **Exportar el HTML** apenas la pieza esté bien: Claude Design está en research preview y hay
  reportes de errores al guardar.
- Si algo no entra o se ve mal, **la corrección va al molde, no a la copia**: pedirle el ajuste
  a la plantilla en el design system, no arreglar la pieza a mano. Si se arregla a mano, la
  próxima nace con el mismo problema.

## Errores comunes

- **Estimar los caracteres en vez de contarlos** → se va a tres líneas y hay que rehacer.
- **Inventar una estadística** para que el título pegue más fuerte → prohibido, sin excepción.
- **Meter CTA en Educativo o Casos** → rompe la regla de tres de cada cuatro y la cuenta empieza
  a leerse como catálogo.
- **Repetir en el caption lo que ya dice la pieza** → el caption amplía, no subtitula.
- **Dejar que Claude Design elija el acento** → suele pintar media frase y el recurso deja de
  acentuar. Indicá las dos palabras.
- **Repetir colores y medidas en el prompt** → ya están en el design system; repetirlos genera
  deriva.
- **Escribirle a desarrolladores** → el público son dueños de comercios.
