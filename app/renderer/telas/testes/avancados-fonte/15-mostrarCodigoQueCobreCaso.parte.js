/** Mostra somente código relacionado ao caso por anotação ou vínculo. Parte de testes-v40.js; nao carregar isoladamente. */
  function blocoCodigoDoCaso(e, id) {
    const alvo = h('div', {}, h('p', { class: 'suave' }, tr('Procurando anotações no código…')));
    (async () => { if (!e.pastaLocal) { alvo.replaceChildren(h('p', { class: 'suave' }, tr('Vincule a pasta do repositório para localizar o código deste caso.'))); return; }
      const src = await fontes(e); const vq = vinc(e, 'qase'); const declarados = relacoesDe(e, ['qase'], id).map((x) => outroLado(x, ['qase'], id)).filter((x) => x.tipo === 'automacao').map((x) => x.id); const impl = []; for (const f of src.cat?.catalogo?.features || []) for (const t of f.testes) if (casaQase(vq, t.qase || [], id) || declarados.includes(f.arquivo + ':' + t.linha)) impl.push({ ...t, arquivo: f.arquivo });
      alvo.replaceChildren(impl.length ? h('ul', { class: 'ds-lista' }, impl.map((t) => h('li', {}, h('button', { type: 'button', class: 'ds-link seta', onclick: () => abrirNoCodigo(e, t.arquivo, t.linha) }, t.arquivo + ':' + t.linha), h('span', { class: 'ds-sub' }, t.titulo), h('span', { class: 'ds-chips' }, chipNivel(t.tipo), ...t.tags.map(chipTag)))))
        : h('p', { class: 'suave' }, tr('Nenhum teste do código anota este caso (qase({id}) ou "Qase: {id}").', { id }))); })();
    return DS.bloco('Código que implementa', alvo);
  }
