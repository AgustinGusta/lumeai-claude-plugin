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
- **`post-cifra` es SOLO para datos propios y verificables** de Lume o de un cliente que autorizó
  el dato. Prohibido usarla con estadísticas de terceros sin fuente y prohibido inventar el número.
  Una cifra falsa en tipografía de 260px es el peor error que puede cometer esta marca. Si el
  usuario pide una pieza de cifra y no aporta un dato propio, proponé otro formato en vez de salir
  a conseguir un número.
- **Nunca prometas resultados** ("duplicá tus ventas"). Lume vende software, no resultados.
- **Tres de cada cuatro piezas no piden nada.** El CTA vive solo en el pilar Novedades y en el
  cierre de carrusel. Educativo, Casos y Detrás de escena no llevan "escribinos" ni link.
- **El caso de éxito se cuenta como historia del cliente**, no como publicidad de Lume: qué le
  pasaba, qué cambió. Lume aparece solo en el isotipo.
- **Sin emojis en la pieza.** En el caption, como mucho uno, y solo si aporta.
- **No hardcodees colores ni medidas en el prompt.** El design system ya los tiene; repetirlos
  invita a que Claude Design los reinterprete.

## Límites duros del sistema

**El título se cuenta en caracteres, no en palabras** — "8 palabras" fallaba en los dos sentidos
(8 cortas entran holgadas, 8 largas se van a tres líneas). El tope depende de la escala
tipográfica de la plantilla, medido con la fuente real:

| Plantilla | Escala del título | 2 líneas | 3 líneas |
|---|---|---|---|
| post-feed, post-cifra | 92px | **40 caracteres** | 50 caracteres |
| historia | 76px | 45 caracteres | 70 caracteres |
| carrusel interior | 60px | 60 caracteres | 89 caracteres |

post-feed y post-cifra son las plantillas más usadas: como referencia rápida, **40 caracteres**
es el número a tener en la cabeza.

Si aparece una escala tipográfica que no está en esta tabla, **no asumas un tope**: medila con la
herramienta `Topes de texto - medición.html` del propio design system y usá el número que salga.

| Elemento | Límite |
|---|---|
| Apoyo en post y carrusel | **72 caracteres** (caja de 644px) |
| Apoyo en historia | **80 caracteres** (caja de 720px) |
| Cita de testimonio (post-testimonio) | **90 caracteres** (4 líneas) |
| Línea explicativa de la cifra (post-cifra) | **75 caracteres** (2 líneas) |
| Título de historia interactiva | **60 caracteres** |
| Acento de color en el título | **2 palabras**, las que cargan el sentido |

**Contá los caracteres de verdad**, no los estimes: `len(texto)`. Un apoyo de 99 caracteres se va
a tres líneas y rompe la composición. El tope es conservador a propósito, porque una frase con
palabras largas ocupa más que una con palabras cortas.

## Los cuatro pilares

| Pilar | Eyebrow | Cuándo | Plantilla |
|---|---|---|---|
| **Educativo** | `EDUCATIVO` | Un tip, un error común, algo que enseña | post-feed o carrusel-instagram |
| **Caso de éxito** | `CASO DE ÉXITO` | La historia de un cliente | post-feed, caso-carrusel o post-testimonio (si hay frase textual) |
| **Detrás de escena** | `DETRÁS DE ESCENA` | Equipo, día a día, cómo se trabaja | post-feed o historia |
| **Novedades** | `NOVEDADES` | Lanzamiento, función nueva | post-feed |

El color lo define el pilar, no el gusto del momento: cada uno tiene su fondo fijo y eso es lo
que hace que la grilla del perfil se lea como un sistema.

