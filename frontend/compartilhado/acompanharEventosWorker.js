'use strict';
/** Consulta eventos do worker sem fechar modais nem perder edições. */
// ---- Aviso de eventos do worker (consulta periódica: a ponte não expõe canais de evento livres) ----
// Redesenhar a tela fecha o modal (mostrar → encerrar); com um modal aberto (formulário, detalhe) a lista só é
// atualizada quando ele fechar, para não descartar o que a pessoa está editando ou lendo.
function recarregarSemFecharModal() {
  const aba = estado.aba; const aberto = document.querySelector('dialog[open]');
  if (!aberto) { mostrar(aba); return; }
  if (aberto.dataset.recarregarAoFechar) return; aberto.dataset.recarregarAoFechar = '1';
  aberto.addEventListener('close', () => { delete aberto.dataset.recarregarAoFechar; if (estado.aba === aba) mostrar(aba); }, { once: true });
}
async function consultarEventos() {
  try {
    const r = await api.workerEventos(estado.ultimoEvento || 0); if (!r.ok) return; estado.ultimoEvento = r.data.ultimo;
    for (const e of r.data.eventos) {
      if (e.tipo === 'NAVEGAR') { if (e.destino === 'atualizacoes') { estado.ajudaAlvo = 'atualizacoes'; mostrar('ajuda'); } else mostrar(e.destino); continue; }
      // 2.10.1: aviso automático de versão nova (o processo principal consultou e decidiu: uma vez por versão).
      if (e.tipo === 'ATUALIZACAO_DISPONIVEL') { await atualizarSino(); avisar(e.titulo + '. ' + e.detalhe); if (e.tocarSom) tocarSom(); continue; }
      const erro = ['EXECUCAO_FALHOU', 'EXECUCAO_BLOQUEADA', 'PUBLICACAO_JIRA_FALHOU', 'WORKER_INTERROMPIDO'].includes(e.tipo);
      avisar(`${e.titulo}: ${e.detalhe}`, erro);
      if (e.tipo !== 'AGENDAMENTO_INICIADO' && estado.prefs && estado.prefs.notificarAgenda !== false && estado.prefs.som && !estado.prefs.silenciar) tocarSom();
      if (['agenda', 'inicio'].includes(estado.aba) || (estado.aba === 'testes' && estado.sub?.testes === 'runs')) setTimeout(recarregarSemFecharModal, 300);
    }
    await atualizarWorker();
  } catch { /* a janela pode estar fechando */ }
}
async function iniciarAgenda() {
  const brand = document.querySelector('.marca img'); if (brand) brand.replaceWith(qc.orb(30, 'ocioso'));
  const p = await chamar(api.preferencias); if (p) { estado.prefs = p.preferencias; aplicarTema(p.preferencias.tema); PrumoI18n.definir(p.preferencias.idioma); document.documentElement.lang = p.preferencias.idioma; }
  montarControles(); PrumoI18n.traduzirDocumento(); await atualizarWorker(); await consultarEventos();
  setInterval(consultarEventos, 3000);
}
