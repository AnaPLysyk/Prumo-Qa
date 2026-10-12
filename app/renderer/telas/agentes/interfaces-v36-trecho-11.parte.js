/** Reúne trecho visual da função agentes para o bundle interfaces-v36. */
  const activityDetails = detalhesAtividade;

  // ---------------- Agentes: especializações fixas do núcleo; cadastros personalizados = prévias locais ----------------
  function readDrafts(id) { try { const a = JSON.parse(localStorage.getItem('prumo-v36-drafts-' + id) || '[]'); if (!Array.isArray(a) || a.length > 50) throw Error('Lista inválida'); return a.map(validateDraft); } catch { avisar('Prévias locais inválidas: não puderam ser carregadas.', true); return []; } }
  function validateDraft(a) {
    if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).some(k => !['version', 'id', 'nome', 'descricao', 'objetivo', 'instrucoes'].includes(k)) || a.version !== 1 || typeof a.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(a.id)) throw Error('Formato de prévia inválido.');
    for (const k of ['nome', 'descricao', 'objetivo', 'instrucoes']) if (typeof a[k] !== 'string' || a[k].length > (k === 'nome' ? 100 : 4000)) throw Error('Campo inválido: ' + k);
    if (!a.nome.trim() || !a.objetivo.trim() || !a.instrucoes.trim()) throw Error('Nome, objetivo e instruções são obrigatórios.');
    return { version: 1, id: a.id, nome: a.nome.trim(), descricao: a.descricao, objetivo: a.objetivo.trim(), instrucoes: a.instrucoes.trim() };
  }
  const iconeCerebro = () => sv('svg', { class: 'v36-icone', viewBox: '0 0 24 24', width: 26, height: 26, 'aria-hidden': 'true' }, sv('path', { d: 'M12 18V5a3 3 0 0 0-5.7-1.3A4.5 4.5 0 0 0 4 10.5 4.4 4.4 0 0 0 5 17.5 3.5 3.5 0 0 0 12 18Z' }), sv('path', { d: 'M12 18V5a3 3 0 0 1 5.7-1.3A4.5 4.5 0 0 1 20 10.5a4.4 4.4 0 0 1-1 7A3.5 3.5 0 0 1 12 18Z' }), sv('path', { d: 'M8 9a3 3 0 0 1-3 3m3 2a3 3 0 0 0 3 3m5-8a3 3 0 0 0 3 3m-3 2a3 3 0 0 1-3 3' }));
  const iconeBusca = () => sv('svg', { class: 'v36-icone', viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true' }, sv('circle', { cx: 10.5, cy: 10.5, r: 6.5 }), sv('path', { d: 'm15.5 15.5 4.5 4.5' }));
  function iconeCliente(cliente) {
    const caixa = h('span', { class: 'v36a-cliente-icone ' + cliente });
    const marca = cliente === 'claude'
      ? sv('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...Array.from({ length: 12 }, (_, i) => sv('path', { d: 'M32 32 L' + (32 + Math.cos(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1) + ' ' + (32 + Math.sin(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1), stroke: '#d97757', 'stroke-width': 6.5, 'stroke-linecap': 'round' })))
      : sv('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...Array.from({ length: 6 }, (_, i) => sv('rect', { x: 26, y: 9, width: 12, height: 30, rx: 6, fill: 'none', stroke: '#f2f5fb', 'stroke-width': 3.4, transform: 'rotate(' + i * 60 + ' 32 32)' })));
    caixa.append(marca); return caixa;
  }
  const CORES_NEURONIO = ['#6ea8ff', '#5bd9bd', '#bea1f8', '#f2c977', '#ff9fb8', '#7ad7ff', '#a7de82', '#ffba90'];
  // Céu profundo da tela Agentes: nebulosas lentas, estrelas em três profundidades e meteoros raros. Decorativo.
  function espaco(el) {
    document.querySelectorAll('.v36a-ceu').forEach((c) => c.remove()); const cv = h('canvas', { class: 'v36a-ceu', 'aria-hidden': 'true' }); document.body.append(cv);
    const ruido = (s) => { const x = Math.sin(s) * 43758.5453; return x - Math.floor(x); };
    const estrelas = Array.from({ length: 320 }, (_, i) => ({ x: ruido(i * 12.9898 + 1), y: ruido(i * 78.233 + 2), z: .15 + ruido(i * 3.17) ** 2 * .85, f: ruido(i * 9.71) * 6.28, cor: ruido(i * 5.3) }));
    const nebulas = [[.78, .16, '96,72,210', .20], [.16, .82, '24,128,176', .16], [.52, .52, '140,64,170', .08], [.94, .78, '40,90,200', .12]];
    let iniciado = false, meteoro = null, proximo = 4000;
    function quadro(t) {
      const naTela = document.body.dataset.tela === 'agentes'; if (naTela) iniciado = true; else if (iniciado || !cv.isConnected) { cv.remove(); return; } else { requestAnimationFrame(quadro); return; }
      if (document.hidden) { requestAnimationFrame(quadro); return; }
      const W = innerWidth, H = innerHeight, d = Math.min(devicePixelRatio || 1, 1.5), ctx = cv.getContext('2d'), parado = reduzido(), tt = parado ? 0 : t;
      if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
      const tema = document.documentElement.dataset.tema, claro = tema === 'claro' || (tema !== 'escuro' && matchMedia('(prefers-color-scheme: light)').matches);
      ctx.setTransform(d, 0, 0, d, 0, 0); const fundo = ctx.createLinearGradient(0, 0, 0, H); fundo.addColorStop(0, claro ? '#f4f7fd' : '#02040c'); fundo.addColorStop(1, claro ? '#e3eaf7' : '#060c1f'); ctx.fillStyle = fundo; ctx.fillRect(0, 0, W, H);
      for (const [nx, ny, cor, a] of nebulas) { const x = (nx + Math.sin(tt * .00003 + nx * 9) * .03) * W, y = (ny + Math.cos(tt * .000025 + ny * 7) * .03) * H, r = Math.max(W, H) * .55; const g = ctx.createRadialGradient(x, y, 0, x, y, r); const aa = claro ? a * .7 : a; g.addColorStop(0, `rgba(${cor},${aa})`); g.addColorStop(.45, `rgba(${cor},${aa * .35})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      for (const s of estrelas) { const x = ((s.x * W - tt * .006 * s.z) % W + W) % W, y = s.y * H, brilho = .25 + .75 * Math.abs(Math.sin(tt * .0011 * (.4 + s.z) + s.f)), r = .35 + s.z * 1.35;
        ctx.fillStyle = claro ? (s.cor > .82 ? `rgba(110,80,200,${brilho * .7})` : s.cor > .65 ? `rgba(40,100,190,${brilho * .7})` : `rgba(30,50,90,${brilho * .55})`) : s.cor > .82 ? `rgba(190,170,255,${brilho})` : s.cor > .65 ? `rgba(150,205,255,${brilho})` : `rgba(235,242,255,${brilho * .9})`;
        if (s.z > .82) { ctx.shadowColor = claro ? 'rgba(60,110,200,.6)' : 'rgba(160,200,255,.9)'; ctx.shadowBlur = 8; } ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0; }
      if (!parado) { if (!meteoro && t > proximo) meteoro = { x: Math.random() * W * .8 + W * .2, y: Math.random() * H * .4, ini: t }; if (meteoro) { const k = (t - meteoro.ini) / 900; if (k > 1) { meteoro = null; proximo = t + 7000 + Math.random() * 9000; } else { const x = meteoro.x - k * 260, y = meteoro.y + k * 120, g = ctx.createLinearGradient(x, y, x + 90, y - 42); const mc = claro ? '40,90,180' : '220,235,255'; g.addColorStop(0, `rgba(${mc},${.85 * (1 - k)})`); g.addColorStop(1, `rgba(${mc},0)`); ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y - 42); ctx.stroke(); } } }
      if (!parado) requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }
  abas.agentes = async el => {
    el.classList.add('v36a'); espaco(el); el.append(h('h1', { class: 'v36-sr' }, 'Agentes'));
    const e = estado.espaco; if (!e) { el.append(h('div', { class: 'v36a-sem' }, note(tr('Selecione um projeto para consultar as especializações e configurar permissões.')))); const legacy = h('div'); await agentesLegado(legacy); legacy.querySelector('h1')?.remove(); el.append(legacy); return; }
    const s = await chamar(() => api.agentesEstado(e.id)); if (!s) return;
    let drafts = readDrafts(e.id); let activeTab = 'agents', painelVivo = null;
    const body = h('div', { id: 'v36-agents-body', class: 'v36a-corpo' });
    const tabs = h('div', { class: 'v36a-abas', role: 'group', 'aria-label': tr('Áreas de agentes') },
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'agents', 'aria-pressed': 'true', onclick: () => showTab('agents') }, tr('Agentes')),
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'activity', 'aria-pressed': 'false', onclick: () => showTab('activity') }, tr('Painel de atividades')));
    el.append(tabs, body);
    const habilitada = (id) => s.configuracao.especializacoes.includes(id);
    const capsDe = (x) => s.matriz.filter(c => x.capacidades?.includes(c.id));
    function saveDrafts(next) { try { localStorage.setItem('prumo-v36-drafts-' + e.id, JSON.stringify(next)); drafts = next; return true; } catch { avisar('Não foi possível persistir a prévia local.', true); return false; } }
    function showTab(tab) { activeTab = tab; if (tab !== 'activity') painelVivo?.parar(); tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.agentTab === tab))); if (tab === 'agents') list(); else activity(); }
    function resumoCaps(x) { const c = capsDe(x); const auth = c.filter(k => k.estado === 'EXIGE_AUTORIZACAO').length, bloq = c.filter(k => k.estado === 'BLOQUEADO').length;
      return [h('strong', {}, tr('{n} capacidades', { n: c.length })), auth ? h('small', {}, tr('{n} exige autorização', { n: auth })) : null, bloq ? h('small', { class: 'v36a-bloq' }, tr('{n} bloqueada(s)', { n: bloq })) : null]; }
    function list() {
      const search = h('input', { type: 'search', 'aria-label': tr('Buscar agente'), placeholder: tr('Localizar agente'), oninput: render, autocomplete: 'off' });
      const lista = h('div', { class: 'v36a-constelacao', id: 'v36-agent-list', role: 'list' }); const conta = h('span', { class: 'v36a-conta' });
      const novo = h('button', { type: 'button', class: 'v36a-primario', id: 'v36-agent-new', onclick: () => detail({ version: 1, id: 'previa-' + crypto.randomUUID(), nome: '', descricao: '', objetivo: '', instrucoes: '', preview: true, index: drafts.length + 8 }, true) }, '+ ', tr('Nova prévia'));
      const orbe = h('span', { class: 'v36a-orbe' }, h('img', { src: asset('robo-original.png'), alt: '' })); PrumoOrbitas.anexar(orbe);
      const orq = h('button', { type: 'button', class: 'v36a-astro v36a-astro-orq', role: 'listitem', 'aria-label': tr('Conversar com o Prumo Orchestrator'), onclick: () => flutuante?.abrir() },
        h('span', { class: 'v36a-astro-figura' }, orbe),
        h('span', { class: 'v36a-astro-nome' }, 'Prumo Orchestrator'), h('span', { class: 'v36a-astro-sub' }, tr('Assistente local no Prumo')),
        h('span', { class: 'v36a-astro-estado' }, h('i', { class: 'ok' }), h('span', {}, tr('Sem modelo de IA'))));
      const clientesEl = []; let clientes = [];
      if (estado.root) chamar(() => api.conexoes(estado.root)).then((r) => { if (!r || !lista.isConnected) return; clientes = r; render(); });
      function astroCliente(c) {
        const nome = c.client === 'claude' ? 'Claude Code' : c.client === 'codex' ? 'Codex' : c.client;
        const usado = c.lastObserved ? tr('Última chamada: {quando}', { quando: hora(c.lastObserved.at) }) : tr('Nenhuma chamada observada');
        return h('button', { type: 'button', class: 'v36a-astro v36a-astro-cliente', role: 'listitem', 'data-cliente': c.client, 'aria-label': tr('Cliente MCP {nome}', { nome }), onclick: () => { const d = document.getElementById('v36-clients'); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } },
          h('span', { class: 'v36a-astro-figura' }, iconeCliente(c.client)), h('span', { class: 'v36a-astro-nome' }, nome), h('span', { class: 'v36a-astro-sub' }, tr('Cliente conectado por MCP')),
          h('span', { class: 'v36a-astro-estado' }, h('i', { class: c.state === 'UTILIZADO' || c.state === 'VALIDADO' ? 'ok' : c.state === 'ERRO' ? 'erro' : 'off' }), h('span', {}, selo(c.state))), h('span', { class: 'v36a-astro-sub' }, usado));
      }
      function render() {
        const q = search.value.trim().toLowerCase();
        const items = [...s.especializacoes.map((x, i) => ({ ...x, nome: x.rotulo, index: i })), ...drafts.map((x, i) => ({ ...x, index: i + 8, preview: true }))].filter(x => (x.nome + ' ' + (x.skill || '')).toLowerCase().includes(q));
        conta.textContent = String(items.length);
        lista.replaceChildren(...(!q || 'prumo orchestrator'.includes(q) ? [orq] : []), ...clientes.filter(c => !q || c.client.includes(q)).map(astroCliente), ...items.map((x, k) => {
          const ligado = x.preview ? null : habilitada(x.id); const caps = x.preview ? [] : capsDe(x);
          const astro = h('button', { type: 'button', class: 'v36a-astro', role: 'listitem', 'data-agent': x.id, title: tr('Configurar agente'), onclick: () => detail(x) });
          astro.style.setProperty('--face-color', palette[x.index % 8]); astro.style.setProperty('--atraso', (-k * 1.3) + 's');
          astro.append(figuraRobo(h('span', { class: 'v36a-astro-figura' }), x, 'lista', astro),
            h('span', { class: 'v36a-astro-nome', 'data-i18n-ignore': '' }, x.nome), h('span', { class: 'v36a-astro-sub' }, x.preview ? tr('Prévia local · sem execução') : x.skill),
            h('span', { class: 'v36a-astro-estado' }, h('i', { class: x.preview ? '' : ligado ? 'ok' : 'off' }), h('span', {}, x.preview ? tr('Somente neste computador') : ligado ? tr('Habilitada no projeto') : tr('Desabilitada no projeto')),
              x.preview ? null : h('span', { class: 'v36a-astro-caps' }, ' · ', tr('{n} capacidades', { n: caps.length }))));
          return astro; }));
        if (!lista.children.length) lista.append(h('div', { class: 'v36a-vazio' }, tr('Nenhum agente para esta busca.')));
      }
      const clientContent = h('div', { id: 'v36-client-panel' }); let loaded = false;
      const clients = h('details', { class: 'v36a-secao-extra', id: 'v36-clients', ontoggle: async ev => { if (!ev.currentTarget.open || loaded) return; loaded = true; await agentesLegado(clientContent); clientContent.querySelector('h1')?.remove(); } }, h('summary', {}, tr('Clientes MCP · diagnóstico e configuração')), clientContent);
      body.replaceChildren(
        h('div', { class: 'v36a-topo' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Agentes'), ' ', conta), h('p', {}, tr('Especializações do núcleo e prévias locais deste projeto.'))),
          h('div', { class: 'v36a-acoes' }, h('label', { class: 'v36a-busca' }, iconeBusca(), search), novo)),
        lista, h('p', { class: 'v36a-nota' }, tr('Especializações reais do núcleo. Habilitação não comprova sessão nem execução ativa. Retratos com movimento visual, sem articulação facial 3D.')),
        legacyPolicies(), clients);
      render();
    }
    // Matriz completa do projeto (mesmos seletores da tela 2.9), com confirmação nativa para salvar.
    function legacyPolicies() {
      const esp = new Set(s.configuracao.especializacoes), pol = { ...s.configuracao.politicas };
      const save = h('button', { type: 'button', class: 'v36a-primario', id: 'ag-salvar', disabled: true, onclick: async () => { save.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { avisar('Permissões salvas.'); mostrar('agentes'); } else dirty(); } }, tr('Salvar permissões…'));
      function dirty() { save.disabled = JSON.stringify([...esp].sort()) === JSON.stringify([...s.configuracao.especializacoes].sort()) && JSON.stringify(pol) === JSON.stringify(s.configuracao.politicas); }
      return h('details', { class: 'v36a-secao-extra', open: true }, h('summary', {}, tr('Políticas do projeto · confirmação nativa para salvar')),
        h('div', { id: 'ag-especializacoes', class: 'v36a-esps' }, s.especializacoes.map(x => h('label', { class: 'v36a-check' }, h('input', { type: 'checkbox', 'data-esp': x.id, checked: esp.has(x.id), onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); dirty(); } }), h('span', {}, x.rotulo)))),
        policyTable(pol, dirty), h('div', { class: 'v36a-salvar' }, save));
    }
    function policyTable(pol, change, caps) {
      return h('div', { class: 'v36a-matriz', id: 'ag-matriz', role: 'table', 'aria-label': tr('Permissões') },
        s.matriz.filter(c => !caps || caps.includes(c.id)).map(c => h('div', { class: 'v36a-cap', role: 'row', 'data-cap': c.id },
          h('div', { class: 'v36a-cap-info', role: 'cell' }, h('strong', {}, c.rotulo), h('small', {}, c.motivo)),
          h('div', { role: 'cell' }, selo(c.estado)),
          h('div', { role: 'cell' }, c.editavel.length ? h('select', { 'data-pol': c.id, 'aria-label': c.rotulo, onchange: ev => { pol[c.id] = ev.target.value; change(); } }, c.editavel.map(v => h('option', { value: v, selected: (pol[c.id] ?? c.editavel[0]) === v }, v))) : h('span', { class: 'v36a-pessoa' }, tr('Somente pessoa'))))));
    }
    const secao = (titulo, texto, ...campos) => h('section', { class: 'v36a-form-secao' }, h('div', { class: 'v36a-form-rotulo' }, h('h3', {}, tr(titulo)), h('p', {}, tr(texto))), h('div', { class: 'v36a-campos' }, ...campos));
    function detail(x, isNew = false) {
      const pol = { ...s.configuracao.politicas }, esp = new Set(s.configuracao.especializacoes);
      const name = h('input', { id: 'v36-agent-name', value: x.nome, maxlength: 100, required: true, readonly: !x.preview, placeholder: tr('Ex.: Agente de regressão') });
      const desc = h('textarea', { id: 'v36-agent-description', rows: 3, maxlength: 4000, placeholder: tr('Quando o Prumo deve sugerir este agente') }, x.descricao || '');
      const goal = h('textarea', { id: 'v36-agent-goal', rows: 3, maxlength: 4000, required: true, placeholder: tr('Ex.: revisar a cobertura de um ticket autorizado') }, x.objetivo || '');
      const instructions = h('textarea', { id: 'v36-agent-instructions', rows: 6, maxlength: 4000, required: true, placeholder: tr('Responsabilidades, regras de decisão, restrições e formato esperado') }, x.instrucoes || '');
      const enabled = h('input', { type: 'checkbox', id: 'v36-agent-enabled', checked: esp.has(x.id), onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); sync(); } });
      const form = h('form', { class: 'v36-agent-form v36a-form', id: 'v36-agent-form' });
      const cancel = h('button', { type: 'button', id: 'v36-agent-cancel', 'aria-label': tr('Descartar alterações'), title: tr('Descartar alterações'), disabled: true, onclick: () => reset() }, '×');
      const save = h('button', { type: 'submit', id: 'v36-agent-save', 'aria-label': tr('Confirmar alterações'), title: tr('Confirmar alterações'), disabled: true }, '✓');
      const read = () => ({ version: 1, id: x.id, nome: name.value, descricao: desc.value, objetivo: goal.value, instrucoes: instructions.value });
      const baseline = JSON.stringify(read());
      function changed() { return x.preview ? JSON.stringify(read()) !== baseline : JSON.stringify(pol) !== JSON.stringify(s.configuracao.politicas) || esp.has(x.id) !== habilitada(x.id); }
      function sync() { cancel.disabled = save.disabled = !changed(); rodape.classList.toggle('alterado', changed()); }
      function reset() { if (x.preview) { name.value = x.nome; desc.value = x.descricao || ''; goal.value = x.objetivo || ''; instructions.value = x.instrucoes || ''; } else { detail(x); return; } sync(); }
      form.addEventListener('input', sync);
      form.addEventListener('submit', async ev => { ev.preventDefault(); if (!changed()) return;
        if (x.preview) { let data; try { data = validateDraft(read()); } catch (err) { avisar(err.message, true); return; }
          const d = h('dialog', { class: 'v36-dialog v36a-confirmar', 'aria-label': tr('Confirmar salvamento da prévia') }, h('div', { class: 'v36a-olho' }, tr('CONFIRMAR ALTERAÇÕES')), h('h2', {}, tr('Salvar prévia local?')), note(data.nome + ' · ' + previewNotice), h('div', { class: 'v36a-confirmar-acoes' }, button(tr('Cancelar'), () => d.close()), button(tr('Salvar prévia'), () => { const next = [...drafts.filter(a => a.id !== x.id), data]; if (next.length > 50) { avisar('Limite de 50 prévias por projeto.', true); return; } if (saveDrafts(next)) { const antes = linhasInstrucao(x.instrucoes); registrarMudanca(x.id, [...(data.nome !== x.nome || data.descricao !== (x.descricao || '') ? ['Identidade'] : []), ...(data.objetivo !== (x.objetivo || '') ? ['Objetivo'] : []), ...linhasInstrucao(data.instrucoes).map((l, i) => antes.includes(l) ? null : tr('Instrução {n}', { n: i + 1 })).filter(Boolean)]); d.close(); list(); } }, { class: 'acao primaria' }))); document.body.append(d); d.addEventListener('close', () => d.remove(), { once: true }); d.showModal();
        } else { save.disabled = cancel.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { registrarMudanca(x.id, [...(esp.has(x.id) !== habilitada(x.id) ? ['Disponibilidade'] : []), ...s.matriz.filter(c => x.capacidades.includes(c.id) && (pol[c.id] ?? null) !== (s.configuracao.politicas[c.id] ?? null)).map(c => c.rotulo)]); avisar('Permissões salvas.'); mostrar('agentes'); } else sync(); }
      });
      const exportar = h('button', { type: 'button', class: 'v36a-quieto', onclick: () => { try { download('prumo-agente-' + x.id + '.json', JSON.stringify(x.preview ? validateDraft(read()) : { fonte: 'nucleo', especializacao: { id: x.id, rotulo: x.rotulo, skill: x.skill, capacidades: x.capacidades }, configuracao: s.configuracao }, null, 2)); } catch (err) { avisar('Exportação recusada: ' + err.message, true); } } }, tr('Exportar JSON'));
      const barra = h('div', { class: 'v36a-barra' }, h('button', { type: 'button', class: 'v36a-voltar', onclick: list }, '← ', tr('Agentes')), h('span', { class: 'v36a-fonte' }, x.preview ? tr('Prévia local · sem execução') : tr('Especialização do núcleo · políticas compartilhadas pelo projeto')), h('div', { class: 'v36a-barra-acoes' }));
      if (x.preview) { const file = h('input', { type: 'file', accept: '.json,application/json', id: 'v36-agent-import', class: 'v36-sr', onchange: async ev => { const f = ev.target.files[0]; if (!f) return; try { if (f.size > 32768) throw Error('Arquivo excede 32 KiB.'); const d = validateDraft(JSON.parse(await f.text())); name.value = d.nome; desc.value = d.descricao; goal.value = d.objetivo; instructions.value = d.instrucoes; sync(); avisar('Prévia importada. Revise e confirme antes de salvar.'); } catch (err) { avisar('Importação recusada: ' + err.message, true); } ev.target.value = ''; } });
        barra.lastChild.append(h('label', { class: 'v36a-quieto', title: tr('A importação só preenche o formulário; revise antes de salvar.') }, '↥ ', h('span', {}, tr('Importar prévia JSON')), file)); }
      barra.lastChild.append(exportar);
      const retrato = h('div', { class: 'v36a-retrato-robo' });
      const perfil = h('aside', { class: 'v36a-perfil' }, h('div', { class: 'v36a-perfil-retrato' }, retrato),
        h('div', { class: 'v36a-perfil-info' }, h('span', { class: 'v36a-olho' }, x.preview ? tr('PRÉVIA LOCAL') : tr('ESPECIALIZAÇÃO DO NÚCLEO')), h('h2', { 'data-i18n-ignore': '' }, x.nome || tr('Novo agente')),
          h('p', {}, x.preview ? tr('Prévia local · sem execução') : h('span', {}, x.skill, ' · ', ...resumoCaps(x).filter(Boolean).slice(0, 1))),
          h('button', { type: 'button', class: 'v36a-cerebro-btn', id: 'v36-brain-open', 'aria-label': tr('Abrir cérebro do agente'), title: tr('Explorar as conexões configuradas deste agente'), onclick: () => brain(x) }, iconeCerebro())));
      perfil.style.setProperty('--face-color', palette[x.index % 8]); neural(perfil, { pontos: 46, escuro: true });
      form.append(h('div', { class: 'v36a-form-topo' }, h('span', {}, isNew ? tr('Criar prévia de agente') : tr('Configuração do agente')), h('span', {}, tr('* Obrigatório'))));
      if (x.preview) form.append(note(previewNotice),
        secao('Identidade', 'Como o agente aparece na lista e como é identificado.', field(tr('Nome *'), name), field(tr('Descrição'), desc)),
        secao('Objetivo e instruções', 'O que fazer, como agir e o que caracteriza um resultado válido.', field(tr('Objetivo *'), goal), field(tr('Instruções *'), instructions)));
      else form.append(
        secao('Identidade', 'Especialização fixa do núcleo; nome e skill não são editáveis.', field(tr('Nome *'), name), field(tr('Skill configurada'), h('input', { value: x.skill, readonly: true }))),
        secao('Disponibilidade', 'Habilitar não inicia sessão nem execução; o cliente de IA decide quando usar.', h('label', { class: 'v36a-interruptor' }, enabled, h('span', { class: 'v36a-trilho', 'aria-hidden': 'true' }), h('span', {}, tr('Especialização habilitada')))),
        secao('Permissões', 'As políticas são compartilhadas pelo projeto e aplicadas pelo servidor MCP.', policyTable(pol, sync, x.capacidades)));
      const rodape = h('div', { class: 'v36-form-actions v36a-commit' }, cancel, save); form.append(rodape);
      body.replaceChildren(barra, h('div', { class: 'v36a-detalhe' }, perfil, form)); figuraRobo(retrato, x, 'perfil', perfil);
    }
    // O que mudou em cada agente desde o último salvamento (só neste computador), para destacar no Cérebro.
    const chaveMudancas = 'prumo-v36-mudancas-' + e.id;
    const lerMudancas = () => { try { const m = JSON.parse(localStorage.getItem(chaveMudancas) || '{}'); return m && typeof m === 'object' && !Array.isArray(m) ? m : {}; } catch { return {}; } };
    function registrarMudanca(id, chaves) { if (!chaves.length) return; try { const m = lerMudancas(); m[id] = { em: new Date().toISOString(), chaves: chaves.slice(0, 60) }; localStorage.setItem(chaveMudancas, JSON.stringify(m)); } catch { /* armazenamento indisponível */ } }
    const linhasInstrucao = (texto) => String(texto || '').split(/\n+|(?<=[.;!?])\s+/).map(l => l.trim()).filter(Boolean).slice(0, 24);
    function figuraRobo(host, x, modo, area) { if (!PrumoRobos.criar(host, x.index, modo, area)) host.append(portrait(x.index, modo !== 'lista')); return host; }
    const bolinha = (cor) => { const i = h('i'); i.style.background = cor; return i; };
    async function brain(x) {
      const caps = capsDe(x); const mudou = lerMudancas()[x.id];
      const GRUPOS = { base: ['Identidade', '#7cb6ff'], cap: ['Capacidade', '#52e0c4'], ctx: ['Contexto do projeto', '#b38cff'], inst: ['Instrução', '#7ad7ff'], conv: ['Atendimento', '#ff9f6b'], saber: ['Conhecimento', '#52e0c4'] };
      const neuronios = x.preview
        ? [{ t: 'Identidade', r: x.nome, v: { nome: x.nome, descricao: x.descricao }, g: 'base' }, { t: 'Objetivo', r: x.objetivo, v: x.objetivo, g: 'base' }, ...linhasInstrucao(x.instrucoes).map((l, i) => ({ t: tr('Instrução {n}', { n: i + 1 }), r: l, v: l, g: 'inst' })), { t: 'Estado', r: tr('Prévia local · sem execução'), v: previewNotice, g: 'base' }]
        : [{ t: 'Identidade', r: x.rotulo, v: { id: x.id, rotulo: x.rotulo }, g: 'base' }, { t: 'Skill', r: x.skill, v: x.skill, g: 'base' }, { t: 'Disponibilidade', r: habilitada(x.id) ? tr('Habilitada no projeto') : tr('Desabilitada no projeto'), v: { habilitada: habilitada(x.id) }, g: 'base' }, ...caps.map(c => ({ t: c.rotulo, r: c.estado, v: c, g: 'cap' }))];
      // Contextos aprovados que a especialização pode ler (capacidade de contexto permitida no projeto).
      const ctxCap = caps.find(c => c.id === 'consultar_contexto');
      if (!x.preview && ctxCap && ctxCap.estado === 'PERMITIDO' && estado.root) {
        const r = await chamar(() => api.contextosListar(estado.root, {})); if (estado.aba !== 'agentes') return;
        for (const c of (r?.contextos || []).filter(c => c.estado === 'APROVADO').slice(0, 40)) neuronios.push({ t: c.titulo, r: c.tipo, v: { id: c.id, titulo: c.titulo, tipo: c.tipo, estado: c.estado }, g: 'ctx' });
      }
      if (!x.preview) {
        const conhecimentos = await chamar(() => api.conhecimentoListar(e.id, { agente: x.id })); if (estado.aba !== 'agentes') return;
        for (const c of conhecimentos || []) neuronios.push({ t: c.titulo, r: c.estado + ' · ' + c.origem, v: c, g: 'saber' });
      }
      // Atendimentos recentes têm metadados; conversas antigas podem conter texto.
      if (!x.preview) { const conv = await chamar(() => api.conversasListar(e.id, x.id)); if (estado.aba !== 'agentes') return;
        for (const c of (conv || []).slice(0, 18)) neuronios.push({ t: c.semTexto ? 'Atendimento · ' + (c.avaliacao || 'Sem avaliação') : '“' + c.pergunta.slice(0, 38) + (c.pergunta.length > 38 ? '…”' : '”'), r: (c.modo === 'LOCAL' ? tr('local') : c.modo) + ' · ' + hora(c.em), v: { pergunta: c.pergunta, resposta: c.linhas, fontes: c.fontes.map((f) => f.rotulo), modo: c.modo, estilo: c.estilo, em: c.em }, g: 'conv' }); }
      const inspect = h('section', { class: 'v36-brain-inspect', 'aria-live': 'polite' }, note(tr('Cada ponto é um conhecimento configurado deste agente. Selecione um para consultar. Isso não representa memória aprendida automaticamente.')));
      const campo = h('div', { class: 'v36a-campo-neural' });
      const face = h('div', { class: 'v36-brain-face' }); const stage = h('div', { class: 'v36-stage v36-brain v36a-cerebro' });
      const n = neuronios.length, anel2 = n > 16;
      neuronios.forEach((nr, i) => {
        const externo = !anel2 || i % 2 === 0, k = anel2 ? Math.floor(i / 2) : i, total = anel2 ? Math.ceil(n / (externo ? 2 : 2)) : n;
        const a = -Math.PI / 2 + (k + (externo ? 0 : .5)) / Math.max(1, total) * Math.PI * 2, rx = externo ? 40 : 29, ry = externo ? 41 : 30;
        const lado = Math.cos(a) < 0 ? 'esq' : 'dir', cor = GRUPOS[nr.g][1], alterado = mudou?.chaves?.includes(nr.t);
        const b = h('button', { type: 'button', class: 'v36-neuron ' + lado + (alterado ? ' mudou' : ''), 'data-neuron': nr.t, 'data-cor': alterado ? '#ffc65a' : cor, 'aria-pressed': 'false', 'aria-label': nr.t + ': ' + String(nr.r || '') },
          h('span', { class: 'v36-neuron-ponto', 'aria-hidden': 'true' }), h('span', { class: 'v36-neuron-rotulo' }, h('strong', {}, nr.t), h('small', { 'data-i18n-ignore': '' }, String(nr.r || '—'))));
        b.style.left = (50 + Math.cos(a) * rx) + '%'; b.style.top = (50 + Math.sin(a) * ry) + '%'; b.style.setProperty('--cor', alterado ? '#ffc65a' : cor); b.style.setProperty('--atraso', (-i * .37) + 's');
        b.addEventListener('click', () => { campo.querySelectorAll('.v36-neuron').forEach(o => o.setAttribute('aria-pressed', String(o === b)));
          inspect.replaceChildren(h('div', { class: 'v36a-insp-grupo' }, bolinha(cor), tr(GRUPOS[nr.g][0]), alterado ? h('span', { class: 'v36a-insp-mudou' }, tr('Alterado em {quando}', { quando: hora(mudou.em) })) : null), h('h3', {}, nr.t), h('pre', {}, typeof nr.v === 'string' ? nr.v : JSON.stringify(nr.v, null, 2)));
          if (nr.g === 'saber') for (const [estado, rotulo] of [['APROVADO', 'Aprovar'], ['DESCARTADO', 'Descartar']]) if (nr.v.estado !== estado) inspect.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async () => { const resultado = await chamar(() => api.conhecimentoDecidir(nr.v.id, estado)); if (resultado) brain(x); } }, rotulo));
        });
        campo.append(b);
      });
      campo.prepend(face);
      const legenda = h('div', { class: 'v36a-legenda-neural' }, ...Object.entries(GRUPOS).filter(([g]) => neuronios.some(nr => nr.g === g)).map(([, [t, cor]]) => h('span', {}, bolinha(cor), tr(t))), mudou ? h('span', {}, bolinha('#ffc65a'), tr('Alterado no último salvamento')) : null);
      stage.append(h('div', { class: 'v36a-cerebro-topo' }, h('button', { type: 'button', class: 'v36a-voltar', onclick: () => detail(x) }, '← ', tr('Configuração')), h('strong', { 'data-i18n-ignore': '' }, x.nome), h('span', {}, tr('{n} conhecimentos', { n: neuronios.length }))), campo, h('div', { class: 'v36a-cerebro-rodape' }, inspect, legenda));
      stage.style.setProperty('--face-color', palette[x.index % 8]); neural(stage, { pontos: 110, escuro: true });
      body.replaceChildren(stage); figuraRobo(face, x, 'cerebro', campo);
    }
    // Painel de atividades (v41): canvas com janelas de terminal ligadas pelos registros locais, atualizado ao vivo.
    async function activity() {
      painelVivo?.parar();
      const quieto = async (fn) => { try { const r = await fn(); return r && r.ok ? r.data : null; } catch { return null; } };
      const host = h('div', { class: 'v36a-painel' });
      body.replaceChildren(h('div', { class: 'v36a-topo' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Painel de atividades')), h('p', {}, tr('Clientes, agentes e o worker trabalhando, em tempo real. Só aparecem ligações que os registros deste computador comprovam.')))), host);
      painelVivo = PrumoPainelAtividades.montar(host, {
        reduzido, ativo: () => activeTab === 'activity' && estado.aba === 'agentes' && estado.espaco?.id === e.id,
        carregar: async () => {
          const root = estado.root;
          const [hist, roster, execs] = await Promise.all([root ? quieto(() => api.historico(root, { limit: 1000 })) : null, quieto(() => api.assistenteAgentes(e.id)), quieto(() => api.execucoes({ espacoId: e.id, limite: 200 }))]);
          const agentes = roster?.agentes || [];
          const conversas = (await Promise.all(agentes.map((a) => quieto(() => api.conversasListar(e.id, a.id)).then((l) => (l || []).map((c) => ({ ...c, fontes: c.fontes.map(f => typeof f === 'string' ? f : f.rotulo), agenteNome: a.nome })))))).flat();
          if (!hist && !execs && !conversas.length) return null;
          const avisos = [!hist ? tr('Histórico do núcleo indisponível.') : null, hist && !hist.complete ? tr('Histórico parcial: registros inválidos excluídos.') : null, !execs ? tr('Execuções indisponíveis.') : null].filter(Boolean);
          return { atividades: hist?.activities || [], conversas, agentes, execucoes: execs?.execucoes || [], totalExecucoes: execs?.total, avisos };
        },
        abrirAtividade: activityDetails,
        abrirConversa: (c) => caixa((c.semTexto ? 'Atendimento · ' : 'Conversa · ') + (c.agenteNome || c.agente), [note(c.semTexto ? 'Registro local de metadados. A pergunta e a resposta não foram gravadas.' : tr('Gravada somente neste computador. Resposta {m}.', { m: c.modo === 'LOCAL' ? tr('local, sem modelo de IA') : c.modo })), h('pre', {}, JSON.stringify({ em: c.em, agente: c.agente, ...(c.semTexto ? { avaliacao: c.avaliacao } : { pergunta: c.pergunta, resposta: c.linhas }), fontes: c.fontes, modo: c.modo }, null, 2))]),
        abrirExecucao: (x) => caixa(tr('Execução {r}', { r: x.rotina }), [note(tr('Registro da fila do worker. Evidência e logs completos ficam em Execuções.')), h('pre', {}, JSON.stringify(x, null, 2)), button(tr('Abrir Execuções'), () => { document.querySelector('.v36-dialog[open]')?.close(); mostrar('execucoes'); })]),
        abrirTela: (aba) => mostrar(aba)
      });
    }
    list();
  };

  // ---------------- Ajustes: Sistema (tema, idioma, cor) e Assistente (nome, estilo, voz, IA externa) ----------------
