/** Mostra a prévia de uma operação externa: resumo, efeito e chave, sem enviar nada. */
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { chaveDaOperacao } from './chaveDaOperacao.js';
import { escritaHabilitada } from './permissoes.js';
import { operacaoPorId } from './operacaoPorId.js';
import { obterEspaco } from '../../projetos/repositorio.js';

/** Prévia: valida, calcula a chave e devolve o texto que a pessoa vai confirmar. Não grava nem envia nada. */
export function prepararOperacao(espacoId: string, operacaoId: string, bruto: unknown, b?: string) {
  const op = operacaoPorId(operacaoId); if (!op) throw new Error('OPERATION_UNKNOWN: operação desconhecida.'); obterEspaco(espacoId, b);
  const p = op.schema.parse(bruto);
  return { operacao: op.id, servico: op.servico, rotulo: op.rotulo, efeito: op.efeito, resumo: mascarar(op.resumo(p)).slice(0, 400), chave: chaveDaOperacao(espacoId, op.id, p), escritaHabilitada: escritaHabilitada(espacoId, op.servico, b), parametros: p };
}
