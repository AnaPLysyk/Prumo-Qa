/** Persistência de configuracoes: operações relacionadas no mesmo módulo. */
import path from "node:path";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { semLinks } from "../compartilhado/seguranca/semLinks.js";
import { Preferencias, preferenciasSchema, padrao } from "./contratos.js";

export const arquivoDePreferencias = (base?: string) => path.join(diretorioDados(base), 'preferencias.json');

export function gravarPreferencias(p: Preferencias, base?: string) {
  const alvo = arquivoDePreferencias(base); semLinks(alvo); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
  const tmp = `${alvo}.${randomUUID()}.tmp`; fs.writeFileSync(tmp, JSON.stringify(preferenciasSchema.parse(p), null, 2), { mode: 0o600 }); fs.renameSync(tmp, alvo); return p;
}

export function lerPreferencias(base?: string): Preferencias {
  try { semLinks(arquivoDePreferencias(base)); return preferenciasSchema.parse(JSON.parse(fs.readFileSync(arquivoDePreferencias(base), 'utf8'))); } catch { return { ...padrao }; }
}
