/** Executa um trabalho da fila do começo ao fim: batimento, aviso de início, execução, registro do resultado e publicação; falhas viram BLOCKED ou nova tentativa, nunca PASS. */
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { publicacaoPodeRepetir } from '../../testes/servicoPublicacao.js';
import { concluirTrabalho } from '../repositorioFila.js';
import { definirEstadoJiraDoTrabalho } from '../repositorioFila.js';
import { falharPorInfraestrutura } from '../repositorioFila.js';
import { obterRotina } from '../repositorioAgenda.js';
import { registrarBatimento } from '../repositorioFila.js';
import { Trabalho } from '../tipos/fila.js';
import { EstadoDoWorker, TipoEvento } from '../tipos/worker.js';
import { emitirEventoDoWorker } from './apoioDoWorker.js';
import { executarTrabalhoDaRotina } from './executarTrabalhoDaRotina.js';
import { publicarComentarioSeAutorizado } from './publicarComentarioSeAutorizado.js';

export async function processarTrabalho(e: EstadoDoWorker, t: Trabalho) {
  let erroLeitura: unknown = null;
  const rotina = (() => { try { return obterRotina(t.rotinaId, e.base); } catch (erro) {
    if ((erro as Error).message === 'SCHEDULE_NOT_FOUND') return null;
    erroLeitura = erro; return null;
  } })();
  const bat = setInterval(() => { try { registrarBatimento(t.id, e.base, e.agora()); } catch { /* trabalho removido */ } }, e.d.heartbeatMs ?? 30000); bat.unref?.();
  const nome = rotina?.nome ?? (erroLeitura ? 'Rotina indisponível' : 'Rotina removida'); e.processando = true;
  emitirEventoDoWorker(e, 'AGENDAMENTO_INICIADO', t.rotinaId, t.id, nome, `Execução ${t.tipo} iniciada${t.origem === 'MANUAL' ? ' (manual)' : ''}.`);
  try {
    if (erroLeitura) throw erroLeitura;
    if (!rotina) { concluirTrabalho(t.id, { status: 'NOT_RUN', motivo: 'A rotina foi excluída antes da execução.' }, e.base, e.agora()); return; }
    const resultado = await executarTrabalhoDaRotina(e, t, rotina);
    if (e.abort.signal.aborted && (resultado.status === 'BLOCKED' && /CANCELLED/.test(resultado.motivo))) {
      falharPorInfraestrutura(t.id, 'CANCELLED', 'Interrompido porque o Prumo foi encerrado durante a execução; a evidência parcial foi preservada.', false, e.base, e.agora());
      emitirEventoDoWorker(e, 'EXECUCAO_BLOQUEADA', rotina.id, t.id, nome, 'Execução interrompida ao encerrar o Prumo.'); return;
    }
    const fim = concluirTrabalho(t.id, resultado, e.base, e.agora());
    const evento: TipoEvento = resultado.status === 'FAIL' ? 'EXECUCAO_FALHOU' : resultado.status === 'BLOCKED' ? 'EXECUCAO_BLOQUEADA' : 'EXECUCAO_CONCLUIDA';
    emitirEventoDoWorker(e, evento, rotina.id, t.id, nome, `${resultado.status}: ${resultado.motivo}`.slice(0, 200));
    // O resultado já está gravado: uma falha ao publicar nunca pode reescrevê-lo como BLOCKED.
    try { await publicarComentarioSeAutorizado(e, fim, rotina); }
    catch (erro) {
      const cod = erro instanceof ErroServico ? erro.codigo : erro instanceof ErroQa ? erro.codigo : /^([A-Z][A-Z0-9_]{2,63})\b/.exec((erro as Error).message)?.[1] ?? 'PUBLICATION_ERROR';
      try { definirEstadoJiraDoTrabalho(t.id, { estado: publicacaoPodeRepetir(cod) ? 'PENDENTE' : 'FALHA', codigo: cod.slice(0, 80) }, e.base); } catch { /* registro do trabalho indisponível */ }
      emitirEventoDoWorker(e, 'PUBLICACAO_JIRA_FALHOU', rotina.id, t.id, nome, `Resultado preservado; comentário no Jira não publicado (${cod}).`);
    }
  } catch (erro) {
    const cod = erro instanceof ErroServico ? erro.codigo : erro instanceof ErroQa ? erro.codigo : /^([A-Z][A-Z0-9_]{2,63})\b/.exec((erro as Error).message ?? '')?.[1] ?? 'WORKER_ERROR';
    const infra = ['SERVICE_TIMEOUT', 'SERVICE_UNAVAILABLE', 'SERVICE_RATE_LIMIT'].includes(cod);
    if (infra) { falharPorInfraestrutura(t.id, cod, `Falha de infraestrutura: ${cod}`, true, e.base, e.agora()); emitirEventoDoWorker(e, 'EXECUCAO_FALHOU', t.rotinaId, t.id, nome, `Falha de infraestrutura (${cod}); nova tentativa automática se restar alguma.`); }
    else { concluirTrabalho(t.id, { status: 'BLOCKED', motivo: `${cod}: ${(erro as Error).message}`.slice(0, 600) }, e.base, e.agora()); emitirEventoDoWorker(e, 'EXECUCAO_BLOQUEADA', t.rotinaId, t.id, nome, `${cod}`); }
  } finally { clearInterval(bat); e.processando = false; }
}
