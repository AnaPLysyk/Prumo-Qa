/** Lê e grava o estado persistente da orquestração dos agentes. */
import fs from "node:fs";
import { Orquestracao, limitesOrquestracao } from "../tipos/orquestracao.js";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";
import path from "node:path";
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { falharCom } from "../../compartilhado/erros.js";

export function listarOrquestracoes(espacoId: string | null, base?: string): { orquestracoes: Orquestracao[]; invalidas: number } {
  const alvo = arquivoDeOrquestracoes(base); semLinks(alvo);
  if (!fs.existsSync(alvo)) return { orquestracoes: [], invalidas: 0 };
  let invalidas = 0; const lidas: Orquestracao[] = [];
  for (const l of fs.readFileSync(alvo, 'utf8').split('\n').filter(Boolean)) {
    try { const o = JSON.parse(l) as Orquestracao; if (!o || typeof o.id !== 'string' || !Array.isArray(o.etapas) || !Array.isArray(o.agentes)) throw Error(); if (o.espacoId === espacoId) lidas.push(o); }
    catch { invalidas++; }
  }
  return { orquestracoes: lidas.slice(-limitesOrquestracao.porConsulta).reverse(), invalidas };
}

/** Onde ficam os registros: um arquivo por computador, com o projeto em cada linha. */
export const arquivoDeOrquestracoes = (base?: string) => path.join(diretorioDados(base), 'orquestracoes.jsonl');

export function registrarOrquestracao(r: Orquestracao, base?: string): void {
  const alvo = arquivoDeOrquestracoes(base); fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 }); semLinks(alvo);
  if (fs.existsSync(alvo) && (!fs.lstatSync(alvo).isFile() || fs.lstatSync(alvo).nlink !== 1)) falharCom('ORCHESTRATION_FILE_INVALID');
  fs.appendFileSync(alvo, JSON.stringify(r) + '\n', { mode: 0o600 });
  const linhas = fs.readFileSync(alvo, 'utf8').split('\n').filter(Boolean);
  if (linhas.length > limitesOrquestracao.registros) fs.writeFileSync(alvo, linhas.slice(-limitesOrquestracao.registros).join('\n') + '\n', { mode: 0o600 });
}
