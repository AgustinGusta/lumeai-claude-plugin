---
name: provisionar-infra
description: Genera la infraestructura Terraform de un proyecto LumeAI en Azure (Fase 3, Infra). Úsala cuando el usuario pida aprovisionar Azure, armar la infra, generar el Terraform, crear los recursos (SQL, Storage, Key Vault, App Service), o preparar el entorno de staging. GENERA el IaC y muestra el plan; el `terraform apply` lo dispara una persona tras revisar (recursos facturables). Cablea secretos vía Key Vault y el Variable Group de CI/CD. Corre en Claude Code.
---

# Provisionar infraestructura (Fase 3 — Infra)

Genera el Terraform del proyecto para **staging** siguiendo la convención de recursos, muestra el
plan, y deja todo listo para que **una persona aplique**. No crea recursos por su cuenta.

## GUARDRAIL (no negociable)
- **La skill NO ejecuta `terraform apply`.** Genera los `.tf`, corre `init`/`plan` para mostrar qué
  se crearía y el **costo estimado**, y **espera que un humano aplique**. Los recursos son facturables.
- **Secretos:** la skill arma la estructura (Key Vault, referencias, Variable Group) pero **no
  inventa ni escribe valores de secretos**. Los ingresa una persona (o vienen por `TF_VAR_*`/Key Vault).
- **Solo staging** en Fase 3. Prod se aprovisiona en el release (Fase 6).

## Requisitos
- Estás en **Claude Code**, en la raíz del repo (existe `infra/` con el esqueleto de la plantilla).
- **Terraform** instalado y **Azure CLI** logueado (o credenciales `ARM_*`) — para `init`/`plan`.
- Existe el **Storage de estado remoto** (`rg-<project>-tfstate` / `st<project>tfstate` / container `tfstate`). Si no, primero hay que bootstrapearlo (ver Paso 1).

## Convención de recursos (por ambiente)
`rg-<project>-<env>` · `sql-<project>` / `sqldb-<project>` (Serverless Gen5, auto-pause) ·
`st<project><env>` (sin guiones) + CDN `cdn-<project>` · `kv-<project>` · `<project>-api-<env>` +
Managed Identity · `plan-<project>`. Región `brazilsouth`.

## Paso 0 — Datos y contexto
- Confirmá `project` (minúsculas) y que el ambiente es `staging`.
- Leé `infra/README.md`, `infra/CLAUDE.md` y el esqueleto de `infra/environments/staging/`.

## Paso 1 — Estado remoto (si no existe)
Terraform necesita el backend antes de aprovisionar. Si el storage de tfstate no existe, generá un
script/mini-módulo de **bootstrap** (RG + Storage + container `tfstate`) y **pedile al usuario que lo
aplique una vez** (es de bajo costo). No lo metas dentro del estado principal.

## Paso 2 — Generar los módulos y la composición de staging
Completá el esqueleto: creá los módulos en `infra/modules/` y las llamadas en
`infra/environments/staging/main.tf`. Módulos:
- **`sql/`**: `azurerm_mssql_server` + `azurerm_mssql_database` Serverless (`sku_name` GP_S_Gen5, `min_capacity`, `auto_pause_delay_in_minutes`), firewall rule Allow Azure Services (`0.0.0.0`).
- **`storage-cdn/`**: `azurerm_storage_account` (`st<project><env>`, StorageV2, LRS) + container para imágenes + `azurerm_cdn_profile`/`azurerm_cdn_endpoint`.
- **`keyvault/`**: `azurerm_key_vault` + access policy para la Managed Identity del App Service (`get`/`list` secrets).
- **`appservice/`**: `azurerm_service_plan` (Linux, SKU `B1`) + `azurerm_linux_web_app` (dotnet 8), `identity { type = "SystemAssigned" }`, y app settings que referencian secretos de Key Vault (`@Microsoft.KeyVault(...)`).
- Guardá la **connection string** de SQL como **secreto en Key Vault** (`azurerm_key_vault_secret`), no en outputs ni en el repo.
Respetá los nombres de la convención y usá las variables ya definidas en `variables.tf`.

## Paso 3 — init + plan (mostrar, no aplicar)
```bash
cd infra/environments/staging
terraform init
terraform plan -out=tfplan
```
Mostrá al usuario un **resumen del plan** (qué recursos se crean) y una **estimación de costo mensual**
(SQL Serverless ~USD 5-30, App Service B1, Storage/CDN, Key Vault). **Frená acá**: el `apply` lo hace el usuario.

## Paso 4 — Cablear CI/CD y secretos (guía, tras el apply)
Una vez que el usuario aplicó:
- **Service connection de Azure** en ADO (si no existe): indicá crearla (suele requerir la UI/permac_admin) y reemplazá el placeholder `{{AZURE_SERVICE_CONNECTION}}` en los pipelines.
- **Variable Group** en ADO **linkeado a Key Vault** (`kv-<project>`), para que los pipelines lean secretos.
- Confirmá que el **App Service** tiene la Managed Identity con acceso al Key Vault (lo hace el módulo).

## Paso 5 — Cierre
- Resumen de lo generado (módulos, staging) y del plan mostrado.
- Recordá: **el apply lo hace el usuario**; después, **commit + push** de `infra/` (sin `terraform.tfvars` con secretos).
- Estado del entorno y pendientes (service connection, variable group) → dejalos en `infra/CLAUDE.md`.
- Próximo paso: `scaffold-solucion` (si no se corrió) y luego Fase 4 (desarrollo).

## Errores comunes
- **Ejecutar `terraform apply` desde la skill** → NO. Solo generar + `plan`. Aplica una persona.
- **Escribir secretos** en `.tf`, outputs o el repo → no. Van a Key Vault; valores por `TF_VAR_*`/humano.
- **Olvidar el backend de estado** → sin el storage de tfstate, `init` falla. Bootstrapear primero (Paso 1).
- **Aprovisionar prod en Fase 3** → no; solo staging.
- **Commitear `terraform.tfvars`** con secretos → está en `.gitignore`; no lo fuerces.
