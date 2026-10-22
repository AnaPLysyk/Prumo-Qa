/** Lista agentes, abre detalhes e edita permissoes. */
  function detalhesAtividade(a) { caixa(tr('Detalhes da atividade'), [note(tr('Origem observada no núcleo; identidade do cliente é declarada.')), h('pre', {}, JSON.stringify(a, null, 2))]); }
  /** Número entre 0 e 1 para os efeitos visuais (meteoros); vem do gerador do navegador, não de Math.random. */
  const acaso = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const activityDetails = detalhesAtividade;

  // ---------------- Agentes: especializações oficiais e agentes pessoais com ferramentas de consulta local ----------------
  function readDrafts(id) { try { const a = JSON.parse(localStorage.getItem('prumo-v36-drafts-' + id) || '[]'); if (!Array.isArray(a) || a.length > 50) throw Error('Lista inválida'); return a.map(validateDraft); } catch { avisar('Prévias locais inválidas: não puderam ser carregadas.', true); return []; } }
  function validateDraft(a) {
    if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).some(k => !['version', 'id', 'nome', 'descricao', 'objetivo', 'instrucoes', 'ferramenta'].includes(k)) || a.version !== 1 || typeof a.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(a.id)) throw Error('Formato de prévia inválido.');
    for (const k of ['nome', 'descricao', 'objetivo', 'instrucoes']) if (typeof a[k] !== 'string' || a[k].length > (k === 'nome' ? 100 : 4000)) throw Error('Campo inválido: ' + k);
    if (!a.nome.trim() || !a.objetivo.trim() || !a.instrucoes.trim()) throw Error('Nome, objetivo e instruções são obrigatórios.');
    if (a.ferramenta && !['projeto', 'agenda', 'execucoes', 'tickets'].includes(a.ferramenta)) throw Error('Ferramenta indisponível.');
    return { version: 1, id: a.id, nome: a.nome.trim(), descricao: a.descricao, objetivo: a.objetivo.trim(), instrucoes: a.instrucoes.trim(), ferramenta: a.ferramenta || 'projeto' };
  }
  /**
   * Agentes criados pela pessoa (2.17): ficam no núcleo, com dono; só o dono vê e edita, e os públicos as outras contas veem só para leitura.
   * As prévias antigas guardadas nesta janela (até a 2.16, visíveis a todas as contas) passam a ser privadas de quem abrir a tela primeiro.
   */
  async function carregarPessoais(id) {
    let antigas = []; try { antigas = localStorage.getItem('prumo-v36-drafts-' + id) ? readDrafts(id) : []; } catch { antigas = []; }
    if (antigas.length) { const r = await api.agentesPessoaisImportar(id, antigas.map(({ id: i, nome, descricao, objetivo, instrucoes }) => ({ id: i, nome, descricao, objetivo, instrucoes }))); if (r.ok) { try { localStorage.removeItem('prumo-v36-drafts-' + id); } catch { /* sem armazenamento */ } } }
    const r = await api.agentesPessoais(id);
    if (!r.ok || !Array.isArray(r.data)) throw Error('Não foi possível consultar os agentes pessoais.');
    return r.data.map((a) => ({ version: 1, ...a }));
  }
  const visibilidade = (x) => (x.meu === false ? tr('Público de {dono} · só leitura', { dono: x.dono || tr('outra conta') }) : x.publico ? tr('Seu · público') : tr('Seu · só você vê'));
  const iconeCerebro = () => sv('svg', { class: 'v36-icone', viewBox: '0 0 24 24', width: 26, height: 26, 'aria-hidden': 'true' }, sv('path', { d: 'M12 18V5a3 3 0 0 0-5.7-1.3A4.5 4.5 0 0 0 4 10.5 4.4 4.4 0 0 0 5 17.5 3.5 3.5 0 0 0 12 18Z' }), sv('path', { d: 'M12 18V5a3 3 0 0 1 5.7-1.3A4.5 4.5 0 0 1 20 10.5a4.4 4.4 0 0 1-1 7A3.5 3.5 0 0 1 12 18Z' }), sv('path', { d: 'M8 9a3 3 0 0 1-3 3m3 2a3 3 0 0 0 3 3m5-8a3 3 0 0 0 3 3m-3 2a3 3 0 0 1-3 3' }));
  const iconeBusca = () => sv('svg', { class: 'v36-icone', viewBox: '0 0 24 24', width: 16, height: 16, 'aria-hidden': 'true' }, sv('circle', { cx: 10.5, cy: 10.5, r: 6.5 }), sv('path', { d: 'm15.5 15.5 4.5 4.5' }));
  function iconeCliente(cliente) {
    const caixa = h('span', { class: 'v36a-cliente-icone ' + cliente });
    const marca = cliente === 'claude'
      ? sv('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...Array.from({ length: 12 }, (_, i) => sv('path', { d: 'M32 32 L' + (32 + Math.cos(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1) + ' ' + (32 + Math.sin(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1), stroke: '#d97757', 'stroke-width': 6.5, 'stroke-linecap': 'round' })))
      : sv('svg', { viewBox: '0 0 64 64', 'aria-hidden': 'true' }, ...Array.from({ length: 6 }, (_, i) => sv('rect', { x: 26, y: 9, width: 12, height: 30, rx: 6, fill: 'none', stroke: 'currentColor', 'stroke-width': 3.4, transform: 'rotate(' + i * 60 + ' 32 32)' })));
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
      if (!parado) { if (!meteoro && t > proximo) meteoro = { x: acaso() * W * .8 + W * .2, y: acaso() * H * .4, ini: t }; if (meteoro) { const k = (t - meteoro.ini) / 900; if (k > 1) { meteoro = null; proximo = t + 7000 + acaso() * 9000; } else { const x = meteoro.x - k * 260, y = meteoro.y + k * 120, g = ctx.createLinearGradient(x, y, x + 90, y - 42); const mc = claro ? '40,90,180' : '220,235,255'; g.addColorStop(0, `rgba(${mc},${.85 * (1 - k)})`); g.addColorStop(1, `rgba(${mc},0)`); ctx.strokeStyle = g; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 90, y - 42); ctx.stroke(); } } }
      if (!parado) requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
  }
  abas.agentes = async el => {
    el.classList.add('v36a'); espaco(el); el.append(h('h1', { class: 'v36-sr' }, 'Agentes'));
    // A tela nunca fica vazia: sem projeto, ou se o estado do projeto falhar, o Orchestrator local e o caminho para Projetos e Conexões continuam à mão.
    function disponivel(motivo, tentar = false) {
      const orbe = h('span', { class: 'v36a-orbe' }, h('img', { src: asset('robo-original.png'), alt: '' })); PrumoOrbitas.anexar(orbe);
      const orq = h('button', { type: 'button', class: 'v36a-astro v36a-astro-orq', role: 'listitem', id: 'v36-orquestrador-sempre', 'aria-label': tr('Conversar com o Prumo Orchestrator'), onclick: () => flutuante?.abrir() },
        h('span', { class: 'v36a-astro-figura' }, orbe), h('span', { class: 'v36a-astro-nome' }, 'Prumo Orchestrator'), h('span', { class: 'v36a-astro-sub' }, tr('Assistente local no Prumo')),
        h('span', { class: 'v36a-astro-estado' }, h('i', { class: 'ok' }), h('span', {}, tr('Sem modelo de IA'))));
      el.append(h('div', { class: 'v36a-constelacao', role: 'list' }, orq), h('div', { class: 'v36a-sem' }, note(motivo)),
        h('div', { class: 'v36a-acoes' }, button(tr('Escolher projeto'), () => void mostrar('projetos'), { id: 'v36-agentes-projetos' }), button(tr('Abrir Conexões'), () => void abrirPainelDeConexoes(estado.espaco), { id: 'v36-agentes-conexoes' }),
          tentar ? button(tr('Tentar novamente'), () => void mostrar('agentes'), { id: 'v36-agentes-recarregar' }) : null));
    }
    const e = estado.espaco; if (!e) {
      disponivel(tr('Selecione um projeto para consultar as especializações e configurar permissões. Claude Code, Codex, Qase e Jira se conectam em Projetos.'));
      // Pasta vinculada sem projeto selecionado: o diagnóstico e a configuração do MCP continuam aqui.
      if (estado.root) { const legacy = h('div'); await mostrarConfiguracaoMcp(legacy); legacy.querySelector('h1')?.remove(); el.append(legacy); }
      return;
    }
    const s = await chamar(() => api.agentesEstado(e.id)); if (!s) { disponivel(tr('Não foi possível ler os agentes deste projeto agora. O Orchestrator local segue disponível; tente de novo em instantes.'), true); return; }
    let drafts;
    try { drafts = await carregarPessoais(e.id); }
    catch { disponivel(tr('Não foi possível consultar os agentes pessoais deste projeto. Nenhum agente foi alterado.'), true); return; }
    let activeTab = 'agents', painelVivo = null;
    const body = h('div', { id: 'v36-agents-body', class: 'v36a-corpo' });
    const tabs = h('div', { class: 'v36a-abas', role: 'group', 'aria-label': tr('Áreas de agentes') },
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'agents', 'aria-pressed': 'true', onclick: () => showTab('agents') }, tr('Agentes')),
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'policies', 'aria-pressed': 'false', onclick: () => showTab('policies') }, tr('Políticas do projeto')),
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'activity', 'aria-pressed': 'false', onclick: () => showTab('activity') }, tr('Painel de atividades')));
    el.append(tabs, body);
    const habilitada = (id) => s.configuracao.especializacoes.includes(id);
    const capsDe = (x) => s.matriz.filter(c => x.capacidades?.includes(c.id));
    function showTab(tab) {
      activeTab = tab;
      if (tab !== 'activity') painelVivo?.parar();
      tabs.querySelectorAll('[data-agent-tab]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.agentTab === tab)));
      if (tab === 'agents') void list();
      else if (tab === 'policies') policies();
      else void activity();
    }
    function resumoCaps(x) { const c = capsDe(x); const auth = c.filter(k => k.estado === 'EXIGE_AUTORIZACAO').length, bloq = c.filter(k => k.estado === 'BLOQUEADO').length;
      return [h('strong', {}, tr('{n} capacidades', { n: c.length })), auth ? h('small', {}, tr('{n} exige autorização', { n: auth })) : null, bloq ? h('small', { class: 'v36a-bloq' }, tr('{n} bloqueada(s)', { n: bloq })) : null]; }
    function list() {
      definirDetalheDaTrilha();
      const search = h('input', { type: 'search', 'aria-label': tr('Buscar agente'), placeholder: tr('Localizar agente'), oninput: render, autocomplete: 'off' });
      const lista = h('div', { class: 'v36a-constelacao', id: 'v36-agent-list', role: 'list' }); const conta = h('span', { class: 'v36a-conta' });
      const novo = h('button', { type: 'button', class: 'v36a-primario', id: 'v36-agent-new', onclick: () => detail({ version: 1, id: 'pessoal-' + crypto.randomUUID(), nome: '', descricao: '', objetivo: '', instrucoes: '', ferramenta: 'projeto', publico: false, meu: true, preview: true, index: drafts.length + s.especializacoes.length }, true) }, '+ ', tr('Novo agente pessoal'));
      const orbe = h('span', { class: 'v36a-orbe' }, h('img', { src: asset('robo-original.png'), alt: '' })); PrumoOrbitas.anexar(orbe);
      const orq = h('button', { type: 'button', class: 'v36a-astro v36a-astro-orq', role: 'listitem', 'aria-label': tr('Conversar com o Prumo Orchestrator'), onclick: () => flutuante?.abrir() },
        h('span', { class: 'v36a-astro-figura' }, orbe),
        h('span', { class: 'v36a-astro-nome' }, 'Prumo Orchestrator'), h('span', { class: 'v36a-astro-sub' }, tr('Assistente local no Prumo')),
        h('span', { class: 'v36a-astro-estado' }, h('i', { class: 'ok' }), h('span', {}, tr('Sem modelo de IA'))));
      const clientesEl = []; let clientes = [];
      if (estado.root) void chamar(() => api.conexoes(estado.root)).then((r) => { if (!r || !lista.isConnected) return; clientes = r; render(); });
      function astroCliente(c) {
        const nome = c.client === 'claude' ? 'Claude Code' : c.client === 'codex' ? 'Codex' : c.client;
        const usado = c.lastObserved ? tr('Última chamada: {quando}', { quando: hora(c.lastObserved.at) }) : tr('Nenhuma chamada observada');
        return h('button', { type: 'button', class: 'v36a-astro v36a-astro-cliente', role: 'listitem', 'data-cliente': c.client, 'aria-label': tr('Cliente MCP {nome}', { nome }), onclick: () => { showTab('policies'); const d = document.getElementById('v36-clients'); if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } },
          h('span', { class: 'v36a-astro-figura' }, iconeCliente(c.client)), h('span', { class: 'v36a-astro-nome' }, nome), h('span', { class: 'v36a-astro-sub' }, tr('Cliente conectado por MCP')),
          h('span', { class: 'v36a-astro-estado' }, h('i', { class: c.state === 'UTILIZADO' || c.state === 'VALIDADO' ? 'ok' : c.state === 'ERRO' ? 'erro' : 'off' }), h('span', {}, selo(c.state))), h('span', { class: 'v36a-astro-sub' }, usado));
      }
      function render() {
        const q = search.value.trim().toLowerCase();
        const items = [...s.especializacoes.map((x, i) => ({ ...x, nome: s.preferencias?.[x.id]?.apelido || x.rotulo, index: Number.isInteger(x.robo) ? x.robo : i })), ...drafts.map((x, i) => ({ ...x, index: i + s.especializacoes.length, preview: true }))].filter(x => (x.nome + ' ' + (x.skill || '')).toLowerCase().includes(q));
        conta.textContent = String(items.length);
        lista.replaceChildren(...(!q || 'prumo orchestrator'.includes(q) ? [orq] : []), ...clientes.filter(c => !q || c.client.includes(q)).map(astroCliente), ...items.map((x, k) => {
          const ligado = x.preview ? null : habilitada(x.id); const caps = x.preview ? [] : capsDe(x);
          const astro = h('button', { type: 'button', class: 'v36a-astro', role: 'listitem', 'data-agent': x.id, title: tr('Configurar agente'), onclick: () => detail(x) });
          astro.style.setProperty('--face-color', x.id === 'ui-ux' ? '#9e92ff' : palette[x.index % 8]); astro.style.setProperty('--atraso', (-k * 1.3) + 's');
          astro.append(figuraRobo(h('span', { class: 'v36a-astro-figura' }), x, 'lista', astro),
            h('span', { class: 'v36a-astro-nome', 'data-i18n-ignore': '' }, x.nome), h('span', { class: 'v36a-astro-sub' }, x.preview ? visibilidade(x) : ([x.profissao, x.especialidade].filter(Boolean).map(parte => tr(parte)).join(' — ') || x.skill)),
            h('span', { class: 'v36a-astro-estado' }, h('i', { class: x.preview ? '' : ligado ? 'ok' : 'off' }), h('span', {}, x.preview ? tr(x.meu === false ? 'Compartilhado · somente leitura' : 'Consulta local disponível') : ligado ? tr('Habilitada no projeto') : tr('Desabilitada no projeto')),
              x.preview ? null : h('span', { class: 'v36a-astro-caps' }, ' · ', tr('{n} capacidades', { n: caps.length }))));
          return astro; }));
        if (!lista.children.length) lista.append(h('div', { class: 'v36a-vazio' }, tr('Nenhum agente para esta busca.')));
      }
      body.replaceChildren(
        h('div', { class: 'v36a-topo' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Agentes'), ' ', conta, DS.info(['Especializações oficiais e agentes pessoais com consultas locais verificáveis.', 'Os agentes oficiais respeitam as políticas do projeto. Os pessoais consultam dados locais somente quando acionados; os robôs são apenas a identidade visual.'], { id: 'v36a-sobre' }))),
          h('div', { class: 'v36a-acoes' }, h('label', { class: 'v36a-busca' }, iconeBusca(), search), h('button', { type: 'button', class: 'v36a-quieto', id: 'v36-agentes-integracoes', title: tr('Claude Code, Codex, Qase e Jira'), onclick: () => void abrirPainelDeConexoes(estado.espaco) }, tr('Integrações')), novo)),
        lista);
      render();
    }
    // Políticas são uma área própria, não um rodapé escondido abaixo dos robôs.
    function policies() {
      const clientContent = h('div', { id: 'v36-client-panel' }); let loaded = false;
      const clients = h('details', { class: 'v36a-secao-extra', id: 'v36-clients', ontoggle: async ev => {
        if (!ev.currentTarget.open || loaded) return;
        loaded = true; await mostrarConfiguracaoMcp(clientContent);
        clientContent.querySelector('h1')?.remove();
      } }, h('summary', {}, tr('Clientes MCP · diagnóstico e configuração')), clientContent);
      body.replaceChildren(
        h('header', { class: 'v36a-politicas-cabecalho' },
          h('h2', {}, tr('Políticas do projeto')),
          h('p', {}, tr('Gerencie especializações e permissões do projeto. As operações restritas continuam exigindo uma pessoa.'))),
        legacyPolicies(),
        h('section', { class: 'v36a-politicas-mcp', 'aria-label': tr('Clientes MCP') }, clients));
    }
    // Configuração editável pelo Admin; usuários comuns consultam sem poder alterar.
    function legacyPolicies() {
      const esp = new Set(s.configuracao.especializacoes), pol = { ...s.configuracao.politicas };
      const podeAdministrar = !!window.PrumoConta?.pode?.('administracao');
      const contagem = h('span', { class: 'v36a-politicas-contagem', role: 'status', 'aria-live': 'polite' });
      const save = h('button', { type: 'button', class: 'v36a-primario', id: 'ag-salvar', disabled: true, onclick: async () => { save.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { avisar('Permissões salvas.'); void mostrar('agentes'); } else dirty(); } }, tr('Salvar permissões…'));
      function dirty() {
        contagem.textContent = tr('{n} de {total} habilitadas', { n: esp.size, total: s.especializacoes.length });
        save.disabled = JSON.stringify([...esp].sort((a, b) => String(a).localeCompare(String(b)))) === JSON.stringify([...s.configuracao.especializacoes].sort((a, b) => String(a).localeCompare(String(b)))) && JSON.stringify(pol) === JSON.stringify(s.configuracao.politicas);
      }
      const selecionadas = h('fieldset', { class: 'v36a-politicas-especializacoes' },
        h('legend', {}, tr('Especializações habilitadas')),
        h('p', { class: 'v36a-politicas-intro' }, tr('Escolha quais especialistas podem atuar neste projeto.')),
        h('div', { id: 'ag-especializacoes', class: 'v36a-esps' }, s.especializacoes.map(x => h('label', { class: 'v36a-check' }, h('input', { type: 'checkbox', 'data-esp': x.id, checked: esp.has(x.id), disabled: !podeAdministrar, onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); dirty(); } }), h('span', {}, x.rotulo)))),
        contagem);
      const editaveis = s.matriz.filter(c => c.editavel.length).map(c => c.id);
      const reservadas = s.matriz.filter(c => !c.editavel.length).map(c => c.id);
      const secao = (titulo, descricao, ids, travada = false) => h('section', { class: 'v36a-politicas-grupo' + (travada ? ' v36a-politicas-restritas' : ''), 'aria-label': tr(titulo) },
        h('div', { class: 'v36a-politicas-grupo-cab' }, h('h3', {}, tr(titulo)), h('p', {}, tr(descricao))),
        policyTable(pol, dirty, ids, !podeAdministrar));
      dirty();
      return h('section', { class: 'v36a-politicas', id: 'v36-agent-policies', 'aria-label': tr('Permissões e especializações') },
        h('div', { class: 'v36a-politicas-conteudo' },
          selecionadas,
          secao('Permissões dos agentes', 'Defina o que os especialistas podem fazer neste projeto.', editaveis),
          secao('Ações reservadas à pessoa', 'Estas operações exigem decisão humana e não podem ser liberadas para agentes.', reservadas, true),
          podeAdministrar ? h('div', { class: 'v36a-salvar' }, h('span', { class: 'v36a-politicas-rodape-texto' }, tr('Salvar exige confirmação nativa.')), save) : h('p', { class: 'suave' }, tr('Somente o Admin altera as políticas gerais.'))));
    }
    function policyTable(pol, change, caps, somenteLeitura = false) {
      const nomes = { PERMITIDO: 'Permitido', BLOQUEADO: 'Bloqueado', EXIGE_AUTORIZACAO: 'Exige autorização', SOMENTE_PESSOA: 'Somente pessoa' };
      return h('div', { class: 'v36a-matriz', id: caps ? null : 'ag-matriz', role: 'list', 'aria-label': tr('Permissões') },
        s.matriz.filter(c => !caps || caps.includes(c.id)).map(c => {
          const atual = pol[c.id] ?? c.editavel[0];
          const diferente = c.editavel.length && c.estado !== atual;
          return h('div', { class: 'v36a-cap', role: 'listitem', 'data-cap': c.id },
            h('div', { class: 'v36a-cap-info' },
              h('strong', {}, tr(c.rotulo)),
              c.id === 'executar_testes' ? h('small', { class: 'v36a-cap-alerta' }, tr('Cada execução exige autorização humana.')) : null,
              h('details', { class: 'v36a-cap-detalhes' },
                h('summary', {}, tr('Detalhes')),
                h('p', {}, tr(c.motivo)))),
            h('div', { class: 'v36a-cap-controle' },
              diferente ? h('small', { class: 'v36a-cap-estado' }, tr('Estado atual: ') + tr(nomes[c.estado] || c.estado)) : null,
              c.editavel.length
                ? h('select', { disabled: somenteLeitura, 'data-pol': c.id, 'aria-label': tr('Permissão: ') + tr(c.rotulo), onchange: ev => { pol[c.id] = ev.target.value; change(); } },
                    c.editavel.map(v => h('option', { value: v, selected: atual === v }, tr(nomes[v] || v))))
                : h('span', { class: 'v36a-pessoa' }, tr('Somente pessoa'))));
        }));
    }
    const secao = (titulo, texto, ...campos) => h('section', { class: 'v36a-form-secao', 'aria-label': tr(titulo) + '. ' + tr(texto) }, h('div', { class: 'v36a-form-rotulo' }, h('h3', { title: tr(texto) }, tr(titulo))), h('div', { class: 'v36a-campos' }, ...campos));
    // Skills do agente (banco skills.db): só trechos APROVADOS vão para a IA externa; importado ou sugerido por IA espera a pessoa.
    function secaoSkills(x) {
      const lista = h('div', { class: 'v36a-skills', id: 'v36-skills-lista', 'aria-live': 'polite' }, note(tr('Carregando trechos da Skill…')));
      const titulo = h('input', { id: 'v36-skill-titulo', maxlength: 120, placeholder: tr('Ex.: Padrão de contrato da equipe') });
      const texto = h('textarea', { id: 'v36-skill-texto', rows: 4, maxlength: 4000, placeholder: tr('Instrução que a equipe quer que este agente siga') });
      const fonte = h('input', { id: 'v36-skill-fonte', maxlength: 300, placeholder: tr('Endereço do repositório de origem (opcional)') });
      const origemDe = (t) => t.origem === 'IMPORTADO' ? tr('Importado de {f} · {l}', { f: t.fonte, l: t.licenca }) : t.origem === 'IA' ? tr('Sugerido por IA') : t.origem === 'PESSOA' ? tr('Da equipe') : tr('Prumo');
      function item(t) {
        const acoes = [['APROVADO', 'Aprovar'], ['DESCARTADO', 'Descartar']].filter(([st]) => st !== t.estado)
          .map(([st, rot]) => button(tr(rot), async () => { if (await chamar(() => api.skillsDecidir(t.id, st))) void carregar(); }, { 'data-skill-acao': st }));
        return h('article', { class: 'v36a-skill', 'data-skill': t.id }, h('strong', {}, t.titulo), h('small', {}, origemDe(t) + ' · ' + tr(t.estado)),
          h('p', {}, t.texto.length > 280 ? t.texto.slice(0, 280) + '…' : t.texto), h('div', { class: 'v36a-skill-acoes' }, ...acoes));
      }
      async function carregar() {
        const trechos = await chamar(() => api.skillsListar({ especializacao: x.id })); if (!trechos) return;
        const conta = (st) => trechos.filter((t) => t.estado === st).length;
        const rascunhos = trechos.filter((t) => t.estado === 'RASCUNHO'), daEquipe = trechos.filter((t) => t.origem !== 'PRUMO' && t.estado === 'APROVADO');
        lista.replaceChildren(h('p', { class: 'v36a-skills-resumo', id: 'v36-skills-resumo' }, tr('{a} aprovados · {r} rascunhos · {d} descartados', { a: conta('APROVADO'), r: conta('RASCUNHO'), d: conta('DESCARTADO') })),
          ...(rascunhos.length ? [h('h4', {}, tr('Aguardando sua decisão')), ...rascunhos.map(item)] : []),
          ...(daEquipe.length ? [h('h4', {}, tr('Da equipe e importados')), ...daEquipe.map(item)] : []));
      }
      const acrescentar = button(tr('Acrescentar trecho'), async () => {
        if (titulo.value.trim().length < 2 || texto.value.trim().length < 2) { avisar(tr('Preencha título e texto do trecho.'), true); return; }
        const r = await chamar(() => api.skillsCriar({ especializacao: x.id, titulo: titulo.value, texto: texto.value })); if (!r) return;
        avisar(r.duplicado ? tr('Esse trecho já existia.') : tr('Trecho acrescentado e aprovado.')); titulo.value = ''; texto.value = ''; void carregar();
      }, { id: 'v36-skill-acrescentar' });
      const importar = button(tr('Importar pasta de Skill…'), async () => {
        const r = await chamar(() => api.skillsImportar(x.id, fonte.value.trim() || undefined)); if (!r || r.canceled) return;
        avisar(tr('{n} trecho(s) importado(s) como rascunho ({l}). Aprove cada um antes de ir para a IA.', { n: r.importados, l: r.licenca })); void carregar();
      }, { id: 'v36-skill-importar' });
      void carregar();
      return secao('Skills', 'Só os trechos aprovados vão para a IA externa, escolhidos pela pergunta (até 8 KB). A importação aceita apenas licença aberta e entra como rascunho.',
        lista, field(tr('Título do trecho'), titulo), field(tr('Texto'), texto), h('div', { class: 'v36a-skill-acoes' }, acrescentar),
        field(tr('Origem da pasta importada'), fonte), h('div', { class: 'v36a-skill-acoes' }, importar));
    }
    function detail(x, isNew = false) {
      definirDetalheDaTrilha([[x.nome || tr('Novo agente')]]);
      const pol = { ...s.configuracao.politicas }, esp = new Set(s.configuracao.especializacoes);
      const alheio = x.preview && x.meu === false;
      const podeAdministrar = !!window.PrumoConta?.pode?.('administracao');
      const pref = s.preferencias?.[x.id] || { apelido: '', orientacao: '' };
      const apelido = h('input', { id: 'v36-agent-apelido', maxlength: 80, value: pref.apelido || '', placeholder: tr('Nome para esta conta (opcional)') });
      const orientacao = h('textarea', { id: 'v36-agent-orientacao', rows: 3, maxlength: 1000, placeholder: tr('Como este agente deve ajudar você') }, pref.orientacao || '');
      const ajusteOriginal = JSON.stringify(pref);
      const ajusteAlterado = () => JSON.stringify({ apelido: apelido.value.trim(), orientacao: orientacao.value.trim() }) !== ajusteOriginal;
      const name = h('input', { id: 'v36-agent-name', value: x.nome, maxlength: 100, required: true, readonly: !x.preview || alheio, placeholder: tr('Ex.: Agente de regressão') });
      const publico = h('input', { type: 'checkbox', id: 'v36-agent-publico', checked: !!x.publico, disabled: alheio, onchange: () => sync() });
      const ferramentas = [
        ['projeto', 'Resumo do projeto'],
        ['agenda', 'Agenda de rotinas do Prumo'],
        ['execucoes', 'Runs de teste locais'],
        ['tickets', 'Propostas locais']
      ];
      const ferramenta = h('select', { id: 'v36-agent-ferramenta', disabled: alheio, 'aria-label': tr('Consulta do agente') },
        ferramentas.map(([valor, rotulo]) => h('option', { value: valor, selected: (x.ferramenta || 'projeto') === valor }, tr(rotulo))));
      const desc = h('textarea', { id: 'v36-agent-description', rows: 3, maxlength: 4000, placeholder: tr('Quando o Prumo deve sugerir este agente') }, x.descricao || '');
      const goal = h('textarea', { id: 'v36-agent-goal', rows: 3, maxlength: 4000, required: true, placeholder: tr('Ex.: revisar a cobertura de um ticket autorizado') }, x.objetivo || '');
      const instructions = h('textarea', { id: 'v36-agent-instructions', rows: 6, maxlength: 4000, required: true, placeholder: tr('Responsabilidades, regras de decisão, restrições e formato esperado') }, x.instrucoes || '');
      const enabled = h('input', { type: 'checkbox', id: 'v36-agent-enabled', checked: esp.has(x.id), disabled: !podeAdministrar, onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); sync(); } });
      const form = h('form', { class: 'v36-agent-form v36a-form', id: 'v36-agent-form' });
      const cancel = h('button', { type: 'button', id: 'v36-agent-cancel', 'aria-label': tr('Descartar alterações'), title: tr('Descartar alterações'), disabled: true, onclick: () => reset() }, '×');
      const save = h('button', { type: 'submit', form: 'v36-agent-form', id: 'v36-agent-save', 'aria-label': tr('Confirmar alterações'), title: tr('Confirmar alterações'), disabled: true }, '✓');
      if (alheio) for (const campo of [desc, goal, instructions]) campo.readOnly = true;
      const read = () => ({ version: 1, id: x.id, nome: name.value, descricao: desc.value, objetivo: goal.value, instrucoes: instructions.value, ferramenta: ferramenta.value });
      const baseline = JSON.stringify(read());
      function changed() { return x.preview ? !alheio && (JSON.stringify(read()) !== baseline || publico.checked !== !!x.publico) : ajusteAlterado() || podeAdministrar && (JSON.stringify(pol) !== JSON.stringify(s.configuracao.politicas) || esp.has(x.id) !== habilitada(x.id)); }
      function sync() { cancel.disabled = save.disabled = !changed(); rodape.classList.toggle('alterado', changed()); }
      function reset() { if (x.preview) { name.value = x.nome; desc.value = x.descricao || ''; goal.value = x.objetivo || ''; instructions.value = x.instrucoes || ''; ferramenta.value = x.ferramenta || 'projeto'; publico.checked = !!x.publico; } else { detail(x); return; } sync(); }
      form.addEventListener('input', sync);
      form.addEventListener('submit', async ev => { ev.preventDefault(); if (!changed()) return;
        if (x.preview) { let data; try { data = validateDraft(read()); } catch (err) { avisar(err.message, true); return; }
          const aviso = publico.checked ? tr('Público: as outras contas deste computador veem este agente, só para leitura. Só você edita.') : tr('Privado: só você vê este agente.');
          const d = h('dialog', { class: 'v36-dialog v36a-confirmar', 'aria-label': tr('Confirmar salvamento do agente') }, h('div', { class: 'v36a-olho' }, tr('CONFIRMAR ALTERAÇÕES')), h('h2', {}, tr('Salvar agente?')), note(data.nome + ' · ' + aviso), h('div', { class: 'v36a-confirmar-acoes' }, button(tr('Cancelar'), () => d.close()), button(tr('Salvar agente'), async () => {
            const r = await chamar(() => api.agentePessoalSalvar(e.id, { id: data.id, nome: data.nome, descricao: data.descricao, objetivo: data.objetivo, instrucoes: data.instrucoes, ferramenta: data.ferramenta, publico: publico.checked })); if (!r) return;
            const antes = linhasInstrucao(x.instrucoes); registrarMudanca(r.id, [...(data.nome !== x.nome || data.descricao !== (x.descricao || '') ? ['Identidade'] : []), ...(data.objetivo !== (x.objetivo || '') ? ['Objetivo'] : []), ...(publico.checked !== !!x.publico ? ['Visibilidade'] : []), ...linhasInstrucao(data.instrucoes).map((l, i) => antes.includes(l) ? null : tr('Instrução {n}', { n: i + 1 })).filter(Boolean)]);
            drafts = await carregarPessoais(e.id); d.close(); void list();
          }, { class: 'acao primaria', id: 'v36-agent-confirmar' }))); document.body.append(d); d.addEventListener('close', () => d.remove(), { once: true }); d.showModal();
        } else {
          save.disabled = cancel.disabled = true;
          if (ajusteAlterado()) {
            const pessoal = await chamar(() => api.agentePreferenciasSalvar(x.id, { apelido: apelido.value.trim(), orientacao: orientacao.value.trim() }));
            if (!pessoal) { sync(); return; }
          }
          if (podeAdministrar && (JSON.stringify(pol) !== JSON.stringify(s.configuracao.politicas) || esp.has(x.id) !== habilitada(x.id))) {
            const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol));
            if (!r || r.canceled) { sync(); return; }
          }
          avisar('Configuração do agente salva para esta conta.'); void mostrar('agentes');
        }
      });
      const exportar = h('button', { type: 'button', class: 'v36a-quieto', onclick: () => { try { void download('prumo-agente-' + x.id + '.json', JSON.stringify(x.preview ? validateDraft(read()) : { fonte: 'nucleo', especializacao: { id: x.id, rotulo: x.rotulo, skill: x.skill, capacidades: x.capacidades }, configuracao: s.configuracao }, null, 2)); } catch (err) { avisar('Exportação recusada: ' + err.message, true); } } }, tr('Exportar JSON'));
      const barra = h('div', { class: 'v36a-barra' }, h('div', { class: 'v36a-barra-acoes' }));
      if (x.preview) { const file = h('input', { type: 'file', accept: '.json,application/json', id: 'v36-agent-import', class: 'v36-sr', onchange: async ev => { const f = ev.target.files[0]; if (!f) return; try { if (f.size > 32768) throw Error('Arquivo excede 32 KiB.'); const d = validateDraft(JSON.parse(await f.text())); name.value = d.nome; desc.value = d.descricao; goal.value = d.objetivo; instructions.value = d.instrucoes; ferramenta.value = d.ferramenta; sync(); avisar('Configuração importada. Revise e confirme antes de salvar.'); } catch (err) { avisar('Importação recusada: ' + err.message, true); } ev.target.value = ''; } });
        barra.lastChild.append(h('label', { class: 'v36a-quieto', title: tr('A importação só preenche o formulário; revise antes de salvar.') }, '↥ ', h('span', {}, tr('Importar agente JSON')), file)); }
      if (x.preview && !alheio && !isNew && drafts.some((a) => a.id === x.id)) barra.lastChild.append(h('button', { type: 'button', class: 'v36a-quieto', id: 'v36-agent-excluir', onclick: async () => {
        if (!confirm(tr('Excluir o agente {nome}? Isso não pode ser desfeito.', { nome: x.nome }))) return;
        const r = await chamar(() => api.agentePessoalExcluir(x.id)); if (!r) return; avisar(tr('Agente excluído.')); drafts = await carregarPessoais(e.id); void list();
      } }, tr('Excluir agente')));
      barra.lastChild.append(exportar);
      const retrato = h('div', { class: 'v36a-retrato-robo' });
      const perfil = h('aside', { class: 'v36a-perfil' }, h('div', { class: 'v36a-perfil-retrato' }, retrato),
        h('div', { class: 'v36a-perfil-info' }, h('span', { class: 'v36a-olho' }, x.preview ? (alheio ? tr('AGENTE COMPARTILHADO') : tr('SEU AGENTE PESSOAL')) : tr('ESPECIALIZAÇÃO DO NÚCLEO')), h('h2', { 'data-i18n-ignore': '' }, x.nome || tr('Novo agente')),
          h('p', {}, x.preview ? visibilidade(x) : h('span', {}, x.skill, ' · ', ...resumoCaps(x).filter(Boolean).slice(0, 1))),
          h('button', { type: 'button', class: 'v36a-cerebro-btn', id: 'v36-brain-open', 'aria-label': tr('Abrir cérebro do agente'), title: tr('Explorar as conexões configuradas deste agente'), onclick: () => brain(x) }, iconeCerebro())));
      perfil.style.setProperty('--face-color', x.id === 'ui-ux' ? '#9e92ff' : palette[x.index % 8]); neural(perfil, { pontos: 46 });
      if (x.preview) form.append(h('div', { class: 'v36a-form-topo' }, h('span', {}, isNew ? tr('Criar agente pessoal') : tr('Configuração do agente')), h('span', {}, tr('* Obrigatório'))));
      if (x.preview) form.append(note(alheio ? tr('Agente público de {dono}: você pode consultar, mas só quem criou edita.', { dono: x.dono || tr('outra conta') }) : tr('Agentes pessoais fazem consultas reais aos dados locais. Não executam comandos nem acessam agendas ou serviços externos.')),
        secao('Consulta permitida', 'Escolha uma fonte de dados local. O agente consulta apenas o projeto da sua conta e não modifica informações.', field(tr('Ferramenta de consulta'), ferramenta)),
        secao('Identidade', 'Como o agente aparece na lista e como é identificado.', field(tr('Nome *'), name), field(tr('Descrição'), desc)),
        secao('Quem vê', 'Privado: só você vê. Público: as outras contas deste computador veem, só para leitura. A Administração não vê os privados.', h('label', { class: 'v36a-publico', for: 'v36-agent-publico' }, publico, h('span', {}, tr('Público para as outras contas')))),
        secao('Objetivo e instruções', 'Descreva a finalidade. A consulta usa somente a ferramenta escolhida; as instruções não alteram a execução nem concedem novos acessos.', field(tr('Objetivo *'), goal), field(tr('Instruções *'), instructions)));
      if (x.preview && !isNew && !alheio && drafts.some(a => a.id === x.id)) {
        const resultado = h('div', { class: 'v36a-agente-resultado', id: 'v36-agent-resultado', role: 'status', 'aria-live': 'polite' }, tr('Nenhuma consulta executada nesta visita.'));
        const consultar = button(tr('Executar consulta local'), async () => {
          consultar.disabled = true; resultado.replaceChildren(DS.carregando());
          const r = await api.agentePessoalConsultar(e.id, x.id);
          consultar.disabled = false;
          if (!r?.ok) { resultado.replaceChildren(note(tr('A consulta falhou; nenhum resultado foi inventado.'))); avisar(r?.error || tr('Falha na consulta do agente.'), true); return; }
          resultado.replaceChildren(h('strong', {}, tr('Fonte local: ') + r.data.origem), ...r.data.linhas.map(l => h('p', {}, l)));
        }, { id: 'v36-agent-consultar' });
        form.append(secao('Resultado verificado', 'Consulta somente leitura, executada ao clicar. Origem indicada no resultado.', consultar, resultado));
      }
      else if (x.preview && alheio) form.append(note(tr('Compartilhado para leitura: somente o dono pode executar a consulta.')));
      else if (!x.preview) form.append(
        secao('Para a minha conta', 'O apelido e a orientação são seus. Não alteram o agente oficial nem as permissões.', field(tr('Apelido (opcional)'), apelido), field(tr('Minha orientação'), orientacao)),
        secao('Identidade', 'Especialização oficial do núcleo; o Admin altera o perfil geral em Administração.', field(tr('Nome *'), name), field(tr('Skill configurada'), h('input', { value: x.skill, readonly: true }))),
        secao('Disponibilidade', 'Habilitar não inicia sessão nem execução; o cliente de IA decide quando usar.', h('label', { class: 'v36a-interruptor' }, enabled, h('span', { class: 'v36a-trilho', 'aria-hidden': 'true' }), h('span', {}, tr('Especialização habilitada')))),
        secao('Permissões', 'As políticas são compartilhadas pelo projeto e aplicadas pelo servidor MCP.', policyTable(pol, sync, x.capacidades, !podeAdministrar)),
        podeAdministrar ? secaoSkills(x) : note(tr('Regras oficiais e Skills: somente o Admin pode editar.')));
      const rodape = h('div', { class: 'v36-form-actions v36a-commit' }, cancel, save); barra.lastChild.append(rodape);
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
      definirDetalheDaTrilha([[x.nome, () => detail(x)], ['Cérebro']]);
      const caps = capsDe(x); const mudou = lerMudancas()[x.id];
      const tema = document.documentElement.dataset.tema, claroTema = tema === 'claro' || (tema !== 'escuro' && matchMedia('(prefers-color-scheme: light)').matches);
      // Tons claros no escuro e tons fortes no claro, para ponto, linha e legenda terem contraste nos dois temas.
      const C = claroTema ? { base: '#2f6fd6', cap: '#0f8a72', ctx: '#7a4fd6', inst: '#1d86b8', conv: '#c25a17', saber: '#0f8a72', skill: '#9a6a00', voc: '#b8336f' }
        : { base: '#7cb6ff', cap: '#52e0c4', ctx: '#b38cff', inst: '#7ad7ff', conv: '#ff9f6b', saber: '#52e0c4', skill: '#f2c977', voc: '#ff9fc8' };
      const corMudou = claroTema ? '#b07800' : '#ffc65a';
      const GRUPOS = { base: ['Identidade', C.base], voc: ['Vocabulário', C.voc], cap: ['Capacidade', C.cap], ctx: ['Contexto do projeto', C.ctx], inst: ['Instrução', C.inst], saber: ['Conhecimento', C.saber], skill: ['Trecho de Skill', C.skill], conv: ['Atendimento', C.conv] };
      const neuronios = x.preview
        ? [{ id: 'identidade', t: 'Identidade', r: x.nome, v: { nome: x.nome, descricao: x.descricao }, g: 'base' }, { id: 'objetivo', t: 'Objetivo', r: x.objetivo, v: x.objetivo, g: 'base' }, ...linhasInstrucao(x.instrucoes).map((l, i) => ({ id: 'inst:' + i, t: tr('Instrução {n}', { n: i + 1 }), r: l, v: l, g: 'inst' })), { id: 'estado', t: 'Estado', r: tr('Prévia local · sem execução'), v: previewNotice, g: 'base' }]
        : [{ id: 'identidade', t: 'Identidade', r: x.rotulo, v: { id: x.id, rotulo: x.rotulo }, g: 'base' }, { id: 'skill', t: 'Skill', r: x.skill, v: x.skill, g: 'base' }, { id: 'disponibilidade', t: 'Disponibilidade', r: habilitada(x.id) ? tr('Habilitada no projeto') : tr('Desabilitada no projeto'), v: { habilitada: habilitada(x.id) }, g: 'base' }, ...caps.map(c => ({ id: 'cap:' + c.id, t: c.rotulo, r: c.estado, v: c, g: 'cap' }))];
      // Contextos aprovados que a especialização pode ler (capacidade de contexto permitida no projeto).
      const ctxCap = caps.find(c => c.id === 'consultar_contexto');
      if (!x.preview && ctxCap && ctxCap.estado === 'PERMITIDO' && estado.root) {
        const r = await chamar(() => api.contextosListar(estado.root, {})); if (estado.aba !== 'agentes') return;
        for (const c of (r?.contextos || []).filter(c => c.estado === 'APROVADO').slice(0, 40)) neuronios.push({ id: 'ctx:' + c.id, t: c.titulo, r: c.tipo, v: { id: c.id, titulo: c.titulo, tipo: c.tipo, estado: c.estado }, g: 'ctx' });
      }
      if (!x.preview) {
        // Tudo o que o agente sabe: vocabulário de roteamento, termos aprendidos, conhecimentos, todos os trechos de Skill e atendimentos.
        const [roster, vocab, conhecimentos, trechos, conv] = await Promise.all([chamar(() => api.assistenteAgentes(e.id)), chamar(() => api.conhecimentoVocabulario(x.id)), chamar(() => api.conhecimentoListar(e.id, { agente: x.id })), chamar(() => api.skillsListar({ especializacao: x.id, estados: ['RASCUNHO', 'APROVADO'] })), chamar(() => api.conversasListar(e.id, x.id))]);
        if (estado.aba !== 'agentes') return;
        const palavras = roster?.agentes?.find((a) => a.id === x.id)?.palavras || [];
        if (palavras.length) neuronios.push({ id: 'palavras', t: tr('Palavras de roteamento'), r: tr('{n} palavras', { n: palavras.length }), v: palavras.join(', '), g: 'voc' });
        if (vocab?.length) neuronios.push({ id: 'aprendidos', t: tr('Termos aprendidos'), r: tr('{n} termos', { n: vocab.length }), v: vocab, g: 'voc' });
        for (const c of conhecimentos || []) neuronios.push({ id: c.id, t: c.titulo, r: c.estado + ' · ' + c.origem, v: c, g: 'saber' });
        for (const t of (trechos || []).slice(0, 40)) neuronios.push({ id: t.id, t: t.titulo, r: (t.origem === 'PRUMO' ? 'Prumo' : t.origem) + ' · ' + t.estado, v: t, g: 'skill' });
        // Atendimentos recentes têm metadados; conversas antigas podem conter texto.
        for (const c of (conv || []).slice(0, 12)) neuronios.push({ id: 'conv:' + c.id, t: c.semTexto ? 'Atendimento · ' + (c.avaliacao || 'Sem avaliação') : '“' + c.pergunta.slice(0, 38) + (c.pergunta.length > 38 ? '…”' : '”'), r: (c.modo === 'LOCAL' ? tr('local') : c.modo) + ' · ' + hora(c.em), v: { pergunta: c.pergunta, resposta: c.linhas, fontes: c.fontes.map((f) => f.rotulo), modo: c.modo, estilo: c.estilo, em: c.em }, g: 'conv' });
      }
      const inspect = h('section', { class: 'v36-brain-inspect', 'aria-live': 'polite' });
      const campo = h('div', { class: 'v36a-campo-neural' }); const anel = h('div', { class: 'v36a-anel' });
      const face = h('div', { class: 'v36-brain-face' }); const stage = h('div', { class: 'v36-stage v36-brain v36a-cerebro' });
      // Os grupos ficam juntos no anel (setores), na ordem da legenda, para a ramificação ser legível.
      const ordem = Object.keys(GRUPOS); neuronios.sort((a, b) => ordem.indexOf(a.g) - ordem.indexOf(b.g));
      const n = neuronios.length, anel2 = n > 16;
      neuronios.forEach((nr, i) => {
        const externo = !anel2 || i % 2 === 0, k = anel2 ? Math.floor(i / 2) : i, total = anel2 ? Math.ceil(n / 2) : n;
        const a = -Math.PI / 2 + (k + (externo ? 0 : .5)) / Math.max(1, total) * Math.PI * 2, rx = externo ? 48 : 36, ry = externo ? 47 : 36;
        const lado = Math.cos(a) < 0 ? 'esq' : 'dir', cor = GRUPOS[nr.g][1], alterado = mudou?.chaves?.includes(nr.t);
        const b = h('button', { type: 'button', class: 'v36-neuron ' + lado + (alterado ? ' mudou' : ''), 'data-neuron': nr.t, 'data-id': nr.id, 'data-cor': alterado ? corMudou : cor, 'aria-pressed': 'false', 'aria-label': nr.t + ': ' + String(nr.r || '') },
          h('span', { class: 'v36-neuron-ponto', 'aria-hidden': 'true' }), h('span', { class: 'v36-neuron-rotulo' }, h('strong', {}, nr.t), h('small', { 'data-i18n-ignore': '' }, String(nr.r || '—'))));
        b.style.left = (50 + Math.cos(a) * rx) + '%'; b.style.top = (50 + Math.sin(a) * ry) + '%'; b.style.setProperty('--cor', alterado ? corMudou : cor); b.style.setProperty('--atraso', (-i * .37) + 's');
        b.addEventListener('click', () => {
          const selecionado = b.getAttribute('aria-pressed') === 'true';
          anel.querySelectorAll('.v36-neuron').forEach(o => o.setAttribute('aria-pressed', String(!selecionado && o === b)));
          if (selecionado) { inspect.replaceChildren(); return; }
          inspect.replaceChildren(h('div', { class: 'v36a-insp-grupo' }, bolinha(cor), tr(GRUPOS[nr.g][0]), alterado ? h('span', { class: 'v36a-insp-mudou' }, tr('Alterado em {quando}', { quando: hora(mudou.em) })) : null), h('h3', {}, nr.t), h('pre', {}, typeof nr.v === 'string' ? nr.v : JSON.stringify(nr.v, null, 2)));
          if (nr.g === 'saber') for (const [estado, rotulo] of [['APROVADO', 'Aprovar'], ['DESCARTADO', 'Descartar']]) if (nr.v.estado !== estado) inspect.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async () => { const resultado = await chamar(() => api.conhecimentoDecidir(nr.v.id, estado)); if (resultado) void brain(x); } }, rotulo));
          if (nr.g === 'skill') for (const [estado, rotulo] of [['APROVADO', 'Aprovar'], ['DESCARTADO', 'Descartar']]) if (nr.v.estado !== estado) inspect.append(h('button', { type: 'button', class: 'v36c-fonte', onclick: async () => { const resultado = await chamar(() => api.skillsDecidir(nr.v.id, estado)); if (resultado) void brain(x); } }, rotulo));
        });
        anel.append(b);
      });
      campo.append(face, anel);
      // Clicar fora de um ponto recolhe sua etiqueta; o inspetor permanece disponível.
      stage.addEventListener('click', ev => {
        if (ev.target.closest('.v36-neuron, .v36a-sim-acesos')) return;
        anel.querySelectorAll('.v36-neuron[aria-pressed=true]').forEach(o => o.setAttribute('aria-pressed', 'false'));
      });
      const legenda = h('div', { class: 'v36a-legenda-neural' }, ...Object.entries(GRUPOS).filter(([g]) => neuronios.some(nr => nr.g === g)).map(([, [t, cor]]) => h('span', {}, bolinha(cor), tr(t))), mudou ? h('span', {}, bolinha(corMudou), tr('Alterado no último salvamento')) : null);
      // Simulador: mostra o caminho que o chat faria com a pergunta e acende os neurônios que ela usaria. Só leitura.
      const pergunta = h('input', { id: 'v36-brain-pergunta', type: 'text', maxlength: 500, autocomplete: 'off', placeholder: tr('Ex.: oi, quais testes de API falharam?') });
      const rastro = h('div', { class: 'v36a-sim-resultado', id: 'v36-brain-rastro', 'aria-live': 'polite' });
      function limpar() { campo.classList.remove('v36a-simulando'); anel.querySelectorAll('.v36-neuron').forEach((o) => o.classList.remove('aceso')); rastro.replaceChildren(); }
      async function simular(ev) {
        ev.preventDefault(); const q = pergunta.value.trim(); if (!q) { limpar(); return; }
        const r = await chamar(() => api.agentesRastrear(e.id, q, x.preview ? null : x.id)); if (!r || !stage.isConnected) return;
        const minha = r.rota.find((z) => z.agente === x.id), participa = !!r.foco && (r.foco.responderia || !!r.orquestracao?.includes(x.id));
        const acesos = new Set([...(r.foco?.skill.usados || []), ...(r.foco?.conhecimentos || []).map((c) => c.id), ...(participa ? ['identidade'] : []), ...(minha?.casou.length ? ['palavras'] : []), ...(minha?.aprendidos ? ['aprendidos'] : [])]);
        campo.classList.add('v36a-simulando'); anel.querySelectorAll('.v36-neuron').forEach((o) => o.classList.toggle('aceso', acesos.has(o.dataset.id)));
        const nomeAg = (id) => r.rota.find((z) => z.agente === id)?.nome || id;
        rastro.replaceChildren(
          h('p', { class: 'v36a-sim-quem' }, r.orquestracao ? tr('Orquestraria: ') : tr('Responderia: '), h('strong', { 'data-i18n-ignore': '' }, r.orquestracao ? r.orquestracao.map(nomeAg).join(' → ') : r.escolhido.nome),
            r.foco ? h('span', { class: participa ? 'ok' : '' }, participa ? tr(' · este agente participa') : tr(' · outro agente atende')) : null),
          r.rota.length ? h('ol', { class: 'v36a-sim-rota' }, r.rota.slice(0, 5).map((z) => h('li', { 'data-agente': z.agente, class: z.agente === x.id ? 'este' : '' }, h('span', { 'data-i18n-ignore': '' }, z.nome), h('b', {}, tr('{n} pts', { n: z.pontos })),
            h('small', { 'data-i18n-ignore': '' }, [...z.casou.map((c) => c.termo), ...(z.mencao ? [tr('menção')] : []), ...(z.aprendidos ? [tr('aprendido +{n}', { n: z.aprendidos })] : [])].join(', ')))))
            : note(tr('Nenhuma palavra conhecida: o Prumo Orchestrator atende por padrão.')),
          r.foco ? h('p', { class: 'v36a-sim-uso' }, tr('Se este agente responder: {s} trechos de Skill ({o} ficam de fora) e {c} conhecimentos aprovados. Os usados acendem no anel.', { s: r.foco.skill.usados.length, o: r.foco.skill.omitidos, c: r.foco.conhecimentos.length })) : null,
          acesos.size ? h('ul', { class: 'v36a-sim-acesos', 'aria-label': tr('Neurônios acesos') }, [...anel.querySelectorAll('.v36-neuron.aceso')].map((o) => h('li', {}, h('button', { type: 'button', onclick: () => o.click() }, bolinha(o.dataset.cor), h('span', { 'data-i18n-ignore': '' }, o.dataset.neuron))))) : null,
          h('p', { class: 'v36a-sim-termos' }, tr('Termos considerados: {t}', { t: r.termos.join(', ') || '—' })));
      }
      const simulador = h('form', { class: 'v36a-simulador', id: 'v36-brain-simulador', onsubmit: simular },
        h('label', { for: 'v36-brain-pergunta' }, tr('Testar uma pergunta'), DS.info('Mostra o caminho que o chat faria agora com esta pergunta. Não chama IA e não grava nada.')),
        h('div', { class: 'v36a-sim-linha' }, pergunta, h('button', { type: 'submit', class: 'v36a-primario' }, tr('Simular')), h('button', { type: 'button', class: 'v36a-quieto', onclick: () => { pergunta.value = ''; limpar(); pergunta.focus(); } }, tr('Limpar'))),
        rastro);
      stage.append(h('div', { class: 'v36a-cerebro-topo' }, DS.info('Cada ponto é um conhecimento configurado deste agente. Selecione um para consultar. Isso não representa memória aprendida automaticamente.'), h('span', {}, tr('{n} conhecimentos', { n: neuronios.length }))),
        h('div', { class: 'v36a-cerebro-corpo' }, campo, h('aside', { class: 'v36a-cerebro-lado', 'aria-label': tr('Testar e consultar o cérebro') }, simulador, inspect, legenda)));
      stage.style.setProperty('--face-color', x.id === 'ui-ux' ? '#9e92ff' : palette[x.index % 8]); neural(stage, { pontos: 110 });
      body.replaceChildren(stage); figuraRobo(face, x, 'cerebro', campo);
    }
    // Painel de atividades (v41): canvas com janelas de terminal ligadas pelos registros locais, atualizado ao vivo.
    // Orquestrações do chat: quem participou, em que ordem, quanto cada etapa levou, o que consultou e o que falhou (registro local, sem pergunta nem resposta).
    async function mostrarOrquestracoes(alvo, registros = null) {
      const nomeDe = (id) => s.especializacoes?.find?.((x) => x.id === id)?.rotulo || id;
      const ROTULO = { EXECUTANDO: 'Em análise', CONCLUIDA: 'Concluída', PARCIAL: 'Parcial', FALHOU: 'Falhou', SEM_DADOS: 'Sem dados' };
      const rotulo = (x, em) => tr(x === 'EXECUTANDO' && Date.now() - Date.parse(em) > 120000 ? 'Interrompida' : ROTULO[x] || x);
      const r = registros ? { orquestracoes: registros } : await chamarSemAviso(() => api.agentesOrquestracoes(e.id)); if (estado.aba !== 'agentes' || !alvo.isConnected) return;
      if (!r) { alvo.replaceChildren(note(tr('Orquestrações indisponíveis.'))); return 0; }
      const itens = r.orquestracoes.slice(0, 8);
      const titulo = h('h3', { class: 'v36a-orq-titulo' }, tr('Orquestrações recentes'), h('small', {}, tr('{n} registradas', { n: r.orquestracoes.length })));
      if (!itens.length) { alvo.replaceChildren(titulo, note(tr('Nenhuma ainda. Quando uma pergunta envolve duas ou mais especialidades, o orquestrador consulta cada uma e registra as etapas aqui.'))); return 0; }
      alvo.replaceChildren(titulo, h('ol', { class: 'v36a-orq-lista' }, itens.map((o) => h('li', { class: 'v36a-orq-item', 'data-estado': o.estado, 'data-orquestracao': o.id },
        h('button', { type: 'button', class: 'v36a-orq-abrir', onclick: () => caixa(tr('Orquestração · {quando}', { quando: hora(o.em) }), [note(tr('Registro local de metadados: agentes, ordem, tempos, fontes e falhas. A pergunta e as respostas não foram gravadas. As etapas são independentes.')), h('pre', {}, JSON.stringify(o, null, 2))]) },
          h('span', { class: 'v36a-orq-quando' }, hora(o.em)), h('strong', {}, rotulo(o.estado, o.em)), h('span', { class: 'v36a-orq-tempo' }, o.duracaoMs + ' ms')),
        h('ol', { class: 'v36a-orq-etapas' }, o.etapas.map((et) => h('li', { 'data-estado': et.estado }, h('span', { 'data-i18n-ignore': '' }, et.ordem + '. ' + nomeDe(et.agente)), ' · ', rotulo(et.estado), ' · ' + et.duracaoMs + ' ms', et.fontes.length ? h('small', {}, ' · ' + et.fontes.join(', ')) : null)))))));
      return itens.length;
    }
    async function activity() {
      painelVivo?.parar();
      const host = h('div', { class: 'v36a-painel' });
      // O diagnóstico é uma operação real de consulta e registra cada etapa no backend.
      // Não altera o código e não afirma que falhas foram corrigidas.
      const resultado = h('section', { class: 'v36a-diagnostico', id: 'v36-diagnostico', role: 'status', 'aria-live': 'polite' });
      const botaoDiagnostico = h('button', { type: 'button', class: 'v36a-primario', id: 'v36-diagnosticar-projeto', onclick: diagnosticar }, tr('Diagnosticar problemas'));
      const nomeAgente = id => s.especializacoes.find(a => a.id === id)?.rotulo || id;
      function verEtapas(registro, resposta) {
        const progresso = registro.estado === 'EXECUTANDO';
        const nomeEstado = { EXECUTANDO: 'Investigando', CONCLUIDA: 'Consultas concluídas', PARCIAL: 'Algumas consultas falharam', FALHOU: 'Sem evidências suficientes', SEM_DADOS: 'Sem dados' };
        const passos = registro.agentes.map((id, i) => {
          const etapa = registro.etapas.find(x => x.agente === id);
          const estado = etapa?.estado || (registro.emExecucao === id ? 'EXECUTANDO' : 'PENDENTE');
          const texto = { EXECUTANDO: 'Consultando', PENDENTE: 'Aguardando', CONCLUIDA: 'Consultado', SEM_DADOS: 'Sem dados', FALHOU: 'Falha na consulta' }[estado] || estado;
          return h('li', { class: 'v36a-diagnostico-passo', 'data-estado': estado },
            h('span', { class: 'v36a-diagnostico-ordem' }, String(i + 1)),
            h('strong', { 'data-i18n-ignore': '' }, nomeAgente(id)),
            h('span', { class: 'v36a-diagnostico-estado' }, tr(texto)),
            etapa?.fontes?.length ? h('small', {}, tr('Fontes: ') + etapa.fontes.join(', ')) : null,
            etapa?.erro ? h('small', {}, tr('Falha: ') + etapa.erro) : null);
        });
        resultado.replaceChildren(
          h('div', { class: 'v36a-diagnostico-cab' }, h('h3', {}, tr('Investigação do projeto')),
            h('span', { class: 'v36a-diagnostico-situacao', 'data-estado': registro.estado }, tr(nomeEstado[registro.estado] || registro.estado))),
          h('p', { class: 'suave' }, progresso
            ? tr('O Prumo está consultando os especialistas e registrando as etapas. Nenhum teste ou correção foi executado.')
            : tr('Consultas concluídas: resultados locais, não correções automáticas. Consulte as evidências antes de agir.')),
          h('ol', { class: 'v36a-diagnostico-passos' }, ...passos),
          resposta ? h('div', { class: 'v36a-diagnostico-achados' },
            h('h4', {}, tr('Achados e próximos passos')),
            ...resposta.linhas.filter(l => /Prioridade|Sem execuções|Rastreabilidade|falha|FAIL|lacuna|contexto aprovado/i.test(l)).slice(0, 2).map(l => h('p', {}, l)),
            h('details', { class: 'v36a-diagnostico-detalhes', ontoggle: () => painelVivo?.recalcular() },
              h('summary', {}, tr('Ver análise completa')),
              ...resposta.linhas.filter(l => l && !/^Consultei \d+ especialistas/.test(l)).slice(0, 14).map(l => h('p', {}, l))),
            h('div', { class: 'v36a-diagnostico-acoes' },
              button(tr('Ver fluxo dos agentes'), async () => { host.scrollIntoView({ behavior: reduzido() ? 'auto' : 'smooth', block: 'start' }); await painelVivo?.atualizar(); painelVivo?.focarInvestigacao(); }),
              button(tr('Ver execuções'), () => void mostrar('execucoes')),
              button(tr('Revisar testes'), () => void mostrar('testes')),
              button(tr('Conversar com o Orchestrator'), () => flutuante?.abrir()))
          ) : null);
      }
      async function diagnosticar() {
        botaoDiagnostico.disabled = true;
        resultado.replaceChildren(h('p', { class: 'suave' }, tr('Iniciando consulta dos especialistas do projeto…')));
        let intervalo;
        let ativo = true;
        let idVisto = null;
        const acompanhar = async () => {
          if (!ativo || !resultado.isConnected || activeTab !== 'activity') return;
          const dados = await chamarSemAviso(() => api.agentesOrquestracoes(e.id));
          if (!dados?.orquestracoes?.length || !ativo) return;
          // Apenas registros surgidos após este clique: não confundir com análises antigas.
          const atual = dados.orquestracoes.find(o => o.id === idVisto ||
            (o.em >= inicio && o.modo === 'LOCAL'));
          if (!atual) return;
          idVisto = atual.id; verEtapas(atual);
          await mostrarOrquestracoes(orq);
        };
        const inicio = new Date().toISOString();
        try {
          intervalo = setInterval(() => void acompanhar(), 850);
          const resposta = await chamar(() => api.assistenteConversar(e.id,
            'Faça um diagnóstico da qualidade do projeto QA: examine falhas, execução de testes, requisitos, riscos e evidências. Não execute nem modifique nada.',
            { agente: null, provedor: 'local', primeira: false, historico: [] }));
          if (!resposta) {
            resultado.replaceChildren(note(tr('Não foi possível executar a consulta. Nenhuma correção foi realizada.')));
            return;
          }
          if (resposta.orquestracao) {
            idVisto = resposta.orquestracao.id;
            verEtapas(resposta.orquestracao, resposta);
            await mostrarOrquestracoes(orq);
            await painelVivo?.atualizar();
          } else resultado.replaceChildren(note(tr('Nenhum diagnóstico multiagente foi iniciado. Verifique as especializações habilitadas e a política do projeto.')));
        } catch {
          resultado.replaceChildren(note(tr('A investigação falhou. Verifique o estado do projeto e tente novamente.')));
        } finally {
          ativo = false; clearInterval(intervalo); botaoDiagnostico.disabled = false;
        }
      }
      const orq = h('section', { class: 'v36a-orq', id: 'v36-orquestracoes', 'aria-label': tr('Orquestrações recentes') }, note(tr('Carregando orquestrações…')));
      body.replaceChildren(h('div', { class: 'v36a-topo v36a-topo-painel' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Painel de atividades')), h('p', { class: 'v36a-painel-intro' }, tr('Acompanhe evidências e análises reais do projeto. Conversas não significam correções executadas.'))), botaoDiagnostico), resultado, host);
      painelVivo = PrumoPainelAtividades.montar(host, {
        lateral: { rotulo: tr('Orquestrações'), conteudo: orq },
        reduzido, ativo: () => activeTab === 'activity' && estado.aba === 'agentes' && estado.espaco?.id === e.id,
        aoAtualizar: dados => { void mostrarOrquestracoes(orq, dados.orquestracoes); },
        carregar: async () => {
          const root = estado.root;
          const [hist, roster, execs, diagnosticos] = await Promise.all([root ? chamarSemAviso(() => api.historico(root, { limit: 1000 })) : null, chamarSemAviso(() => api.assistenteAgentes(e.id)), chamarSemAviso(() => api.execucoes({ espacoId: e.id, limite: 200 })), chamarSemAviso(() => api.agentesOrquestracoes(e.id))]);
          const agentes = roster?.agentes || [];
          // Conversas recentes de cada agente: só metadados e o texto que a própria pessoa deixou gravado neste computador.
          const conversas = (await Promise.all(agentes.map(a => chamarSemAviso(() => api.conversasListar(e.id, a.id)).then(l => (l || []).map(c => ({ ...c, fontes: (c.fontes || []).map(f => typeof f === 'string' ? f : f.rotulo), agenteNome: a.nome })))))).flat();
          const avisos = [!hist ? tr('Histórico do núcleo indisponível.') : null, hist && !hist.complete ? tr('Histórico parcial: registros inválidos excluídos.') : null, !execs ? tr('Execuções indisponíveis.') : null].filter(Boolean);
          return { atividades: hist?.activities || [], conversas, agentes, execucoes: execs?.execucoes || [], orquestracoes: diagnosticos?.orquestracoes || [], totalExecucoes: execs?.total, avisos };
        },
        abrirAtividade: activityDetails,
        abrirDiagnostico: ({ registro, etapa, agente }) => caixa(tr('Investigação: ') + agente, [
          note(tr('Execução observada. O Prumo não assume testes realizados nem correções que não constem do registro.')),
          h('div', { class: 'v36a-diagnostico-etapa-info' },
            h('p', {}, tr('Operação: diagnóstico local somente leitura')),
            h('p', {}, tr('Início: ') + (etapa?.inicio || registro.em)),
            h('p', {}, tr('Fim: ') + (etapa?.fim || tr('Em andamento'))),
            h('p', {}, tr('Estado: ') + (etapa?.estado || registro.estado)),
            h('p', {}, tr('Fontes: ') + (etapa?.fontes?.join(', ') || tr('Não registradas'))),
            h('p', {}, tr('Plataforma: consulta local (não é execução de teste de dispositivo)')),
            h('p', {}, tr('Dispositivo: não informado pelo executor')),
            h('p', {}, tr('Navegador: não informado pelo executor')),
            ...(etapa?.erro ? [h('p', {}, tr('Falha: ') + etapa.erro)] : []),
            ...((etapa?.fatos || []).slice(0, 12).map(f => h('p', {}, f))),
            button(tr('Abrir Logs'), () => { document.querySelector('.v36-dialog[open]')?.close(); void mostrar('logs'); }))]),
        // Clicar num agente do elenco: o fluxo dele em ordem de tempo, o que conversou e com quem se comunicou. Só registros reais deste computador.
        abrirAgente: (ag, d) => {
          const nomeDe = id => (d.agentes.find(x => x.id === id)?.nome) || id;
          const quando = iso => iso ? new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
          const eventos = [];
          for (const c of (d.conversas || []).filter(x => x.agente === ag.id)) eventos.push({ em: c.em, tipo: tr('Conversa'), nos: [
            h('p', { class: 'pa-fala' }, h('b', {}, tr('Pessoa › ')), c.pergunta || tr('Atendimento sem texto persistido')),
            h('p', { class: 'pa-fala' }, h('b', {}, nomeDe(ag.id) + ' › '), (c.linhas && c.linhas.join(' ')) || c.avaliacao || tr('Sem resposta gravada')),
            h('small', {}, [c.modo === 'LOCAL' ? tr('resposta local') : c.modo === 'MESA' ? tr('mesa de IAs') : c.modo, c.fontes?.length ? tr('fontes: {f}', { f: c.fontes.join(', ') }) : ''].filter(Boolean).join(' · '))] });
          for (const o of (d.orquestracoes || [])) {
            const et = o.etapas.find(x => x.agente === ag.id), outros = o.agentes.filter(id => id !== ag.id);
            if (!et && o.emExecucao !== ag.id) continue;
            eventos.push({ em: et?.inicio || o.em, tipo: tr('Investigação'), nos: [
              h('p', { class: 'pa-fala' }, h('b', {}, 'Prumo Orchestrator › '), tr('pediu a {a} que consultasse o projeto.', { a: nomeDe(ag.id) })),
              ...((et?.fatos || []).slice(0, 8).map(f => h('p', { class: 'pa-fala' }, h('b', {}, nomeDe(ag.id) + ' › '), f))),
              et?.erro ? h('p', { class: 'pa-fala' }, h('b', {}, nomeDe(ag.id) + ' › '), tr('Falha na consulta')) : null,
              h('small', {}, [et ? tr(et.estado) : tr('Em análise'), et?.fontes?.length ? tr('fontes: {f}', { f: et.fontes.join(', ') }) : '', outros.length ? tr('na mesma investigação: {a}', { a: outros.map(nomeDe).join(', ') }) : ''].filter(Boolean).join(' · '))] });
          }
          eventos.sort((a, b) => String(a.em).localeCompare(String(b.em)));
          const trabalhando = d.ativos?.idsDosAgentes?.includes(ag.id);
          caixa(tr('Agente: ') + (ag.id === 'orquestrador' ? tr('Guia do sistema') : ag.nome), [
            note(trabalhando ? tr('Trabalhando agora.') : tr('Livre: sem atividade em andamento. Abaixo, o que já aconteceu com este agente neste projeto.')),
            eventos.length
              ? h('ol', { class: 'pa-fluxo' }, eventos.map(e => h('li', {}, h('time', {}, quando(e.em)), h('em', {}, e.tipo), ...e.nos.filter(Boolean))))
              : note(tr('Ainda não há conversa nem investigação registrada para este agente. Pergunte a ele na tela Início ou rode um diagnóstico.')),
            button(tr('Abrir Logs'), () => { document.querySelector('.v36-dialog[open]')?.close(); void mostrar('logs'); })]);
        },
        abrirConversa: (c) => caixa((c.semTexto ? 'Atendimento · ' : 'Conversa · ') + (c.agenteNome || c.agente), [note(c.semTexto ? 'Registro local de metadados. A pergunta e a resposta não foram gravadas.' : tr('Gravada somente neste computador. Resposta {m}.', { m: c.modo === 'LOCAL' ? tr('local, sem modelo de IA') : c.modo })), h('pre', {}, JSON.stringify({ em: c.em, agente: c.agente, ...(c.semTexto ? { avaliacao: c.avaliacao } : { pergunta: c.pergunta, resposta: c.linhas }), fontes: c.fontes, modo: c.modo }, null, 2))]),
        abrirExecucao: (x) => caixa(tr('Execução {r}', { r: x.rotina }), [note(tr('Registro real do worker. Evidências e logs completos ficam em Testes › Runs.')),
          h('div', { class: 'v36a-diagnostico-etapa-info' },
            h('p', {}, tr('Estado: ') + (x.resultado?.status || x.estado)),
            h('p', {}, tr('Tipo: ') + (x.tipo || '—')),
            h('p', {}, tr('Ambiente: ') + (x.ambiente || tr('Não informado pelo executor'))),
            h('p', {}, tr('Dispositivo: não informado pelo executor')),
            h('p', {}, tr('Navegador: não informado pelo executor')),
            h('p', {}, tr('Início: ') + (x.inicio || x.iniciadoEm || '—')),
            h('p', {}, tr('Fim: ') + (x.termino || x.terminadoEm || tr('Em andamento')))),
          h('details', {}, h('summary', {}, tr('Dados do registro')), h('pre', {}, JSON.stringify(x, null, 2))),
          button(tr('Abrir Runs'), () => { document.querySelector('.v36-dialog[open]')?.close(); void mostrar('runs'); })]),
        abrirTela: (aba) => mostrar(aba)
      });
      mostrarOrquestracoes(orq).catch(() => avisar(tr('Não foi possível mostrar as orquestrações.')));
    }
    void list();
  };

  // ---------------- Ajustes: Sistema (tema, idioma, cor) e Assistente (nome, estilo, voz, IA externa) ----------------
