/** Lista agentes, abre detalhes e edita permissoes. */
  /** Número entre 0 e 1 para os efeitos visuais (meteoros); vem do gerador do navegador, não de Math.random. */
  const acaso = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const activityDetails = detalhesAtividade;

  // ---------------- Agentes: especializações fixas do núcleo; cadastros personalizados = prévias locais ----------------
  function readDrafts(id) { try { const a = JSON.parse(localStorage.getItem('prumo-v36-drafts-' + id) || '[]'); if (!Array.isArray(a) || a.length > 50) throw Error('Lista inválida'); return a.map(validateDraft); } catch { avisar('Prévias locais inválidas: não puderam ser carregadas.', true); return []; } }
  function validateDraft(a) {
    if (!a || typeof a !== 'object' || Array.isArray(a) || Object.keys(a).some(k => !['version', 'id', 'nome', 'descricao', 'objetivo', 'instrucoes'].includes(k)) || a.version !== 1 || typeof a.id !== 'string' || !/^[a-z0-9-]{1,80}$/.test(a.id)) throw Error('Formato de prévia inválido.');
    for (const k of ['nome', 'descricao', 'objetivo', 'instrucoes']) if (typeof a[k] !== 'string' || a[k].length > (k === 'nome' ? 100 : 4000)) throw Error('Campo inválido: ' + k);
    if (!a.nome.trim() || !a.objetivo.trim() || !a.instrucoes.trim()) throw Error('Nome, objetivo e instruções são obrigatórios.');
    return { version: 1, id: a.id, nome: a.nome.trim(), descricao: a.descricao, objetivo: a.objetivo.trim(), instrucoes: a.instrucoes.trim() };
  }
  /**
   * Agentes criados pela pessoa (2.17): ficam no núcleo, com dono; só o dono vê e edita, e os públicos as outras contas veem só para leitura.
   * As prévias antigas guardadas nesta janela (até a 2.16, visíveis a todas as contas) passam a ser privadas de quem abrir a tela primeiro.
   */
  async function carregarPessoais(id) {
    let antigas = []; try { antigas = localStorage.getItem('prumo-v36-drafts-' + id) ? readDrafts(id) : []; } catch { antigas = []; }
    if (antigas.length) { const r = await api.agentesPessoaisImportar(id, antigas.map(({ id: i, nome, descricao, objetivo, instrucoes }) => ({ id: i, nome, descricao, objetivo, instrucoes }))); if (r.ok) { try { localStorage.removeItem('prumo-v36-drafts-' + id); } catch { /* sem armazenamento */ } } }
    const r = await api.agentesPessoais(id); return r.ok ? r.data.map((a) => ({ version: 1, ...a })) : [];
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
    function disponivel(motivo) {
      const orbe = h('span', { class: 'v36a-orbe' }, h('img', { src: asset('robo-original.png'), alt: '' })); PrumoOrbitas.anexar(orbe);
      const orq = h('button', { type: 'button', class: 'v36a-astro v36a-astro-orq', role: 'listitem', id: 'v36-orquestrador-sempre', 'aria-label': tr('Conversar com o Prumo Orchestrator'), onclick: () => flutuante?.abrir() },
        h('span', { class: 'v36a-astro-figura' }, orbe), h('span', { class: 'v36a-astro-nome' }, 'Prumo Orchestrator'), h('span', { class: 'v36a-astro-sub' }, tr('Assistente local no Prumo')),
        h('span', { class: 'v36a-astro-estado' }, h('i', { class: 'ok' }), h('span', {}, tr('Sem modelo de IA'))));
      el.append(h('div', { class: 'v36a-constelacao', role: 'list' }, orq), h('div', { class: 'v36a-sem' }, note(motivo)),
        h('div', { class: 'v36a-acoes' }, button(tr('Escolher projeto'), () => void mostrar('projetos'), { id: 'v36-agentes-projetos' }), button(tr('Abrir Conexões'), () => void mostrar('conexoes'), { id: 'v36-agentes-conexoes' })));
    }
    const e = estado.espaco; if (!e) {
      disponivel(tr('Selecione um projeto para consultar as especializações e configurar permissões. Claude Code, Codex, Qase e Jira se conectam em Conexões.'));
      // Pasta vinculada sem projeto selecionado: o diagnóstico e a configuração do MCP continuam aqui.
      if (estado.root) { const legacy = h('div'); await mostrarConfiguracaoMcp(legacy); legacy.querySelector('h1')?.remove(); el.append(legacy); }
      return;
    }
    const s = await chamar(() => api.agentesEstado(e.id)); if (!s) { disponivel(tr('Não foi possível ler os agentes deste projeto agora. O Orchestrator local segue disponível; tente de novo em instantes.')); return; }
    let drafts = await carregarPessoais(e.id); let activeTab = 'agents', painelVivo = null;
    const body = h('div', { id: 'v36-agents-body', class: 'v36a-corpo' });
    const tabs = h('div', { class: 'v36a-abas', role: 'group', 'aria-label': tr('Áreas de agentes') },
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'agents', 'aria-pressed': 'true', onclick: () => showTab('agents') }, tr('Agentes')),
      h('button', { type: 'button', class: 'v36a-aba', 'data-agent-tab': 'activity', 'aria-pressed': 'false', onclick: () => showTab('activity') }, tr('Painel de atividades')));
    el.append(tabs, body);
    const habilitada = (id) => s.configuracao.especializacoes.includes(id);
    const capsDe = (x) => s.matriz.filter(c => x.capacidades?.includes(c.id));
    function showTab(tab) { activeTab = tab; if (tab !== 'activity') painelVivo?.parar(); tabs.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.agentTab === tab))); if (tab === 'agents') void list(); else void activity(); }
    function resumoCaps(x) { const c = capsDe(x); const auth = c.filter(k => k.estado === 'EXIGE_AUTORIZACAO').length, bloq = c.filter(k => k.estado === 'BLOQUEADO').length;
      return [h('strong', {}, tr('{n} capacidades', { n: c.length })), auth ? h('small', {}, tr('{n} exige autorização', { n: auth })) : null, bloq ? h('small', { class: 'v36a-bloq' }, tr('{n} bloqueada(s)', { n: bloq })) : null]; }
    function list() {
      const search = h('input', { type: 'search', 'aria-label': tr('Buscar agente'), placeholder: tr('Localizar agente'), oninput: render, autocomplete: 'off' });
      const lista = h('div', { class: 'v36a-constelacao', id: 'v36-agent-list', role: 'list' }); const conta = h('span', { class: 'v36a-conta' });
      const novo = h('button', { type: 'button', class: 'v36a-primario', id: 'v36-agent-new', onclick: () => detail({ version: 1, id: 'pessoal-' + crypto.randomUUID(), nome: '', descricao: '', objetivo: '', instrucoes: '', publico: false, meu: true, preview: true, index: drafts.length + 8 }, true) }, '+ ', tr('Nova prévia'));
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
            h('span', { class: 'v36a-astro-nome', 'data-i18n-ignore': '' }, x.nome), h('span', { class: 'v36a-astro-sub' }, x.preview ? visibilidade(x) : ([x.profissao, x.especialidade].filter(Boolean).map(parte => tr(parte)).join(' — ') || x.skill)),
            h('span', { class: 'v36a-astro-estado' }, h('i', { class: x.preview ? '' : ligado ? 'ok' : 'off' }), h('span', {}, x.preview ? tr('Prévia · sem execução') : ligado ? tr('Habilitada no projeto') : tr('Desabilitada no projeto')),
              x.preview ? null : h('span', { class: 'v36a-astro-caps' }, ' · ', tr('{n} capacidades', { n: caps.length }))));
          return astro; }));
        if (!lista.children.length) lista.append(h('div', { class: 'v36a-vazio' }, tr('Nenhum agente para esta busca.')));
      }
      const clientContent = h('div', { id: 'v36-client-panel' }); let loaded = false;
      const clients = h('details', { class: 'v36a-secao-extra', id: 'v36-clients', ontoggle: async ev => { if (!ev.currentTarget.open || loaded) return; loaded = true; await mostrarConfiguracaoMcp(clientContent); clientContent.querySelector('h1')?.remove(); } }, h('summary', {}, tr('Clientes MCP · diagnóstico e configuração')), clientContent);
      body.replaceChildren(
        h('div', { class: 'v36a-topo' }, h('div', {}, h('h2', { class: 'v36a-titulo' }, tr('Agentes'), ' ', conta, DS.info(['Especializações do núcleo e prévias locais deste projeto.', 'Especializações reais do núcleo. Habilitação não comprova sessão nem execução ativa. Retratos com movimento visual, sem articulação facial 3D.'], { id: 'v36a-sobre' }))),
          h('div', { class: 'v36a-acoes' }, h('label', { class: 'v36a-busca' }, iconeBusca(), search), h('button', { type: 'button', class: 'v36a-quieto', id: 'v36-agentes-integracoes', title: tr('Claude Code, Codex, Qase e Jira'), onclick: () => void mostrar('conexoes') }, tr('Integrações')), novo)),
        lista,
        legacyPolicies(), clients);
      render();
    }
    // Matriz completa do projeto (mesmos seletores da tela 2.9), com confirmação nativa para salvar.
    function legacyPolicies() {
      const esp = new Set(s.configuracao.especializacoes), pol = { ...s.configuracao.politicas };
      const save = h('button', { type: 'button', class: 'v36a-primario', id: 'ag-salvar', disabled: true, onclick: async () => { save.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { avisar('Permissões salvas.'); void mostrar('agentes'); } else dirty(); } }, tr('Salvar permissões…'));
      function dirty() { save.disabled = JSON.stringify([...esp].sort((a, b) => String(a).localeCompare(String(b)))) === JSON.stringify([...s.configuracao.especializacoes].sort((a, b) => String(a).localeCompare(String(b)))) && JSON.stringify(pol) === JSON.stringify(s.configuracao.politicas); }
      return h('details', { class: 'v36a-secao-extra', open: true }, h('summary', {}, tr('Políticas do projeto · confirmação nativa para salvar')),
        h('div', { id: 'ag-especializacoes', class: 'v36a-esps' }, s.especializacoes.map(x => h('label', { class: 'v36a-check' }, h('input', { type: 'checkbox', 'data-esp': x.id, checked: esp.has(x.id), onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); dirty(); } }), h('span', {}, x.rotulo)))),
        policyTable(pol, dirty), h('div', { class: 'v36a-salvar' }, save));
    }
    function policyTable(pol, change, caps) {
      return h('div', { class: 'v36a-matriz', id: 'ag-matriz', role: 'table', 'aria-label': tr('Permissões') },
        s.matriz.filter(c => !caps || caps.includes(c.id)).map(c => h('div', { class: 'v36a-cap', role: 'row', 'data-cap': c.id },
          h('div', { class: 'v36a-cap-info', role: 'cell', title: c.motivo }, h('strong', {}, c.rotulo), h('small', { class: 'v36-sr' }, c.motivo)),
          h('div', { role: 'cell' }, !c.editavel.length || c.estado !== (pol[c.id] ?? c.editavel[0]) ? selo(c.estado) : null),
          h('div', { role: 'cell' }, c.editavel.length ? h('select', { 'data-pol': c.id, 'aria-label': c.rotulo, onchange: ev => { pol[c.id] = ev.target.value; change(); } }, c.editavel.map(v => h('option', { value: v, selected: (pol[c.id] ?? c.editavel[0]) === v }, v))) : h('span', { class: 'v36a-pessoa' }, tr('Somente pessoa'))))));
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
      const pol = { ...s.configuracao.politicas }, esp = new Set(s.configuracao.especializacoes);
      const alheio = x.preview && x.meu === false;
      const name = h('input', { id: 'v36-agent-name', value: x.nome, maxlength: 100, required: true, readonly: !x.preview || alheio, placeholder: tr('Ex.: Agente de regressão') });
      const publico = h('input', { type: 'checkbox', id: 'v36-agent-publico', checked: !!x.publico, disabled: alheio, onchange: () => sync() });
      const desc = h('textarea', { id: 'v36-agent-description', rows: 3, maxlength: 4000, placeholder: tr('Quando o Prumo deve sugerir este agente') }, x.descricao || '');
      const goal = h('textarea', { id: 'v36-agent-goal', rows: 3, maxlength: 4000, required: true, placeholder: tr('Ex.: revisar a cobertura de um ticket autorizado') }, x.objetivo || '');
      const instructions = h('textarea', { id: 'v36-agent-instructions', rows: 6, maxlength: 4000, required: true, placeholder: tr('Responsabilidades, regras de decisão, restrições e formato esperado') }, x.instrucoes || '');
      const enabled = h('input', { type: 'checkbox', id: 'v36-agent-enabled', checked: esp.has(x.id), onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); sync(); } });
      const form = h('form', { class: 'v36-agent-form v36a-form', id: 'v36-agent-form' });
      const cancel = h('button', { type: 'button', id: 'v36-agent-cancel', 'aria-label': tr('Descartar alterações'), title: tr('Descartar alterações'), disabled: true, onclick: () => reset() }, '×');
      const save = h('button', { type: 'submit', form: 'v36-agent-form', id: 'v36-agent-save', 'aria-label': tr('Confirmar alterações'), title: tr('Confirmar alterações'), disabled: true }, '✓');
      if (alheio) for (const campo of [desc, goal, instructions]) campo.readOnly = true;
      const read = () => ({ version: 1, id: x.id, nome: name.value, descricao: desc.value, objetivo: goal.value, instrucoes: instructions.value });
      const baseline = JSON.stringify(read());
      function changed() { return x.preview ? !alheio && (JSON.stringify(read()) !== baseline || publico.checked !== !!x.publico) : JSON.stringify(pol) !== JSON.stringify(s.configuracao.politicas) || esp.has(x.id) !== habilitada(x.id); }
      function sync() { cancel.disabled = save.disabled = !changed(); rodape.classList.toggle('alterado', changed()); }
      function reset() { if (x.preview) { name.value = x.nome; desc.value = x.descricao || ''; goal.value = x.objetivo || ''; instructions.value = x.instrucoes || ''; publico.checked = !!x.publico; } else { detail(x); return; } sync(); }
      form.addEventListener('input', sync);
      form.addEventListener('submit', async ev => { ev.preventDefault(); if (!changed()) return;
        if (x.preview) { let data; try { data = validateDraft(read()); } catch (err) { avisar(err.message, true); return; }
          const aviso = publico.checked ? tr('Público: as outras contas deste computador veem este agente, só para leitura. Só você edita.') : tr('Privado: só você vê este agente.');
          const d = h('dialog', { class: 'v36-dialog v36a-confirmar', 'aria-label': tr('Confirmar salvamento do agente') }, h('div', { class: 'v36a-olho' }, tr('CONFIRMAR ALTERAÇÕES')), h('h2', {}, tr('Salvar agente?')), note(data.nome + ' · ' + aviso), h('div', { class: 'v36a-confirmar-acoes' }, button(tr('Cancelar'), () => d.close()), button(tr('Salvar agente'), async () => {
            const r = await chamar(() => api.agentePessoalSalvar(e.id, { id: data.id, nome: data.nome, descricao: data.descricao, objetivo: data.objetivo, instrucoes: data.instrucoes, publico: publico.checked })); if (!r) return;
            const antes = linhasInstrucao(x.instrucoes); registrarMudanca(r.id, [...(data.nome !== x.nome || data.descricao !== (x.descricao || '') ? ['Identidade'] : []), ...(data.objetivo !== (x.objetivo || '') ? ['Objetivo'] : []), ...(publico.checked !== !!x.publico ? ['Visibilidade'] : []), ...linhasInstrucao(data.instrucoes).map((l, i) => antes.includes(l) ? null : tr('Instrução {n}', { n: i + 1 })).filter(Boolean)]);
            drafts = await carregarPessoais(e.id); d.close(); void list();
          }, { class: 'acao primaria', id: 'v36-agent-confirmar' }))); document.body.append(d); d.addEventListener('close', () => d.remove(), { once: true }); d.showModal();
        } else { save.disabled = cancel.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { registrarMudanca(x.id, [...(esp.has(x.id) !== habilitada(x.id) ? ['Disponibilidade'] : []), ...s.matriz.filter(c => x.capacidades.includes(c.id) && (pol[c.id] ?? null) !== (s.configuracao.politicas[c.id] ?? null)).map(c => c.rotulo)]); avisar('Permissões salvas.'); void mostrar('agentes'); } else sync(); }
      });
      const exportar = h('button', { type: 'button', class: 'v36a-quieto', onclick: () => { try { void download('prumo-agente-' + x.id + '.json', JSON.stringify(x.preview ? validateDraft(read()) : { fonte: 'nucleo', especializacao: { id: x.id, rotulo: x.rotulo, skill: x.skill, capacidades: x.capacidades }, configuracao: s.configuracao }, null, 2)); } catch (err) { avisar('Exportação recusada: ' + err.message, true); } } }, tr('Exportar JSON'));
      const barra = h('div', { class: 'v36a-barra' }, h('button', { type: 'button', class: 'v36a-voltar', onclick: list }, '← ', tr('Agentes')), h('div', { class: 'v36a-barra-acoes' }));
      if (x.preview) { const file = h('input', { type: 'file', accept: '.json,application/json', id: 'v36-agent-import', class: 'v36-sr', onchange: async ev => { const f = ev.target.files[0]; if (!f) return; try { if (f.size > 32768) throw Error('Arquivo excede 32 KiB.'); const d = validateDraft(JSON.parse(await f.text())); name.value = d.nome; desc.value = d.descricao; goal.value = d.objetivo; instructions.value = d.instrucoes; sync(); avisar('Prévia importada. Revise e confirme antes de salvar.'); } catch (err) { avisar('Importação recusada: ' + err.message, true); } ev.target.value = ''; } });
        barra.lastChild.append(h('label', { class: 'v36a-quieto', title: tr('A importação só preenche o formulário; revise antes de salvar.') }, '↥ ', h('span', {}, tr('Importar prévia JSON')), file)); }
      if (x.preview && !alheio && !isNew && drafts.some((a) => a.id === x.id)) barra.lastChild.append(h('button', { type: 'button', class: 'v36a-quieto', id: 'v36-agent-excluir', onclick: async () => {
        if (!confirm(tr('Excluir o agente {nome}? Isso não pode ser desfeito.', { nome: x.nome }))) return;
        const r = await chamar(() => api.agentePessoalExcluir(x.id)); if (!r) return; avisar(tr('Agente excluído.')); drafts = await carregarPessoais(e.id); void list();
      } }, tr('Excluir agente')));
      barra.lastChild.append(exportar);
      const retrato = h('div', { class: 'v36a-retrato-robo' });
      const perfil = h('aside', { class: 'v36a-perfil' }, h('div', { class: 'v36a-perfil-retrato' }, retrato),
        h('div', { class: 'v36a-perfil-info' }, h('span', { class: 'v36a-olho' }, x.preview ? (alheio ? tr('AGENTE PÚBLICO') : tr('SEU AGENTE')) : tr('ESPECIALIZAÇÃO DO NÚCLEO')), h('h2', { 'data-i18n-ignore': '' }, x.nome || tr('Novo agente')),
          h('p', {}, x.preview ? visibilidade(x) : h('span', {}, x.skill, ' · ', ...resumoCaps(x).filter(Boolean).slice(0, 1))),
          h('button', { type: 'button', class: 'v36a-cerebro-btn', id: 'v36-brain-open', 'aria-label': tr('Abrir cérebro do agente'), title: tr('Explorar as conexões configuradas deste agente'), onclick: () => brain(x) }, iconeCerebro())));
      perfil.style.setProperty('--face-color', palette[x.index % 8]); neural(perfil, { pontos: 46 });
      if (x.preview) form.append(h('div', { class: 'v36a-form-topo' }, h('span', {}, isNew ? tr('Criar prévia de agente') : tr('Configuração do agente')), h('span', {}, tr('* Obrigatório'))));
      if (x.preview) form.append(note(alheio ? tr('Agente público de {dono}: você pode consultar, mas só quem criou edita.', { dono: x.dono || tr('outra conta') }) : previewNotice),
        secao('Identidade', 'Como o agente aparece na lista e como é identificado.', field(tr('Nome *'), name), field(tr('Descrição'), desc)),
        secao('Quem vê', 'Privado: só você vê. Público: as outras contas deste computador veem, só para leitura. A Administração não vê os privados.', h('label', { class: 'v36a-publico', for: 'v36-agent-publico' }, publico, h('span', {}, tr('Público para as outras contas')))),
        secao('Objetivo e instruções', 'O que fazer, como agir e o que caracteriza um resultado válido.', field(tr('Objetivo *'), goal), field(tr('Instruções *'), instructions)));
      else form.append(
        secao('Identidade', 'Especialização fixa do núcleo; nome e skill não são editáveis.', field(tr('Nome *'), name), field(tr('Skill configurada'), h('input', { value: x.skill, readonly: true }))),
        secao('Disponibilidade', 'Habilitar não inicia sessão nem execução; o cliente de IA decide quando usar.', h('label', { class: 'v36a-interruptor' }, enabled, h('span', { class: 'v36a-trilho', 'aria-hidden': 'true' }), h('span', {}, tr('Especialização habilitada')))),
        secao('Permissões', 'As políticas são compartilhadas pelo projeto e aplicadas pelo servidor MCP.', policyTable(pol, sync, x.capacidades)),
        secaoSkills(x));
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
