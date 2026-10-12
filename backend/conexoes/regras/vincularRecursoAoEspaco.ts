/** Vincula um recurso do serviço ao projeto do Prumo depois de reler o recurso e conferir que nada mudou. */
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { vincularServicoAoEspaco } from '../../projetos/regras/vincularServicoAoEspaco.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { ErroServico } from '../integracoes/ErroServico.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { adaptadorDaConta } from './adaptadorDaConta.js';
import { contaAtiva } from './contaAtiva.js';

export async function vincularRecursoAoEspaco(c: ContextoDosServicos, espacoId: string, conexaoId: string, recurso: Recurso) {
  obterEspaco(espacoId, c.base); const conta = contaAtiva(c, conexaoId);
  const atual = await adaptadorDaConta(c, conta).obterRecurso(recurso.id);
  if (JSON.stringify(atual) !== JSON.stringify(recurso)) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return vincularServicoAoEspaco(espacoId, conta.servico, conta.id, atual, c.base);
}
