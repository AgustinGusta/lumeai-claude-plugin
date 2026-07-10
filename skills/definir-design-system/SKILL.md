---
name: definir-design-system
description: Define el design system de un proyecto LumeAI a partir del esqueleto estandarizado. Úsala al inicio de la Fase 2 (diseño), cuando el usuario pida definir el design system, los tokens, la identidad visual, los colores/tipografías del proyecto, o armar la base de diseño antes de las pantallas. Completa los valores de marca en design/design-system/tokens.css manteniendo la estructura estándar. Corre en Cowork + Claude Design; no necesita MCP.
---

# Definir design system del proyecto (Fase 2 — paso previo a las pantallas)

Esta skill deja listo el design system del proyecto **antes** de diseñar pantallas, para que todas
salgan consistentes. La **estructura** (qué tokens existen, componentes base) viene estandarizada de
`lumeai-base/repo-template/design/design-system/`; esta skill completa los **valores de marca** del
cliente. No sube nada a ADO (es solo diseño, en el repo).

## Responsabilidad y fuente única
La estructura del design system es **canónica** y no se cambia por proyecto: mismos nombres de
tokens en todos los proyectos (así las pantallas son homogéneas en forma). Lo que cambia por
proyecto son los **valores** (colores, tipografía, etc.). Si hace falta un token nuevo transversal,
se agrega al esqueleto de `lumeai-base`, no a un proyecto suelto.

## Requisitos
- No necesita MCP. Corre en **Cowork + Claude Design** (herramienta del diseñador).
- Existe `design/design-system/` en el repo (viene de la plantilla). Si no, copiá el esqueleto de `lumeai-base`.

## Insumos
- Identidad de marca del cliente: logo, paleta, tipografía, tono. Si el cliente los tiene, pedilos.
- Si no hay marca definida, proponé una paleta y tipografía coherentes y **marcá que son propuesta** para revisión. No inventes una identidad definitiva sin validar.

## Procedimiento
1. **Leer el esqueleto:** `design/design-system/tokens.css`, `base.html`, `README.md`. Respetá los nombres de variables; solo cambiás valores.
2. **Completar `tokens.css`:** reemplazá los valores marcados con `{{...}}` y los defaults por los de la marca:
   - Colores: `--color-primary`, `--color-accent`, superficies, texto, estados.
   - Tipografía: `--font-sans` (y tamaños si la marca lo pide).
   - Ajustá radios/espaciado solo si la identidad lo requiere.
   No agregues variables nuevas salvo que sea un token transversal (entonces va al esqueleto de `lumeai-base`).
3. **Verificar en `base.html`:** abrí/revisá el catálogo de componentes con los tokens nuevos y confirmá que se ve coherente (contraste legible, jerarquía clara).
4. **Assets:** logos e imágenes de marca van a `design/assets/`.
5. **No diseñar pantallas acá.** Eso es la skill `disenar-pantalla`.

## Cierre
- Resumen de los valores definidos (paleta, tipografía).
- Recordá: **commit + push** de `design/design-system/` a una rama de trabajo.
- Próximo paso: `disenar-pantalla` para las pantallas de las US.

## Errores comunes
- **Renombrar o quitar tokens** del esqueleto → no. Solo cambiar valores (así las pantallas y otros proyectos no se rompen).
- **Hardcodear colores/medidas** en vez de usar variables → no.
- **Definir una identidad sin validar** cuando el cliente no la dio → proponé y marcá como propuesta.
- **Empezar pantallas sin design system** → primero esta skill, después `disenar-pantalla`.
