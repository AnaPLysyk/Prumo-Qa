/** Canal jira:publicar: Publicar o comentário de resultado em um ticket do projeto vinculado (escrita remota, sempre com prévia e confirmação ou política). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoNoIdioma } from '../../aplicativo/bandeja/textoNoIdioma.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';
import { publicarComentarioDeResultado } from '../integracoes/publicarComentarioDeResultado.js';
import { prepararPublicacao } from '../regras/prepararPublicacao.js';

export const jiraPublicar: TratadorDoCanal<'jira:publicar'> = async (a, j) => {
  const i = idiomaAtual(); const prev = prepararPublicacao(a.trabalhoId);
  if (!(await confirmarNoWindows(j, textoNoIdioma('pubTitulo', i), textoNoIdioma('pubMsg', i, { t: prev.ticket }), textoNoIdioma('pubDet', i, { x: prev.texto.slice(0, 1500) }), textoNoIdioma('pubBtn', i)))) return { canceled: true };
  const r = await publicarComentarioDeResultado(a.trabalhoId, 'MANUAL', servicosDoAplicativo, undefined, true);
  return { canceled: false, estado: r.estado, comentarioId: r.comentarioId ?? null, erro: r.erro ?? null };
};
