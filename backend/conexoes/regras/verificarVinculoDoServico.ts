/** Antes de qualquer consulta ou escrita, confere de novo a conta, a identidade e o recurso vinculado; anota no projeto se o vínculo continua válido. */
import { atualizarEstadoDoVinculo } from '../../projetos/regras/atualizarEstadoDoVinculo.js';
import { Servico } from '../../projetos/tipos/espacos.js';
import { ErroServico } from '../integracoes/ErroServico.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { adaptadorDaConta } from './adaptadorDaConta.js';
import { codigoDoErroDeServico } from './codigoDoErroDeServico.js';
import { contaAtiva } from './contaAtiva.js';
import { estadoDoVinculoPeloErro } from './estadoDoVinculoPeloErro.js';
import { vinculoDoServico } from './vinculoDoServico.js';

export async function verificarVinculoDoServico(c: ContextoDosServicos, espacoId: string, servico: Servico, aceitarAlteracao = false) {
  const v = vinculoDoServico(c, espacoId, servico);
  try {
    const conta = contaAtiva(c, v.conexaoId); const a = adaptadorDaConta(c, conta);
    const principal = await a.autenticar(); if (principal.contaId !== conta.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
    const atual = await a.obterRecurso(v.recurso.id);
    if (atual.id !== v.recurso.id || atual.contaId !== v.recurso.contaId || (!aceitarAlteracao && atual.chave !== v.recurso.chave)) throw new ErroServico('SERVICE_SCOPE_CHANGED');
    atualizarEstadoDoVinculo(espacoId, servico, 'VALIDO', undefined, atual, c.base);
    return { adaptador: a, recurso: atual, campoAceite: v.campoAceite };
  } catch (e) { atualizarEstadoDoVinculo(espacoId, servico, estadoDoVinculoPeloErro(e), codigoDoErroDeServico(e), undefined, c.base); throw e; }
}
