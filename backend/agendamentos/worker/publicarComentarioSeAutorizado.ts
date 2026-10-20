/** Depois de uma execução agendada, publica o comentário de resultado no Jira só se uma política aprovada cobrir o ticket; sem política, deixa preparado. */
import { publicarComentarioDeResultado } from '../../testes/integracoes/publicarComentarioDeResultado.js';
import { elegivelParaPublicar } from '../../testes/regras/elegivelParaPublicar.js';
import { definirEstadoJiraDoTrabalho } from '../repositorioFila.js';
import { Trabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { emitirEventoDoWorker } from './apoioDoWorker.js';

export async function publicarComentarioSeAutorizado(e: EstadoDoWorker, t: Trabalho, r: Rotina) {
  if (!e.d.servicos) return; const pol = elegivelParaPublicar(t, e.base, e.agora());
  if (pol === 'NAO_APLICAVEL') return;
  if (pol === 'SEM_POLITICA') { definirEstadoJiraDoTrabalho(t.id, { estado: 'PREPARADO', codigo: 'PUBLISH_POLICY_MISSING' }, e.base); return; }
  const reg = await publicarComentarioDeResultado(t.id, 'AGENDADO', e.d.servicos, e.base, false, e.agora());
  if (reg.estado === 'FALHA' || reg.estado === 'BLOQUEADO') emitirEventoDoWorker(e, 'PUBLICACAO_JIRA_FALHOU', r.id, t.id, r.nome, `Comentário no Jira não publicado (${reg.erro ?? 'erro'}); o registro local foi mantido.`);
}
