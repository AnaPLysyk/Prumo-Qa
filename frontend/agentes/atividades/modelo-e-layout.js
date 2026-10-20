'use strict';
// Painel de atividades dos Agentes (v41): canvas infinito com janelas de terminal ligadas por linhas.
// Só desenha registros reais deste computador: operações do núcleo (MCP/CLI), conversas do chat (Orchestrator →
// agente → IA externa, quando houve delegação) e execuções do worker. Nenhuma ligação é inferida: cada linha vem de um
// campo gravado (cliente da operação, agente escolhido pelo roteamento, modo da resposta, rotina da execução).
// Pan e zoom por mouse, toque (pinça), trackpad e teclado; funciona em qualquer largura de janela.
const PrumoModeloAtividades = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) e.setAttribute(k, v); return e; };
  const TAM = { janela: [340, 196], hub: [216, 58], folha: [208, 104] };
  const GAP = { folhaX: 18, folhaY: 22, hub: 46, secao: 120, linhaHub: 150, linhaFolha: 96 };
  const MAX_COLUNAS = 4, MAX_FOLHAS = 24, RECENTE_MS = 90000;
  const CORES_FERRAMENTA = { contexto_projeto: '#62d4f0', revisar_cobertura: '#b99cff', executar_validacao: '#6fe0a0', consultar_evidencias: '#f3cf5a', desconhecida: '#a3adbd' };
  const CORES_AGENTE = ['#7abaff', '#80ddda', '#bea1f8', '#ffba90', '#a7de82', '#ffa1bf', '#f2d38c', '#99b8ff', '#62d4f0'];
  const CORES_ROTINA = ['#ff8fb7', '#ffb36b', '#f3cf5a', '#9fe870'];
  const classe = (s) => (['PASS', 'OK', 'CONCLUIDO'].includes(s) ? 'ok' : ['FAIL', 'ERROR', 'PERDIDO', 'FALHOU'].includes(s) ? 'falha' : ['BLOCKED', 'NOT_VERIFIED', 'NOT_RUN', 'SEM_TERMINO_OBSERVADO', 'STARTED', 'EXECUTANDO', 'PENDENTE', 'CANCELADO'].includes(s) ? 'aviso' : 'neutro');
  const curto = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); };
  const data = (iso) => { if (!iso) return ''; const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }); };
  const duracao = (n) => (n == null ? '' : n < 1000 ? Math.round(n) + ' ms' : (n / 1000).toFixed(1) + ' s');
  const recente = (iso) => !!iso && Date.now() - Date.parse(iso) < RECENTE_MS;
  const temaClaro = () => { const t = document.documentElement.dataset.tema; return t === 'claro' || (t !== 'escuro' && matchMedia('(prefers-color-scheme: light)').matches); };
  const corCodex = () => (temaClaro() ? '#3b4a63' : '#e8edf6');
  const nomeCliente = (c) => (c === 'claude' ? 'Claude Code' : c === 'codex' ? 'Codex' : c || 'cliente');
  const assinatura = (d) => JSON.stringify([d.atividades.map((a) => a.operationId + a.state), d.conversas.map((c) => c.id + ':' + (c.avaliacao || '')), d.execucoes.map((x) => x.id + x.estado)]);

  // ---------- Modelo: fontes (janelas), hubs e folhas, com as arestas que os registros comprovam ----------
  function modelar(d) {
    const fontes = [], hubs = [], folhas = [], arestas = [], secoes = [];
    // 1) Clientes MCP/CLI → ferramentas do núcleo → operações.
    if (d.atividades.length) {
      const porCliente = new Map(), porFerramenta = new Map();
      for (const a of d.atividades) {
        const c = a.origin + ' · ' + a.client; if (!porCliente.has(c)) porCliente.set(c, []); porCliente.get(c).push(a);
        if (!porFerramenta.has(a.tool)) porFerramenta.set(a.tool, []); porFerramenta.get(a.tool).push(a);
      }
      const sec = { id: 'nucleo', titulo: tr('Clientes → núcleo Prumo'), fontes: [], hubs: [] }; secoes.push(sec);
      for (const [c, lista] of porCliente) {
        const [origem, cliente] = c.split(' · ');
        const f = { id: 'cli:' + c, tipo: 'cliente', titulo: origem + ' · ' + nomeCliente(cliente), sub: tr('{n} operações registradas', { n: lista.length }), vivo: lista.some((a) => recente(a.at)),
          linhas: lista.slice(0, 7).map((a) => ({ hora: curto(a.at), texto: a.tool, estado: a.state, extra: duracao(a.durationMs) })), cor: cliente === 'claude' ? '#d97757' : cliente === 'codex' ? corCodex() : '#8fb4ff' };
        fontes.push(f); sec.fontes.push(f);
      }
      for (const [tool, lista] of porFerramenta) {
        const hub = { id: 'tool:' + tool, tipo: 'ferramenta', titulo: tool, sub: tr('{n} operações', { n: lista.length }), cor: CORES_FERRAMENTA[tool] || CORES_FERRAMENTA.desconhecida, folhas: [], ocultas: Math.max(0, lista.length - MAX_FOLHAS) };
        hubs.push(hub); sec.hubs.push(hub);
        for (const c of new Set(lista.map((a) => a.origin + ' · ' + a.client))) arestas.push({ de: 'cli:' + c, para: hub.id, tipo: 'fonte', vivo: lista.some((a) => recente(a.at) && a.origin + ' · ' + a.client === c), peso: lista.filter((a) => a.origin + ' · ' + a.client === c).length });
        for (const a of lista.slice(0, MAX_FOLHAS)) {
          const resumo = a.summary || {};
          const f = { id: 'op:' + a.operationId, tipo: 'operacao', dado: a, cor: hub.cor, etiqueta: a.tool, estado: a.state, hora: data(a.at) + ' ' + curto(a.at), vivo: recente(a.at),
            linhas: ['$ ' + a.origin.toLowerCase() + ' ' + a.tool, [a.state, resumo.code, duracao(a.durationMs)].filter(Boolean).join(' · '), resumo.findings != null ? tr('{a} achados · {g} lacunas', { a: resumo.findings, g: resumo.gaps ?? 0 }) : a.origin + ' · ' + nomeCliente(a.client)],
            rotulo: a.tool + ' ' + a.state + ' ' + curto(a.at) };
          folhas.push(f); hub.folhas.push(f); arestas.push({ de: hub.id, para: f.id, tipo: 'folha', vivo: f.vivo, estado: a.state });
        }
      }
    }
    // 2) Prumo Orchestrator → agente escolhido no roteamento → IA externa (quando a resposta veio dela).
    if (d.conversas.length) {
      const sec = { id: 'chat', titulo: tr('Orchestrator → agentes'), fontes: [], hubs: [] }; secoes.push(sec);
      const ordenadas = [...d.conversas].sort((a, b) => b.em.localeCompare(a.em));
      const orq = { id: 'orq', tipo: 'orquestrador', titulo: 'Prumo Orchestrator', sub: tr('{n} conversas roteadas', { n: ordenadas.length }), vivo: ordenadas.some((c) => recente(c.em)), cor: '#7cb6ff',
        linhas: ordenadas.slice(0, 7).map((c) => ({ hora: curto(c.em), texto: '› ' + (c.pergunta || 'Atendimento sem texto persistido').slice(0, 42), estado: '→ ' + (c.agenteNome || c.agente), extra: '' })) };
      fontes.push(orq); sec.fontes.push(orq);
      const externos = new Map();
      d.agentes.forEach((ag, i) => {
        const lista = ordenadas.filter((c) => c.agente === ag.id); if (!lista.length) return;
        const hub = { id: 'ag:' + ag.id, tipo: 'agente', titulo: ag.id === 'orquestrador' ? tr('Guia do sistema') : ag.nome, sub: tr('{n} conversas', { n: lista.length }), cor: CORES_AGENTE[i % CORES_AGENTE.length], folhas: [], ocultas: Math.max(0, lista.length - MAX_FOLHAS) };
        hubs.push(hub); sec.hubs.push(hub); arestas.push({ de: 'orq', para: hub.id, tipo: 'fonte', vivo: lista.some((c) => recente(c.em)), peso: lista.length });
        for (const c of lista.slice(0, MAX_FOLHAS)) {
          const f = { id: 'cv:' + c.id, tipo: 'conversa', dado: c, cor: hub.cor, etiqueta: c.modo === 'LOCAL' ? tr('resposta local') : c.modo === 'CLAUDE' ? 'Claude Code' : 'Codex', estado: '', hora: data(c.em) + ' ' + curto(c.em), vivo: recente(c.em),
            linhas: ['› ' + (c.pergunta || 'Atendimento sem texto persistido'), '‹ ' + (c.linhas?.[0] || c.avaliacao || 'Sem avaliação'), c.fontes.length ? tr('fontes: {f}', { f: c.fontes.map((x) => typeof x === 'string' ? x : x.rotulo).join(', ') }) : (c.estilo || c.modo)], rotulo: ag.nome + ': ' + (c.pergunta || 'Atendimento') };
          folhas.push(f); hub.folhas.push(f); arestas.push({ de: hub.id, para: f.id, tipo: 'folha', vivo: f.vivo });
          if (c.modo !== 'LOCAL') { const p = c.modo === 'CLAUDE' ? 'claude' : 'codex'; if (!externos.has(p)) externos.set(p, []); externos.get(p).push(c); arestas.push({ de: f.id, para: 'ext:' + p, tipo: 'delegacao', vivo: f.vivo, cor: p === 'claude' ? '#d97757' : corCodex() }); }
        }
      });
      for (const [p, lista] of externos) {
        const f = { id: 'ext:' + p, tipo: 'externo', titulo: nomeCliente(p), sub: tr('{n} respostas delegadas pelo chat', { n: lista.length }), vivo: lista.some((c) => recente(c.em)), cor: p === 'claude' ? '#d97757' : corCodex(),
          linhas: lista.slice(0, 7).map((c) => ({ hora: curto(c.em), texto: '‹ ' + (c.linhas?.[0] || 'Resposta externa registrada').slice(0, 44), estado: c.agenteNome || c.agente, extra: '' })) };
        fontes.push(f); sec.fontes.push(f);
      }
    }
    // 3) Worker do Prumo (agenda ou manual) → rotina → execução.
    if (d.execucoes.length) {
      const sec = { id: 'worker', titulo: tr('Worker → rotinas'), fontes: [], hubs: [] }; secoes.push(sec);
      const w = { id: 'worker', tipo: 'worker', titulo: 'Worker Prumo', sub: tr('{n} execuções na fila do projeto', { n: d.totalExecucoes ?? d.execucoes.length }), vivo: d.execucoes.some((x) => x.estado === 'EXECUTANDO' || recente(x.termino || x.inicio)), cor: '#ff8fb7',
        linhas: d.execucoes.slice(0, 7).map((x) => ({ hora: curto(x.termino || x.inicio || x.criadoEm), texto: x.rotina, estado: x.resultado?.status || x.estado, extra: duracao(x.duracaoMs) })) };
      fontes.push(w); sec.fontes.push(w);
      const porRotina = new Map(); for (const x of d.execucoes) { if (!porRotina.has(x.rotinaId)) porRotina.set(x.rotinaId, []); porRotina.get(x.rotinaId).push(x); }
      [...porRotina.values()].forEach((lista, i) => {
        const hub = { id: 'rot:' + lista[0].rotinaId, tipo: 'rotina', titulo: lista[0].rotina, sub: tr('{n} execuções', { n: lista.length }), cor: CORES_ROTINA[i % CORES_ROTINA.length], folhas: [], ocultas: Math.max(0, lista.length - MAX_FOLHAS) };
        hubs.push(hub); sec.hubs.push(hub); arestas.push({ de: 'worker', para: hub.id, tipo: 'fonte', vivo: lista.some((x) => x.estado === 'EXECUTANDO' || recente(x.termino || x.inicio)), peso: lista.length });
        for (const x of lista.slice(0, MAX_FOLHAS)) {
          const st = x.resultado?.status || x.estado;
          const f = { id: 'ex:' + x.id, tipo: 'execucao', dado: x, cor: hub.cor, etiqueta: x.capability || x.tipo, estado: st, hora: data(x.criadoEm) + ' ' + curto(x.inicio || x.criadoEm), vivo: x.estado === 'EXECUTANDO' || recente(x.termino),
            linhas: ['$ prumo ' + (x.capability || x.tipo) + ' --amb ' + x.ambiente, [st, duracao(x.duracaoMs), x.ticket].filter(Boolean).join(' · '), x.executor + (x.tentativas?.length > 1 ? ' · ' + tr('{n} tentativas', { n: x.tentativas.length }) : '')], rotulo: x.rotina + ' ' + st };
          folhas.push(f); hub.folhas.push(f); arestas.push({ de: hub.id, para: f.id, tipo: 'folha', vivo: f.vivo, estado: st });
        }
      });
    }
    return { fontes, hubs, folhas, arestas, secoes };
  }

  // ---------- Disposição em camadas: janelas no alto, hubs no meio, folhas em grade abaixo de cada hub ----------
  // Testa larguras de linha e fica com a disposição que melhor ocupa a tela (monitor largo, notebook ou celular em pé).
  function dispor(m, W = 1200, H = 700) {
    let melhor = null;
    for (const larg of [900, 1400, 2100, 3000, 4200, 6000]) { const l = disporCom(m, larg, W / Math.max(1, H)); const k = Math.min(W / l.largura, H / l.altura); if (!melhor || k > melhor.k * 1.02) melhor = { ...l, k }; }
    for (const sec of m.secoes) { sec.caixa = melhor.caixas.get(sec.id); for (const hub of sec.hubs) hub.posMais = melhor.mais.get(hub.id) || null; }
    return melhor;
  }
  function disporCom(m, LARG_LINHA, aspecto) {
    const [JW, JH] = TAM.janela, [HW, HH] = TAM.hub, [FW, FH] = TAM.folha; const pos = new Map(), caixas = new Map(), mais = new Map(), TOPO = 44;
    // Cada seção é montada em coordenadas próprias: janelas no alto; hubs em linhas que quebram ao passar de LARG_LINHA,
    // cada hub com sua grade de folhas logo abaixo.
    const blocos = m.secoes.map((sec) => {
      const local = new Map(); let x = 0, y = TOPO + JH + GAP.linhaHub, alturaLinha = 0, largura = 0;
      for (const hub of sec.hubs) {
        const n = hub.folhas.length + (hub.ocultas ? 1 : 0), cols = Math.max(1, Math.min(MAX_COLUNAS, Math.ceil(Math.sqrt(n / 1.6)))), rows = Math.ceil(n / cols);
        const w = Math.max(HW, cols * FW + (cols - 1) * GAP.folhaX), hTotal = HH + GAP.linhaFolha + rows * (FH + GAP.folhaY);
        if (x > 0 && x + w > LARG_LINHA) { x = 0; y += alturaLinha + GAP.linhaHub * .7; alturaLinha = 0; }
        const yFolha = y + HH + GAP.linhaFolha;
        local.set(hub.id, { x: x + (w - HW) / 2, y, w: HW, h: HH });
        const em = (i) => ({ x: x + (i % cols) * (FW + GAP.folhaX), y: yFolha + Math.floor(i / cols) * (FH + GAP.folhaY), w: FW, h: FH });
        hub.folhas.forEach((f, i) => local.set(f.id, em(i))); if (hub.ocultas) local.set('mais:' + hub.id, em(hub.folhas.length));
        alturaLinha = Math.max(alturaLinha, hTotal); largura = Math.max(largura, x + w); x += w + GAP.hub;
      }
      const lf = sec.fontes.length * (JW + GAP.hub) - GAP.hub; largura = Math.max(largura, lf);
      sec.fontes.forEach((f, i) => local.set(f.id, { x: (largura - lf) / 2 + i * (JW + GAP.hub), y: TOPO, w: JW, h: JH }));
      return { sec, local, largura, altura: y + alturaLinha };
    });
    // Seções lado a lado, quebrando em faixas para o conjunto ficar próximo da proporção da tela.
    const area = blocos.reduce((n, b) => n + b.largura * b.altura, 0), alvo = Math.max(...blocos.map((b) => b.largura), Math.sqrt(area * aspecto));
    let x = 0, y = 0, alturaFaixa = 0, largura = 1, altura = 1;
    for (const b of blocos) {
      if (x > 0 && x + b.largura > alvo) { x = 0; y += alturaFaixa + GAP.secao; alturaFaixa = 0; }
      for (const [id, p] of b.local) (id.startsWith('mais:') ? mais.set(id.slice(5), { ...p, x: p.x + x, y: p.y + y }) : pos.set(id, { ...p, x: p.x + x, y: p.y + y }));
      caixas.set(b.sec.id, { x, y, w: b.largura });
      alturaFaixa = Math.max(alturaFaixa, b.altura); largura = Math.max(largura, x + b.largura); altura = Math.max(altura, y + b.altura); x += b.largura + GAP.secao;
    }
    return { pos, caixas, mais, largura, altura };
  }

  return { sv, classe, curto, temaClaro, assinatura, modelar, dispor };
})();
