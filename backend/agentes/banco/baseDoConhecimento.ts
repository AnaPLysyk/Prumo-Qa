/** Identidade, escopo e localização do banco de conhecimento dos agentes. */
import path from 'node:path';
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { contaDaSessao } from '../../login/regras/sessao.js';
import { idsAgentes, uuid } from '../tipos/conhecimento.js';

/** Banco de conhecimento compartilhado, fora das pastas dos projetos. */
export const caminhoConhecimento = (base?: string) =>
  path.join(diretorioDados(base), 'conhecimento.db');

/** Sem sessão válida, dados pessoais não são consultados ou gravados. */
export function pessoaDoConhecimento(base?: string): string | null {
  try {
    return contaDaSessao(base)?.id ?? null;
  } catch {
    return null;
  }
}

/** Mantém o código de erro do conhecimento disponível à camada que chamou. */
export function falharConhecimento(codigo: string): never {
  throw Object.assign(new Error(codigo), { codigo });
}

export function validarAgenteDoConhecimento(agente: string | null | undefined) {
  if (agente != null && !idsAgentes.has(agente)) {
    falharConhecimento('KNOWLEDGE_AGENT_UNKNOWN');
  }
  return agente ?? null;
}

export function validarProjetoDoConhecimento(projeto: string | null | undefined) {
  if (projeto != null && !uuid.test(projeto)) {
    falharConhecimento('KNOWLEDGE_SCOPE_INVALID');
  }
  return projeto ?? null;
}
