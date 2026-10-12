'use strict';
/** Mostra os Contextos como modal dos Agentes, sem criar tela separada no menu. */
// ======================= Contextos dentro de Agentes =======================
// Como Evidências: sem item próprio no menu. Os contextos são o que os agentes podem ler (Cérebro mostra os
// aprovados); a gestão completa (cadastro, aprovação, conflito, histórico) abre em modal a partir de Agentes.
(() => {
  const menu = document.querySelector('#nav [data-aba="contextos"]'); if (menu) menu.hidden = true;
  let corpoCtx = null;
  async function abrirContextos() {
    const caixa = corpoCtx?.isConnected ? corpoCtx : null; const alvo = h('div', { class: 'ds-contextos' }, DS.carregando());
    if (caixa) caixa.replaceChildren(alvo); else { corpoCtx = DS.modal('Contextos do projeto', alvo, { tamanho: 'lg', subtitulo: [h('span', {}, tr('Requisitos, regras e decisões que os agentes podem ler quando aprovados e disponibilizados ao MCP.'))] }); }
    const el = h('div', {}); try { await abas.contextos(el); } catch { el.replaceChildren(DS.estadoTela('erro', 'Não foi possível carregar esta seção.')); }
    el.querySelector('h1')?.remove(); alvo.replaceChildren(...el.childNodes);
  }
  const base = mostrar;
  mostrar = async function (aba) { if (aba === 'contextos') { if (estado.aba !== 'agentes') await base('agentes'); return abrirContextos(); } return base(aba); };
  const agentes = abas.agentes;
  abas.agentes = async (el) => {
    await agentes(el);
    const novo = el.querySelector('#v36-agent-new');
    const contagem = h('span', { class: 'ds-n' });
    const b = h('button', { type: 'button', class: 'acao', id: 'agentes-contextos', title: tr('Requisitos, regras e decisões do projeto que os agentes podem ler'), onclick: () => mostrar('contextos') }, DS.icone('livro'), tr('Contextos'), contagem);
    // Projeto Prumo: ao lado de "Nova prévia". Pasta vinculada (visão legada de clientes MCP): no topo da tela.
    if (novo) novo.before(b); else el.prepend(h('div', { class: 'ds-barra ds-barra-solta' }, b));
    // A contagem chega depois, sem atrasar a renderização da tela.
    if (estado.root) api.contextosListar(estado.root, {}).then((n) => { const l = n?.ok ? n.data.contextos : []; if (l.length) contagem.textContent = tr('{a} de {t} aprovados', { a: l.filter((c) => c.estado === 'APROVADO').length, t: l.length }); }).catch(() => {});
  };
})();
