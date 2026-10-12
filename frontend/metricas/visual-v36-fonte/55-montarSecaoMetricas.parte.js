/** Monta um bloco de indicadores configurado. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function secao(v, lista) {
      const d = DEFS[v.id]; const area = h('div', { class: 'v36m-area' });
      const formato = h('select', { 'aria-label': tr('Formato de {grafico}', { grafico: tr(d.nome) }) }, d.tipos.map((k) => h('option', { value: k, selected: k === v.tipo }, tr(NOMES_TIPO[k]))));
      formato.addEventListener('change', () => { v.tipo = formato.value; salvar(); pintar(area, v, lista); });
      const s = h('article', { class: 'v36m-secao' + (d.largo ? ' largo' : ''), 'data-grafico': v.id },
        h('div', { class: 'v36m-cabeca' }, h('h2', { class: 'v36m-titulo' }, tr(d.nome), d.nota ? h('small', {}, tr(d.nota)) : null),
          h('div', { class: 'v36m-acoes' }, formato, h('button', { type: 'button', title: tr('Mover para cima'), 'aria-label': tr('Mover para cima'), onclick: () => mover(v.id, -1) }, '↑'), h('button', { type: 'button', title: tr('Mover para baixo'), 'aria-label': tr('Mover para baixo'), onclick: () => mover(v.id, 1) }, '↓'),
            h('button', { type: 'button', class: 'v36m-alca', draggable: 'true', title: tr('Arrastar para reorganizar'), 'aria-label': tr('Arrastar para reorganizar') }, '⠿'))), area);
      const alcaEl = s.querySelector('.v36m-alca');
      alcaEl.addEventListener('dragstart', (e) => { arrastado = v.id; s.classList.add('arrastando'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', v.id); });
      alcaEl.addEventListener('dragend', () => { arrastado = null; s.classList.remove('arrastando'); });
      s.addEventListener('dragover', (e) => { if (arrastado && arrastado !== v.id) e.preventDefault(); });
      s.addEventListener('drop', (e) => { e.preventDefault(); if (!arrastado || arrastado === v.id) return; const i = vista.findIndex((x) => x.id === arrastado), j = vista.findIndex((x) => x.id === v.id); const [item] = vista.splice(i, 1); vista.splice(j, 0, item); salvar(); desenhar(); });
      let quadro = 0; const ro = new ResizeObserver(() => { cancelAnimationFrame(quadro); quadro = requestAnimationFrame(() => { if (area.isConnected) pintar(area, v, lista); }); }); ro.observe(area); observadores.push(ro);
      return s;
    }
