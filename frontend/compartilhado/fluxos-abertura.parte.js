/** Reúne trecho visual da função compartilhado para o bundle fluxos-v40. */
'use strict';
// Grupo B (v40): Tickets, Testes e Rastreabilidade com o Design System. Apresentação apenas: cada leitura e escrita usa
// os canais IPC existentes (servicoConsultar, operacaoExecutar, propostas, runs, espacoAssociar). Nenhuma relação é
// deduzida por nome; escrita externa continua desligada por padrão e confirmada pelo processo principal.
(() => {
  const vinc = (e, s) => e?.vinculos.find((v) => v.servico === s) || null;
  const memoria = (tela, id) => ((estado.ds ||= {})[tela + ':' + id] ||= {});
  const quando = (iso) => (iso ? hora(iso) : '—');
  const duracao = (n) => (n === null || n === undefined ? '—' : n < 1000 ? n + ' ms' : Math.round(n / 100) / 10 + ' s');
  const semProjetoDS = (titulo) => [DS.cabecalho({ titulo }), DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))])];
  const relacoesDe = (e, tipos, id) => (e?.relacoes || []).filter((r) => [r.de, r.para].some((x) => tipos.includes(x.tipo) && String(x.id) === String(id)));
  const outroLado = (r, tipos, id) => ([r.de, r.para].find((x) => !(tipos.includes(x.tipo) && String(x.id) === String(id))) || r.para);
  const vigente = (e, ref) => !ref.vinculoId || e.vinculos.some((v) => v.id === ref.vinculoId);
  const servicoDoTipo = { jira: 'jira', 'jira-bug': 'jira', qase: 'qase', 'qase-run': 'qase', 'qase-defeito': 'qase', github: 'github', 'github-pr': 'github', 'github-commit': 'github', automacao: 'local', evidencia: 'local', execucao: 'local', run: 'prumo', contexto: 'prumo', pasta: 'local', projeto: 'prumo', servico: 'prumo' };
  const escritaDesligada = (servico) => DS.notaPermissao(tr('Escrita no {s} desligada. Habilite em Conexões.', { s: DS.nomesServico[servico] }));
  const atualizarEspaco = async (e) => { const r = await api.espacoObter(e.id); if (r.ok) { estado.espaco = r.data; return r.data; } return e; };
  const resultadoOp = (destino, r) => { if (r && destino?.isConnected) destino.append(painelResultado(r)); return r; };
  const tomStatusJira = (s) => ({ done: 'ok', indeterminate: 'info', new: null }[s?.statusCategory?.key] ?? null);

  /** Nós clicáveis da rastreabilidade e das relações dentro dos modais. */
  function noRef(e, ref, rotulo) {
    const servico = servicoDoTipo[ref.tipo] || 'prumo'; const ok = vigente(e, ref);
    const abrir = { jira: () => abrirTicket(e, ref.id), 'jira-bug': () => abrirTicket(e, ref.id), qase: () => abrirCaso(e, ref.id), 'qase-defeito': () => abrirDefeito(e, ref.id) }[ref.tipo];
    if (!abrir) return h('span', { class: 'ds-no', 'data-servico': servico }, h('i'), rotulo || ref.id);
    const b = h('button', { type: 'button', class: 'ds-no', 'data-servico': servico, 'aria-label': tr('Abrir {t} {id}', { t: ref.tipo, id: ref.id }), disabled: !ok, title: ok ? null : tr('Vínculo original removido; consulta não autorizada ao vínculo atual.') }, h('i'), rotulo || ref.id);
    if (ok) b.addEventListener('click', abrir);
    return b;
  }
  function blocoRelacoes(e, tipos, id) {
    const rels = relacoesDe(e, tipos, id);
    return DS.bloco('Vínculos no Prumo', rels.length ? h('div', { class: 'ds-celula-nos' }, rels.map((r) => { const o = outroLado(r, tipos, id); return noRef(e, o, ({ qase: 'Caso ', 'qase-defeito': 'Defeito ', automacao: '', 'jira-bug': 'Bug ' }[o.tipo] ?? '') + o.id); }))
      : h('p', { class: 'suave' }, tr('Nenhum vínculo declarado.')), DS.link('Ver em Testes › Repositório', () => { DS.fecharModal(); mostrar('vinculos'); }));
  }

  // ======================= Tickets =======================
