---
name: scaffold-solucion
description: Genera la estructura de código de un proyecto LumeAI (Fase 3, Infra): la solución .NET 8 Clean Architecture (Api/Core/Infra/Jobs + Tests) y el frontend Next.js. Úsala cuando el usuario pida scaffoldear la solución, crear el esqueleto del backend/frontend, inicializar el proyecto .NET o Next.js, o dejar el código listo para desarrollar. Genera SOLO la estructura (proyectos, referencias, paquetes); las entidades y la lógica las agrega el dev en Fase 4. Corre en Claude Code.
---

# Scaffold de la solución (Fase 3 — Infra)

Deja el esqueleto de código listo para desarrollar: solución .NET 8 Clean Architecture + Next.js.
**Solo estructura** — sin entidades ni lógica de negocio (eso es Fase 4, con contexto de las US).

## Requisitos
- Estás en **Claude Code**, en la raíz del repo (existe `backend/` y `frontend/` de la plantilla, con `SCAFFOLD.md`).
- **.NET 8 SDK** y **Node 20/npm** instalados.
- Los placeholders `{{PROJECT}}`/`__PROJECT__` ya fueron reemplazados en Fase 0 (`setup-proyecto-lumeai`). Si no, reemplazalos primero (nombre del producto, ej. `TottemApp`).

## Paso 0 — Contexto
Leé `backend/SCAFFOLD.md` y `frontend/SCAFFOLD.md` (traen los comandos exactos) y el `CLAUDE.md` raíz + `backend/CLAUDE.md`.

## Paso 1 — Solución .NET (Clean Architecture)
Desde `backend/`, creá la solución y los proyectos (usá el nombre real del producto en vez de `{{PROJECT}}`):
```bash
cd backend
dotnet new sln -n {{PROJECT}}
dotnet new web      -n {{PROJECT}}.Api   -o src/{{PROJECT}}.Api
dotnet new classlib -n {{PROJECT}}.Core  -o src/{{PROJECT}}.Core
dotnet new classlib -n {{PROJECT}}.Infra -o src/{{PROJECT}}.Infra
dotnet new worker   -n {{PROJECT}}.Jobs  -o src/{{PROJECT}}.Jobs
dotnet new xunit    -n {{PROJECT}}.Tests -o tests/{{PROJECT}}.Tests
dotnet sln add src/{{PROJECT}}.Api src/{{PROJECT}}.Core src/{{PROJECT}}.Infra src/{{PROJECT}}.Jobs tests/{{PROJECT}}.Tests
dotnet add src/{{PROJECT}}.Api   reference src/{{PROJECT}}.Core src/{{PROJECT}}.Infra
dotnet add src/{{PROJECT}}.Infra reference src/{{PROJECT}}.Core
dotnet add src/{{PROJECT}}.Jobs  reference src/{{PROJECT}}.Core src/{{PROJECT}}.Infra
dotnet add tests/{{PROJECT}}.Tests reference src/{{PROJECT}}.Core src/{{PROJECT}}.Infra
```
Paquetes base (según `backend/CLAUDE.md`): EF Core SqlServer + Design + Tools en `Infra`; Identity.EntityFrameworkCore, Authentication.JwtBearer, Serilog.AspNetCore, Serilog.Sinks.Console, Azure.Identity, Azure.Extensions.AspNetCore.Configuration.Secrets en `Api`.

**Verificá que compila:** `dotnet build`. Si falla, arreglá antes de seguir. **No agregues entidades ni lógica** (eso es Fase 4).

## Paso 2 — Frontend Next.js
Desde `frontend/`:
```bash
cd frontend
npx create-next-app@latest . --ts --eslint --app --use-npm
```
Confirmá `npm run dev` y `npm run build`. Dejá los scripts que usan los pipelines (`lint`, `build`).

## Paso 3 — Limpieza
- Borrá los `.gitkeep` de las carpetas que ya tienen contenido real.
- Actualizá el **`CLAUDE.md` raíz** (sección "Estado actual": estructura scaffoldeada, qué falta).

## Cierre
- Resumen: solución .NET creada y compilando, Next.js inicializado.
- Recordá **commit + push** del scaffold a una rama de trabajo.
- (Opcional) reflejar el trabajo como Task en **Area `Infra`** vía MCP, para visibilidad.
- Próximo paso: `provisionar-infra` (si no se corrió) y luego Fase 4 (desarrollo de las US).

## Errores comunes
- **Generar entidades o lógica de negocio** → no; esto es solo estructura. Las entidades las hace el dev en Fase 4.
- **Dejar placeholders `{{PROJECT}}`** sin reemplazar → la solución no compila; reemplazá por el nombre real.
- **No verificar el build** → siempre `dotnet build` y `npm run build` antes de cerrar.
