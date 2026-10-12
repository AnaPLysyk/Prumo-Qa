'use strict';
/** Mostra o catálogo de testes encontrado no repositório. */
async function catalogoRepo(el) {
  const e = estado.espaco; if (!e) return el.append(faltaEspaco());
  const r = await chamar(() => api.testesCatalogo(e.id)); if (!r) return;
  if (r.semPasta) return el.append(h('div', { class: 'vazio', id: 'cat-sem-pasta' }, 'Vincule a pasta do repositório para ler os testes.'), botao('Vincular pasta…', async () => { const x = await chamar(() => api.espacoPasta(e.id)); if (x && !x.canceled) mostrar('testes'); }, 'cat-vincular'));
  const c = r.catalogo; const pref = (() => { try { return JSON.parse(localStorage.getItem('catalogo-filtro')) || {}; } catch { return {}; } })();
  const ativos = new Set(pref.tipos || []); const busca = h('input', { id: 'cat-busca', type: 'search', placeholder: 'Buscar feature ou teste', 'aria-label': 'Buscar feature ou teste', value: pref.busca || '' }); const lista = h('div', { id: 'cat-lista' });
  const salvar = () => { try { localStorage.setItem('catalogo-filtro', JSON.stringify({ tipos: [...ativos], busca: busca.value })); } catch { /* sem armazenamento */ } };
  const chips = h('div', { class: 'met-barra', id: 'cat-tipos', role: 'group', 'aria-label': 'Tipo' }, Object.keys(nomesTipo).filter(t => c.porTipo[t]).map(t => h('label', { class: 'chip-modulo t-' + t }, h('input', { type: 'checkbox', 'data-tipo': t, checked: ativos.has(t), onchange: (ev) => { if (ev.target.checked) ativos.add(t); else ativos.delete(t); salvar(); desenhar(); } }), nomesTipo[t] + ' · ' + c.porTipo[t])));
  const desenhar = () => {
    const q = busca.value.trim().toLowerCase(); let visiveis = 0;
    const nos = c.features.map(f => { const testes = f.testes.filter(t => (!ativos.size || ativos.has(t.tipo)) && (!q || (f.nome + ' ' + t.titulo).toLowerCase().includes(q))); if (!testes.length) return null; visiveis += testes.length;
      return h('details', { class: 'feature-testes', 'data-feature': f.nome }, h('summary', {}, h('strong', {}, f.nome), ' ', h('span', { class: 'suave' }, f.arquivo + ' · ' + testes.length), ' ', f.tipos.map(t => h('span', { class: 'tipo t-' + t }, nomesTipo[t]))),
        h('ul', { class: 'testes-lista' }, testes.map(t => h('li', { 'data-tipo': t.tipo }, h('span', { class: 'tipo t-' + t.tipo, title: t.motivo + ' · confiança ' + t.confianca }, nomesTipo[t.tipo]), ' ', t.titulo, ' ', h('span', { class: 'suave' }, 'L' + t.linha + ' · ' + t.confianca),
          t.passos.length ? h('ol', { class: 'passos-lista' }, t.passos.map(p => h('li', {}, p))) : null))));
    }).filter(Boolean);
    lista.replaceChildren(...(nos.length ? nos : [h('div', { class: 'vazio' }, 'Nenhum teste para este filtro.')]));
    $('#cat-contagem') && ($('#cat-contagem').textContent = visiveis + ' / ' + c.testes);
  };
  busca.addEventListener('input', () => { salvar(); desenhar(); });
  el.append(h('div', { class: 'cat-resumo', id: 'cat-resumo' }, h('div', {}, h('b', {}, String(c.testes)), h('span', {}, 'testes')), h('div', {}, h('b', {}, String(c.features.length)), h('span', {}, 'features')), h('div', {}, h('b', { id: 'cat-contagem' }, c.testes + ' / ' + c.testes), h('span', {}, 'mostrando'))),
    c.testes ? h('div', {}, chips, busca) : h('div', { class: 'vazio' }, 'Nenhum arquivo de teste encontrado na pasta vinculada.'), lista,
    c.truncado ? h('div', { class: 'nota' }, 'Leitura limitada: o repositório tem mais arquivos de teste do que o Prumo lê de uma vez.') : '',
    h('p', { class: 'suave', id: 'cat-aviso' }, c.aviso));
  desenhar();
}
