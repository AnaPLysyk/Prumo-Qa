/** Lê um projeto ou repositório devolvido pelo serviço e confere id e chave no formato esperado (e sem a credencial dentro). */
import { Recurso, identidadeRecurso } from '../../projetos/contratos.js';
import { ConfigServico, nome, obj, sid } from '../tipos/adaptador.js';
import { ErroServico } from './ErroServico.js';
import { limparRespostaDoServico } from './limparRespostaDoServico.js';

export function recursoDaResposta(c: ConfigServico, v: unknown): Recurso {
  const o = obj.parse(v); const s = c.servico;
  const id = sid.parse(s === 'qase' ? o.code : o.id); const chave = nome.parse(s === 'github' ? o.full_name : s === 'jira' ? o.key : o.code);
  if (id === c.token || chave.includes(c.token) || !(s === 'qase' ? /^[A-Z][A-Z0-9]{1,9}$/.test(id) : /^\d{1,20}$/.test(id)) || !(s === 'github' ? /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(chave) : /^[A-Z][A-Z0-9_]*$/.test(chave))) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  return identidadeRecurso.parse({ id, chave, nome: limparRespostaDoServico(c, nome.parse(s === 'github' ? o.name : s === 'jira' ? o.name : o.title)), instancia: c.instancia, contaId: c.contaId, tipoId: s === 'qase' ? 'codigo_api' : 'id_api' });
}
