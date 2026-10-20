/** raizDoAplicativo: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

// --- raizDoAplicativo ---
export const raizDoAplicativo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// --- versaoDoPacote ---
export const versaoDoPacote:string=JSON.parse(readFileSync(new URL('../../package.json',import.meta.url),'utf8')).version;
