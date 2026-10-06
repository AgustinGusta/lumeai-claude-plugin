# Configuración comercial de prospectos web

> La leen las skills `buscar-prospectos-web`, `demo-web` y `seguimiento-prospectos-web`.
> **Sin contraseñas ni API keys acá:** esas van como variables de entorno.

## Remitente

- Nombre: <Nombre Apellido>
- Rol: <ej. Fundador · Lume>
- Casilla desde la que se envía: <nombre>@lumeai.uy
- Copia (CC), opcional: <casilla compartida>@lumeai.uy
- Firma: <ruta a firma.html> (+ firma.txt e imágenes al lado; va en el borrador con `--firma`, no en mail.md)
- Teléfono / WhatsApp para la firma: <+598 …>
- Web: https://lumeai.uy

## Tono

- Tratamiento: tuteo (default) / voseo / usted
- Nada técnico en ningún texto que lea el cliente (mail, seguimientos, WhatsApp): sin mediciones,
  notas, avisos del navegador, códigos de error ni nombres de tecnología
- País del mercado objetivo: Uruguay

## Ritmo

- Máximo de mails nuevos por día: 10 (subir de a poco: con más, la casilla termina en spam)
- Seguimiento 1: día 4 hábil después del envío
- Seguimiento 2: día 10 hábil después del envío
- Demos online: 60 días desde el envío (después se borran si no hubo interés)

## WhatsApp (comercios sin web)

- Número de Lume desde el que se escribe: <+598 9X XXX XXX>
- Se presenta como: <Nombre>, de Lume
- Máximo de WhatsApp nuevos por día: 5 (WhatsApp bloquea números con mucho mensaje en frío)
- Seguimientos: mismos días que el mail (4 y 10 hábiles), por el mismo chat
- Línea de baja: "Si no les interesa, avísennos y no volvemos a escribirles."

## Búsqueda

- Rubros prioritarios: <ej. estudios contables, clínicas dentales, inmobiliarias, talleres>
- Zonas: <ej. Montevideo, Canelones, Maldonado>
- Excluir: cadenas, franquicias, sitios que ya parecen hechos por agencia
- Comercios sin web: nota ≥ 4,3, ≥ 30 reseñas, celular (WhatsApp) e Instagram con publicaciones en
  los últimos 3 meses.

## Barrido

Lo lee `cobertura.mjs` (skill `buscar-prospectos-web`, barrido ordenado). Cada rubro con sus
consultas separadas por `|`; se barren en este orden.

- Zona inicial: mvd (Montevideo) = -34.94,-56.44,-34.70,-56.01
- Rubros, en orden:
  1. ferreterias: ferretería | pinturería
  2. opticas: óptica
