/** Registra historico local das alteracoes do agente. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    const chaveMudancas = 'prumo-v36-mudancas-' + e.id;
    const lerMudancas = () => { try { const m = JSON.parse(localStorage.getItem(chaveMudancas) || '{}'); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; } catch { return {}; } };
    function registrarMudanca(id, chaves) { if (!chaves.length) return; try { const m = lerMudancas(); m[id] = { em: new Date().toISOString(), chaves: chaves.slice(0, 60) }; localStorage.setItem(chaveMudancas, JSON.stringify(m)); } catch { /* armazenamento indisponível */ } }
    const linhasInstrucao = (texto) => String(texto || '').split(/\n+|(?<=[.;!?])\s+/).map(l => l.trim()).filter(Boolean).slice(0, 24);
    function figuraRobo(host, x, modo, area) { if (!PrumoRobos.criar(host, x.index, modo, area)) host.append(portrait(x.index, modo !== 'lista')); return host; }
    const bolinha = (cor) => { const i = h('i'); i.style.background = cor; return i; };