**El eyebrow no es un campo creativo.** Se escribe el nombre del pilar en mayúsculas y nada más
—es lo que permite reconocer el tipo de contenido de un vistazo—. La única variación permitida es
calificar el rubro en Casos con un punto medio: `CASO · COMERCIO`, `CASO · GASTRONOMÍA`. Ninguna
otra etiqueta: nada de "Tip", "Consejo" ni inventos por pieza. Si cada publicación inventa su
etiqueta, en veinte posts el feed tiene cuatro nombres para lo mismo y el eyebrow deja de servir.

## Plantillas por formato (transversales a los pilares)

Además de las de cada pilar, hay dos plantillas que no dependen del pilar sino del formato del
contenido. El eyebrow sigue siendo el del pilar de la pieza, no una etiqueta nueva:

| Cuándo | Plantilla |
|---|---|
| Una historia con encuesta, pregunta o cuenta regresiva | `historia-interactiva` |
| Un dato propio en grande (una cifra sola, protagonista) | `post-cifra` |

`post-cifra` tiene guardrail propio (ver Guardrails): solo datos propios y verificables.

**Qué fondo usar** (hoy se decide a dedo; no debería):

- **`post-cifra`:** el fondo lo sigue definiendo el **pilar**, igual que en post-feed —no es una
  elección libre entre clara y oscura. Educativo → crema, Caso de éxito → noche, Detrás de escena
  → halo, Novedades → violeta profundo.
- **`historia-interactiva`:** en historias no hay grilla, así que el fondo es **libre**. Elegí
  clara u oscura por **contraste con la historia anterior** de la secuencia, y decilo
  explícitamente en el prompt.

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
- **Si es el caso de un cliente, preguntá si hay una frase textual del cliente.** Con cita →
  `post-testimonio`; sin cita → post-feed variante Caso de éxito. La cita **no se inventa jamás**:
  si el cliente no la dijo, no existe.

Si el usuario da una idea que necesita un dato que no tiene, decilo y ofrecé la versión sin dato.

### Paso 1 — Elegir pilar y plantilla

Del cuadro de arriba. Si la idea entra en dos pilares, elegí el menos vendedor.
Si la idea tiene más de un concepto, es un carrusel, no un post.

### Paso 2 — Redactar

- **Título:** contá los caracteres contra la tabla de "Límites duros del sistema" según la
  plantilla (40c en post-feed/post-cifra, 45c en historia, 60c en carrusel interior). Que diga
  algo, no que anuncie el tema. "Fotos sueltas no son un catálogo" funciona; "La importancia del
  catálogo digital" no.
- **Acento:** elegí vos las dos palabras que van en color y decilas explícitamente en el prompt.
  Si no las indicás, Claude Design elige y suele pintar media frase.
- **Apoyo:** una idea, dentro del tope. Contá los caracteres y mostrá el número.
- Ofrecé **dos versiones del título** cuando la frase se pueda cortar de más de una forma.
- **Cita (post-testimonio):** no se redacta, se **transcribe**. Si la frase del cliente pasa los
  90 caracteres, se puede recortar por los extremos manteniendo las palabras exactas y marcando
  el corte con puntos suspensivos, pero **no se reescribe ni se "mejora"**. Si ni recortada entra
  sin perder el sentido, la pieza va como post-feed variante Caso de éxito con el título escrito
  por vos, no como testimonio. Avisale al usuario qué recortaste.
- **Cifra (post-cifra):** corta y con su unidad ("24 h", "3×", "48 pedidos"). El número no lleva
  adorno: lo que lo explica es la línea de abajo, que va dentro de los 75 caracteres. Si el
  usuario no aporta un dato propio, no busques uno: proponé otro formato.

### Paso 3 — Entregar

Devolvé tres cosas, en este orden:

1. **El prompt para Claude Design**, en un bloque de código. El molde cambia según la
   plantilla: cada una tiene sus campos y no se mezclan.

   Para `post-feed`, `historia`, `historia-interactiva` y los carruseles:

