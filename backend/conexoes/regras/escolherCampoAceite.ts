/** Confere que o campo do Jira existe e é personalizado, e o grava como o campo de critérios de aceite do projeto. */
import { configurarAceite } from '../../projetos/regras/configurarAceite.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { verificarVinculoDoServico } from './verificarVinculoDoServico.js';

export async function escolherCampoAceite(c: ContextoDosServicos, espacoId: string, campo: string) {
  const v = await verificarVinculoDoServico(c, espacoId, 'jira'); const r = await v.adaptador.consultar(v.recurso, 'campos');
  if (!Array.isArray(r.dados) || !r.dados.some(x => x.id === campo && x.custom === true)) throw new Error('JIRA_FIELD_NOT_AVAILABLE');
  return configurarAceite(espacoId, campo, c.base);
}
