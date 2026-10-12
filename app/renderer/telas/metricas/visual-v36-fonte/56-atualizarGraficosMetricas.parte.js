/** Atualiza os graficos e indicadores visiveis. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function desenhar() {
      periodo.replaceChildren(...[7, 30, 90].map((d) => h('button', { type: 'button', 'aria-pressed': String(!intervalo && dias === d), onclick: () => { dias = d; intervalo = null; salvar(); desenhar(); } }, tr('{n} dias', { n: d }))));
      botaoCal.setAttribute('aria-pressed', String(!!intervalo)); botaoCal.replaceChildren(h('span', {}, intervalo ? tr('Período: {de} a {ate}', { de: intervalo[0].split('-').reverse().join('/'), ate: intervalo[1].split('-').reverse().join('/') }) : tr('Calendário')));
      escolhas.replaceChildren(...vista.map((v) => h('label', {}, h('input', { type: 'checkbox', 'data-grafico': v.id, checked: v.on, onchange: (e) => { v.on = e.target.checked; salvar(); desenhar(); } }), h('span', {}, tr(DEFS[v.id].nome)))));
      const lista = filtrados(); observadores.splice(0).forEach((o) => o.disconnect());
      const ativos = vista.filter((v) => v.on);
      grade.replaceChildren(...(ativos.length ? ativos.map((v) => secao(v, lista)) : [h('div', { class: 'v36m-vazio' }, tr('Escolha pelo menos um gráfico em Editar gráficos.'))]));
      menu.replaceChildren(
        h('button', { type: 'button', role: 'menuitem', onclick: () => { menu.hidden = true; download('prumo-metricas-observadas.json', JSON.stringify({ fonte: 'registros-locais', periodo: intervalo || { dias }, complete: m.complete, registros: lista }, null, 2)); } }, tr('Exportar JSON')),
        h('button', { type: 'button', role: 'menuitem', onclick: () => { menu.hidden = true; const cel = (x) => '"' + String(x ?? '').replaceAll('"', '""').replace(/^[\t\r\n ]*[=+@-]/, "'$&") + '"'; download('prumo-metricas-observadas.csv', ['Horário,Tipo,Resultado,Fonte,Ambiente,Execução,Ticket,Duração (ms)', ...lista.map((r) => [r.at, r.tipo, r.status, r.fonte, r.ambiente, r.origem, r.ticket, r.duracao].map(cel).join(','))].join('\r\n'), 'text/csv;charset=utf-8'); } }, tr('Exportar CSV')));
    }
    [busca, fTicket].forEach((c) => c.addEventListener('input', desenhar)); [fFonte, fRes, fTipo, fAmb, fOri].forEach((c) => c.addEventListener('change', desenhar));
    desenhar();
  };

  // Detalhes de atividade usados pelo painel de atividades dos Agentes.
