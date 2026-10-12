/** Canal propostas:publicar: Publicar uma proposta (caso no Qase ou bug no Jira). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { nomeServico } from '../../aplicativo/tipos/aplicativo.js';
import { prepararOperacao } from '../../conexoes/escrita/prepararOperacao.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { obterProposta } from '../banco/obterProposta.js';
import { podePublicar } from '../regras/podePublicar.js';
import { publicarProposta } from '../regras/publicarProposta.js';

export const propostasPublicar: TratadorDoCanal<'propostas:publicar'> = async (a, j) => {
  const i = idiomaAtual(); const p = obterProposta(a.id); podePublicar(p); const e = obterEspaco(p.espacoId); const op = p.tipo === 'caso' ? 'qase.criar_caso' : 'jira.criar_ticket';
  // 2.10.2: a prévia confirmada usa o mesmo tipo do envio real; sem tipo, recusa antes de pedir confirmação (antes mostrava '1').
  const tipoId = a.tipoId ?? (typeof p.dados.tipoId === 'string' ? p.dados.tipoId : undefined);
  if (p.tipo !== 'caso' && !tipoId) throw new Error('ISSUE_TYPE_REQUIRED: escolha o tipo do ticket (ex.: Bug) antes de publicar.');
  const prev = prepararOperacao(p.espacoId, op, p.tipo === 'caso' ? p.dados : { tipoId, resumo: p.dados.resumo, descricao: p.dados.descricao ?? '', rotulos: p.dados.rotulos ?? [], ...(p.dados.origem ? { origem: p.dados.origem } : {}) });
  if (!(await confirmarNoWindows(j, textoNoIdioma('opTitulo', i), textoNoIdioma('opMsg', i, { s: nomeServico[prev.servico], r: prev.rotulo }), textoNoIdioma('opDet', i, { x: prev.resumo + '\n\n' + prev.efeito, p: e.nome }), textoNoIdioma('opBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await publicarProposta(servicosDoAplicativo, a.id, { confirmado: true, tipoId: a.tipoId })) };
};
