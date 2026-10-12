/** Confere se a credencial de uma conta ainda funciona e é da mesma identidade; anota a data da validação. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { lerContasDeServico } from '../banco/lerContasDeServico.js';
import { ErroServico } from '../integracoes/ErroServico.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { adaptadorDaConta } from './adaptadorDaConta.js';
import { contaAtiva } from './contaAtiva.js';

export async function validarConta(c: ContextoDosServicos, id: string) {
  const conta = contaAtiva(c, id); const atual = await adaptadorDaConta(c, conta).autenticar();
  if (atual.contaId !== conta.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  const r = lerContasDeServico(c.base); r.contas.find(x => x.id === id)!.validadaEm = new Date().toISOString(); gravarLocal('contas.json', r, c.base);
  return contaAtiva(c, id);
}
