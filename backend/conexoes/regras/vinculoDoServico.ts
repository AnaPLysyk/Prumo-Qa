/** Busca a ligação do projeto com um serviço (Jira, Qase ou GitHub); se não existe, avisa WORKSPACE_LINK_NOT_FOUND. */
import { obterEspaco } from '../../projetos/repositorio.js';
import { Servico } from '../../projetos/contratos.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';

export function vinculoDoServico(c: ContextoDosServicos, espacoId: string, servico: Servico) {
  const v = obterEspaco(espacoId, c.base).vinculos.find(x => x.servico === servico);
  if (!v) throw new Error('WORKSPACE_LINK_NOT_FOUND');
  return v;
}
