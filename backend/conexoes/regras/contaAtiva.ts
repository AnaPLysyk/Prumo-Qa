/** Busca uma conta de serviço ativa pelo id; se não existe ou foi removida, avisa CREDENTIAL_UNAVAILABLE. */
import { lerContasDeServico } from '../banco/lerContasDeServico.js';
import { ErroServico } from '../integracoes/ErroServico.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';

export function contaAtiva(c: ContextoDosServicos, id: string) {
  const conta = lerContasDeServico(c.base).contas.find(x => x.id === id && x.ativa);
  if (!conta) throw new ErroServico('CREDENTIAL_UNAVAILABLE');
  return conta;
}
