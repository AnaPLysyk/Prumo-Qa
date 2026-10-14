/** Autoriza execuções agendadas de uma capacidade do projeto. */
import { autorizarEscopo } from './autorizarEscopo.js';
import { Solicitador } from '../tipos/autorizacoes.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { solicitarAprovacao } from '../../testes/aprovacao/solicitarAprovacao.js';
import { escopoDeCapability } from '../../testes/regras/escopoDeCapability.js';

export async function autorizarExecucao(p: Projeto, espacoId: string, capability: string, ambiente: string, opcoes: { dias: number; maxUsos: number }, base?: string, solicitar: Solicitador = solicitarAprovacao, agora = new Date()) {
  return autorizarEscopo(p, espacoId, capability, ambiente, await escopoDeCapability(p, capability), opcoes, base, solicitar, agora);
}
