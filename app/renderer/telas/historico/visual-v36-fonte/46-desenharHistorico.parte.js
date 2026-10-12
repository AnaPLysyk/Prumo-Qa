/** Atualiza a visualizacao do historico. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function desenhar() {
      desenharPeriodo(); desenharAbas(); const itens = filtradas();
      contagem.textContent = tr('{n} eventos', { n: itens.length });
      if (!itens.length) { lista.replaceChildren(h('div', { class: 'v36h-vazio' }, r.activities.length ? h('span', {}, tr('Nenhuma atividade para este período e filtros.')) : h('span', {}, tr('Nenhuma atividade registrada ainda.')), r.activities.length && dias ? h('button', { type: 'button', onclick: () => { dias = 0; desenhar(); } }, tr('Ver todo o período')) : null)); return; }
      if (vista === 'tabela') { lista.replaceChildren(tabela(itens)); return; }
      const ord = [...itens].sort((x, y) => (ordem === 'desc' ? y.at.localeCompare(x.at) : x.at.localeCompare(y.at)));
      const grupos = new Map(); for (const a of ord) { const k = diaIso(a.at); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(a); }
      lista.replaceChildren(...[...grupos].map(([, as]) => h('section', { class: 'v36h-grupo' },
        h('div', { class: 'v36h-dia' }, ignorar(new Date(as[0].at).toLocaleDateString(local(), { day: 'numeric', month: 'long', year: 'numeric' })), h('span', { class: 'v36h-regua' }), h('small', {}, tr('{n} evento(s)', { n: as.length }))),
        as.map(entrada))));
    }
    [busca].forEach((c) => c.addEventListener('input', desenhar)); [de, ate, fFerr, fEst, fOri, fCli].forEach((c) => c.addEventListener('change', desenhar));
    ordemSel.addEventListener('change', () => { ordem = ordemSel.value; coluna = 'data'; desenhar(); });
    desenhar();
  };

  // ---------------- Gráficos (SVG desenhado a partir dos dados locais) ----------------
