/** Reabre o contrato da pasta a cada chamada da IA e recusa (PROJECT_BINDING_CHANGED) se o projeto passou a ter outra identidade. */
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';

export async function projetoAindaVinculado(raiz: string, vinculo: Projeto, contratoLeitura?: string) {
  const atual = await carregarProjeto(raiz, contratoLeitura);
  if (atual.manifesto.id !== vinculo.manifesto.id) throw new ErroQa('PROJECT_BINDING_CHANGED', 'Identidade do projeto mudou; reinicie o servidor para vincular o novo histórico.');
  return atual;
}