```
Usá la plantilla [nombre], variante [pilar]. Una sola pieza.

Eyebrow: [nombre del pilar en mayúsculas]
Título: [...]
Apoyo: [...]
Acentuá "[dos palabras]".
```

   Para `post-testimonio` (no lleva título ni acento: el protagonista es la cita):

```
Usá la plantilla post-testimonio, variante Caso de éxito. Una sola pieza.

Eyebrow: CASO DE ÉXITO
Cita: [textual del cliente, hasta 90 caracteres]
Atribución: [nombre] · [rubro]
```

   Para `post-cifra` (la variante se nombra por el pilar, nunca "clara" u "oscura"):

```
Usá la plantilla post-cifra, variante [pilar]. Una sola pieza.

Eyebrow: [nombre del pilar en mayúsculas]
Cifra: [número corto con su unidad]
Línea: [qué significa, hasta 75 caracteres]
```

   En `historia-interactiva`, agregá una línea diciendo qué sticker va encima y que la franja
   tiene que quedar libre.

2. **El caption para Instagram.** Dos o tres frases que amplíen lo que la pieza no dice —
   no que lo repitan. Sin CTA salvo Novedades. Hashtags: entre tres y cinco, específicos
   (`#comerciosuruguay`, no `#business`), o ninguno.

3. **La verificación**, en una línea, con los campos que correspondan a la plantilla:
   título de N/40 (o N/45, N/60 según plantilla) y apoyo de N/72 caracteres en post; cita de
   N/90 en testimonio; línea de N/75 en cifra; título de N/60 en historia interactiva.

## Cierre

Recordale al usuario:

- Entrar a **claude.ai/design → New design → elegir "Lume Design System"** y pegar el prompt.
- **Exportar el HTML** apenas la pieza esté bien: Claude Design está en research preview y hay
  reportes de errores al guardar.
- Si algo no entra o se ve mal, **la corrección va al molde, no a la copia**: pedirle el ajuste
  a la plantilla en el design system, no arreglar la pieza a mano. Si se arregla a mano, la
  próxima nace con el mismo problema.

## Errores comunes

- **Inventar un eyebrow** ("Tip", "Consejo", "Ojo con esto") en lugar de usar el nombre del pilar
  → rompe el reconocimiento de un vistazo y el feed queda con varios nombres para lo mismo.
- **Estimar los caracteres en vez de contarlos** → se va a tres líneas y hay que rehacer.
- **Inventar una estadística** para que el título pegue más fuerte → prohibido, sin excepción.
- **Usar `post-cifra` con un número que no es propio** (ajeno sin fuente o inventado) → el peor
  error de la marca: la cifra va sola y enorme, sin nada que la sostenga.
- **Inventar o retocar la cita de un testimonio** → si el cliente no la dijo, no existe; sin cita
  textual la pieza va post-feed, no post-testimonio.
- **Usar el molde equivocado** → post-testimonio lleva Cita y Atribución, post-cifra lleva Cifra
  y Línea. Ninguna de las dos lleva Título ni Apoyo: si se los mandás, Claude Design improvisa.
- **Nombrar la variante de post-cifra como "clara" u "oscura"** → se nombra por el pilar, que es
  lo que define el fondo.
- **Meter CTA en Educativo o Casos** → rompe la regla de tres de cada cuatro y la cuenta empieza
  a leerse como catálogo.
- **Repetir en el caption lo que ya dice la pieza** → el caption amplía, no subtitula.
- **Dejar que Claude Design elija el acento** → suele pintar media frase y el recurso deja de
  acentuar. Indicá las dos palabras.
- **Repetir colores y medidas en el prompt** → ya están en el design system; repetirlos genera
  deriva.
- **Escribirle a desarrolladores** → el público son dueños de comercios.
- **Usar el tope viejo de "8 palabras" para el título** → ese criterio quedó reemplazado por el
  tope en caracteres de la tabla de arriba (2026-08-15): 8 palabras cortas entran holgadas, 8
  largas se van a tres líneas.
