'use strict';
/** Mostra os vínculos declarados entre referências do projeto. */
// ---------------- Vínculos ----------------
abas.vinculos = async (el) => {
  el.append(h('h1', {}, 'Vínculos'));
  const e = estado.espaco; if (!e) return el.append(faltaEspaco()); const m = await chamar(() => api.vinculosMapa(e.id)); if (!m) return;
  const origemTxt = { DECLARADO_PELO_USUARIO: 'declarado por você', REGISTRADO_PELO_PRUMO: 'registrado pelo Prumo', OBSERVADO: 'observado em execução' }; const nome = (id) => m.nos.find(n => n.id === id)?.rotulo || id;
  el.append(h('div', { class: 'nota', id: 'vinc-aviso' }, m.aviso), h('h2', {}, 'Declarar automação de um caso'), h('p', { class: 'suave' }, 'Cenário → automação (capability ou capability#cenário).'));
  const caso = campoPlataforma('ID do caso no Qase', { id: 'vinc-caso', type: 'number' }); const cap = campoPlataforma('Capability ou capability#cenário', { id: 'vinc-cap', maxlength: 100 }); const motivo = campoPlataforma('Justificativa', { id: 'vinc-just', maxlength: 500, value: 'Declarado pela pessoa' });
  el.append(h('div', { class: 'formulario' }, caso.no, cap.no, motivo.no, botao('Declarar vínculo', async () => { const qv = e.vinculos.find(v => v.servico === 'qase'); if (!qv) { avisar('Vincule o Qase primeiro.', true); return; } const r = await chamar(() => api.espacoAssociar(e.id, { de: { tipo: 'qase', id: String(caso.input.value), vinculoId: qv.id, origem: qv.recurso.chave }, para: { tipo: 'automacao', id: cap.input.value.trim(), origem: 'qa.project.json' }, justificativa: motivo.input.value })); if (r) { avisar('Vínculo declarado.'); mostrar('vinculos'); } }, 'vinc-salvar')));
  el.append(h('h2', {}, 'Relações'), m.arestas.length ? h('div', { class: 'rolagem' }, h('table', { id: 'vinc-tabela' }, h('thead', {}, h('tr', {}, ['De', 'Relação', 'Para', 'Origem'].map(t => h('th', {}, t)))), h('tbody', {}, m.arestas.map(a => h('tr', {}, h('td', {}, nome(a.de)), h('td', {}, a.tipo + (a.nota ? ' · ' + a.nota : '')), h('td', {}, nome(a.para)), h('td', {}, origemTxt[a.origem])))))) : h('div', { class: 'vazio' }, 'Nenhuma relação ainda.'));
  el.append(h('h2', {}, 'Lacunas de cadastro'), m.lacunas.length ? h('ul', { id: 'vinc-lacunas' }, m.lacunas.map(l => h('li', {}, l.mensagem))) : h('p', { class: 'suave' }, 'Nenhuma lacuna de cadastro encontrada.'));
  el.append(h('h2', {}, 'Operações externas recentes'), m.operacoesRecentes.length ? h('ul', { id: 'vinc-operacoes' }, m.operacoesRecentes.map(o => h('li', {}, seloOp(o.estado), ' ', o.resumo, ' · ', hora(o.em), o.remoto?.chave ? ' · ' + o.remoto.chave : ''))) : h('p', { class: 'suave' }, 'Nenhuma operação externa registrada.'));
};

