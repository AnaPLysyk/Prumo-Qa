'use strict';
/** Mostra cada proposta e suas ações de revisão. */
function cartaoProposta(e, p, perm, recarregar) {
  const rev = p.revisao; const checks = ['duplicidade', 'requisito', 'risco', 'cobertura'].map(k => h('label', { class: 'opcao linha' }, h('input', { type: 'checkbox', 'data-rev': k }), ({ duplicidade: 'Conferi duplicidade', requisito: 'O requisito está informado e coberto', risco: 'Avaliei o risco', cobertura: 'Avaliei a cobertura' })[k]));
  return h('section', { class: 'agenda-rotina', 'data-proposta': p.id }, h('h2', {}, p.titulo, ' ', selo(p.estado)), h('p', { class: 'suave' }, p.tipo === 'caso' ? 'Caso de teste' : 'Bug', ' · ', p.origem === 'IA' ? 'Sugerido por IA' + (p.cliente ? ' (' + p.cliente + ')' : '') : p.origem === 'PRUMO' ? 'Preparado pelo Prumo a partir de uma falha' : 'Criado por você', ' · ', hora(p.criadaEm)),
    p.similares.length ? h('div', { class: 'nota' }, 'Parecida com ' + p.similares.length + ' proposta(s) existente(s): confira duplicidade antes de publicar.') : null,
    p.requisito ? h('p', {}, 'Requisito: ' + p.requisito) : null, p.risco ? h('p', {}, 'Risco: ' + p.risco) : null,
    p.tipo === 'caso' ? h('details', {}, h('summary', {}, 'Passos (' + (p.dados.passos || []).length + ')'), h('ol', {}, (p.dados.passos || []).map(s => h('li', {}, s.acao + (s.esperado ? ' → ' + s.esperado : '')))))
      : h('details', {}, h('summary', {}, 'Descrição'), h('pre', {}, p.dados.descricao || '')),
    rev ? h('p', { class: 'suave' }, 'Revisada por ' + rev.por + ' em ' + hora(rev.em)) : null, p.remoto ? h('p', {}, 'Publicada: ' + (p.remoto.chave || p.remoto.id) + (p.remoto.url ? ' · ' + p.remoto.url : '')) : null,
    p.estado === 'RASCUNHO' || p.estado === 'REVISADA' ? h('div', {}, h('div', { class: 'dias-semana' }, checks), h('div', { class: 'agenda-acoes' },
      botao('Confirmar revisão…', async () => { const v = Object.fromEntries([...checks].map(c => { const i = c.querySelector('input'); return [i.dataset.rev, i.checked]; })); const r = await api.propostaRevisar(p.id, v); if (!r.ok) avisar(r.error, true); else if (!r.data.canceled) { avisar('Revisão registrada.'); recarregar(); } }),
      p.tipo === 'caso' ? botao('Editar', () => { const cx = $('#pr-slot'); cx.replaceChildren(formularioProposta(e, p, () => { cx.replaceChildren(); recarregar(); })); }) : null,
      botao('Publicar…', async () => { let tipoId; if (p.tipo === 'bug' && !p.dados.tipoId) { const m = await chamar(() => api.servicoConsultar(e.id, 'jira', 'metadados')); const tipos = (m?.dados || []).filter(t => !t.subtarefa); tipoId = (tipos.find(t => /bug|defeito/i.test(t.nome)) || tipos[0])?.id; }
        const r = await api.propostaPublicar(p.id, tipoId); if (!r.ok) { avisar(r.error, true); return; } if (r.data.canceled) return; avisar(r.data.estado === 'CONFIRMADA' ? 'Proposta publicada e confirmada.' : 'Publicação não confirmada: ' + (r.data.erro || r.data.estado), r.data.estado !== 'CONFIRMADA'); recarregar(); }, 'pr-publicar-' + p.id),
      botao('Descartar', async () => { if (await chamar(() => api.propostaDescartar(p.id))) recarregar(); }))) : null);
}
