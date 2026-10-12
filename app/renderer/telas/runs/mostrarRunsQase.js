'use strict';
/** Mostra as runs Qase e suas opções de operação. */
// ---------------- Planos e Runs ----------------
abas.runs = async (el) => {
  el.append(h('h1', {}, 'Features'));
  const e = semProjetoServico(el, 'qase'); if (!e) { if (estado.espaco) el.append(h('div', { class: 'vazio' }, 'Vincule o Qase em Conexões.')); return; }
  const perm = await escritaDoProjeto(e); const on = !!perm.qase; const recarregar = () => mostrar('runs'); const nova = h('div', { id: 'run-nova' }); const saida = h('div', { id: 'run-saida' });
  el.append(avisoEscrita('qase', on), h('h2', {}, 'Nova execução'), nova);
  const casos = await chamar(() => api.servicoConsultar(e.id, 'qase', 'casos', { limite: 100 })); const lista = casos?.dados || []; const titulo = campoPlataforma('Título da execução', { id: 'run-titulo', maxlength: 255 });
  const amb = selecaoSimples('run-ambiente', [['teste', 'Teste'], ['homologacao', 'Homologação'], ['local', 'Local']]); const marcados = new Set();
  nova.append(h('div', { class: 'formulario' }, titulo.no, h('label', { class: 'campo' }, 'Ambiente', amb), h('div', { class: 'campo' }, h('span', {}, 'Cenários (' + lista.length + ')'), lista.length ? h('div', { id: 'run-casos' }, lista.map(c => h('label', { class: 'opcao linha' }, h('input', { type: 'checkbox', 'data-caso': c.id, onchange: (ev) => (ev.target.checked ? marcados.add(c.id) : marcados.delete(c.id)) }), `${c.id} · ${c.title}`))) : h('p', { class: 'suave' }, 'Nenhum caso retornado pelo Qase.')),
    botao('Preparar run', async () => { const sel = lista.filter(c => marcados.has(c.id)).map(c => ({ casoId: c.id, titulo: String(c.title).slice(0, 255) })); const r = await chamar(() => api.runPreparar({ espacoId: e.id, titulo: titulo.input.value, ambiente: amb.value, casos: sel })); if (r) { avisar('Run preparada localmente. Ainda não existe no Qase.'); recarregar(); } }, 'run-preparar'),
    botao('Criar plano com os casos marcados…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'qase.criar_plano', { titulo: titulo.input.value || 'Plano Prumo', casos: [...marcados] })) || ''); }, 'plano-criar')), saida);
  const runs = await chamar(() => api.runs(e.id)); el.append(h('h2', {}, 'Execuções do projeto'));
  if (!runs?.length) el.append(h('div', { class: 'vazio', id: 'runs-vazio' }, 'Nenhuma execução preparada.')); for (const r of runs || []) el.append(cartaoRun(e, r, on, recarregar));
};
