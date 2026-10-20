/** Publicação agendada no Jira, com política explícita e tentativas controladas. */
import { publicarComentarioDeResultado } from '../../testes/integracoes/publicarComentarioDeResultado.js';
import { elegivelParaPublicar, publicacaoPodeRepetir } from '../../testes/servicoPublicacao.js';
import { definirEstadoJiraDoTrabalho, listarTrabalhos, obterTrabalho } from '../repositorioFila.js';
import { Trabalho } from '../tipos/fila.js';
import { Rotina } from '../tipos/rotina.js';
import { EstadoDoWorker } from '../tipos/worker.js';
import { emitirEventoDoWorker } from './apoioDoWorker.js';

/** Publica somente quando uma política aprovada cobre o trabalho e o ticket. */
export async function publicarComentarioSeAutorizado(estado: EstadoDoWorker, trabalho: Trabalho, rotina: Rotina) {
  if (!estado.d.servicos) return;

  const permissao = elegivelParaPublicar(trabalho, estado.base, estado.agora());
  if (permissao === 'NAO_APLICAVEL') return;

  if (permissao === 'SEM_POLITICA') {
    definirEstadoJiraDoTrabalho(trabalho.id, { estado: 'PREPARADO', codigo: 'PUBLISH_POLICY_MISSING' }, estado.base);
    return;
  }

  const resultado = await publicarComentarioDeResultado(
    trabalho.id, 'AGENDADO', estado.d.servicos, estado.base, false, estado.agora()
  );
  if (resultado.estado === 'FALHA' || resultado.estado === 'BLOQUEADO') {
    emitirEventoDoWorker(
      estado, 'PUBLICACAO_JIRA_FALHOU', rotina.id, trabalho.id, rotina.nome,
      `Comentário no Jira não publicado (${resultado.erro ?? 'erro'}); o registro local foi mantido.`
    );
  }
}

/** Reenvia publicações transitórias após um minuto, sem duplicar ou tentar indefinidamente. */
export async function repetirPublicacoesPendentes(estado: EstadoDoWorker) {
  if (!estado.d.servicos) return;

  const agora = estado.agora();
  for (const trabalho of listarTrabalhos(estado.base)) {
    if (
      trabalho.jira.estado !== 'PENDENTE' ||
      !trabalho.jira.codigo ||
      !publicacaoPodeRepetir(trabalho.jira.codigo)
    ) continue;

    const atual = obterTrabalho(trabalho.id, estado.base);
    const terminado = atual.terminadoEm ? Date.parse(atual.terminadoEm) : 0;
    if (agora.getTime() - terminado < 60000) continue;

    const resultado = await publicarComentarioDeResultado(
      trabalho.id, 'AGENDADO', estado.d.servicos, estado.base, false, agora
    );
    if (resultado.estado === 'FALHA' && resultado.tentativas >= 3) {
      definirEstadoJiraDoTrabalho(
        trabalho.id,
        { estado: 'FALHA', codigo: resultado.erro ?? 'JIRA_PUBLISH_FAILED' },
        estado.base
      );
    }
  }
}
