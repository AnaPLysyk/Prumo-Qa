'use strict';
/** Mostra o histórico das operações externas do projeto selecionado; a habilitação da escrita fica na linha de cada serviço. */
const conexoesBase = abas.conexoes;
abas.conexoes = async el => {
  await conexoesBase(el); const e = estado.espaco; if (!e) return;
  const ops = await chamar(() => api.operacoes(e.id, 15)); if (!ops?.length) return;
  el.append(h('section', { class: 'cx-servicos', id: 'cx-operacoes' }, h('div', { class: 'cx-secao-cab' }, h('h2', {}, 'Operações externas recentes'), DS.info('Tudo o que o Prumo enviou a Jira, Qase ou GitHub neste projeto, com o estado conferido no serviço.')),
    h('ul', { id: 'conexoes-operacoes', class: 'cx-ops' }, ops.map(o => h('li', {}, seloOp(o.estado), h('span', {}, o.resumo), h('span', { class: 'suave' }, hora(o.atualizadoEm)), o.erro ? h('span', { class: 'cx-erro' }, o.erro) : null)))));
};
