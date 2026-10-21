/** Lê e grava o estado persistente da orquestração dos agentes. */
import fs from "node:fs";
import { Orquestracao, limitesOrquestracao } from "../tipos/chat.js";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";
import path from "node:path";
import { diretorioDados, usuarioDoEscopo } from "../../compartilhado/banco/diretorioDados.js";
import { registrarAuditoria } from "../../logs/banco/diagnostico.js";
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
  const linhas = fs.existsSync(alvo) ? fs.readFileSync(alvo, 'utf8').split('\n').filter(Boolean) : [];
  const existente = linhas.findIndex(l => {
    try { return JSON.parse(l).id === r.id; } catch { return false; }
  });
  if (existente >= 0) linhas[existente] = JSON.stringify(r);
  else linhas.push(JSON.stringify(r));
  // Uma única entrada por diagnóstico, atualizada com os resultados de cada etapa real.
  fs.writeFileSync(alvo, linhas.slice(-limitesOrquestracao.registros).join('\n') + '\n', { mode: 0o600 });
  // Cada avanço real é registrado também no histórico de ações da conta, sem texto da conversa.
  registrarAuditoria({ canal: 'agentes:orquestracao', tipo: 'ORQUESTRACAO', estado: r.estado,
    usuarioId: usuarioDoEscopo(), espacoId: r.espacoId, correlacao: r.id,
    duracaoMs: r.duracaoMs, codigo: null, agente: r.emExecucao || r.etapas.at(-1)?.agente || null,
    ambiente: 'local', dispositivo: null, navegador: null }, base);
}
