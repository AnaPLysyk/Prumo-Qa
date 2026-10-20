/** Execução do trabalho e publicação de resultados — arquivos relacionados agrupados para manutenção. */
import { publicarComentarioDeResultado } from "../../testes/integracoes/publicarRunLocal.js";
import { elegivelParaPublicar, publicacaoPodeRepetir } from "../../testes/servicoExecucoes.js";
import { definirEstadoJiraDoTrabalho, listarTrabalhos, obterTrabalho, concluirTrabalho, falharPorInfraestrutura, registrarBatimento } from "../banco/fila.js";
import { Trabalho } from "../tipos/worker.js";
import { Rotina } from "../tipos/rotina.js";
import { EstadoDoWorker, TipoEvento } from "../tipos/worker.js";
import { emitirEventoDoWorker } from "./apoioDoWorker.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { ErroServico } from "../../conexoes/integracoes/configuracaoDosServicos.js";
import { obterRotina } from "../banco/agenda.js";
import { executarTrabalhoDaRotina } from "./executoresDeTrabalhos.js";

// ── publicacoes ──
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

// ── processarTrabalho ──
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
