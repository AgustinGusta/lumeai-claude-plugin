#!/usr/bin/env node
// Arma el link de WhatsApp (wa.me) con el mensaje ya escrito, para que el
// usuario lo abra, adjunte la imagen si corresponde y lo mande. No envía nada.
// Sin dependencias.
//
// Uso:
//   node wa-link.mjs <telefono> <archivo-con-el-texto>
//
// El teléfono puede venir como en el pipeline ("099 123 456", "+598 99 …").
// Solo celulares uruguayos: un fijo no tiene WhatsApp (exit 1).

import { readFileSync } from "node:fs";
import { waLink } from "./prospectos-comun.mjs";

const [tel, archivo] = process.argv.slice(2);
if (!tel || !archivo) { console.error("Uso: node wa-link.mjs <telefono> <archivo-texto>"); process.exit(2); }

try {
  console.log(waLink(tel, readFileSync(archivo, "utf8").replace(/^﻿/, "")));
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
