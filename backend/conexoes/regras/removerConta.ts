/** Desativa uma conta, apaga sua credencial e marca os vínculos que a usavam como "sem credencial"; nada é apagado no serviço. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { listarEspacos } from '../../projetos/banco/listarEspacos.js';
import { atualizarEstadoDoVinculo } from '../../projetos/regras/atualizarEstadoDoVinculo.js';
import { lerContasDeServico } from '../banco/lerContasDeServico.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';

export function removerConta(c: ContextoDosServicos, id: string) {
  const r = lerContasDeServico(c.base); const conta = r.contas.find(x => x.id === id); if (!conta) throw new Error('CONNECTION_NOT_FOUND');
  conta.ativa = false; gravarLocal('contas.json', r, c.base); c.cofre.remover(id);
  for (const e of listarEspacos(c.base)) for (const v of e.vinculos) if (v.conexaoId === id) atualizarEstadoDoVinculo(e.id, v.servico, 'SEM_CREDENCIAL', 'CREDENTIAL_UNAVAILABLE', undefined, c.base);
  return { removida: true };
}
