'use strict';
/** Conectar a IA da pessoa ao Prumo por MCP (Claude Code, Codex, GitHub Copilot e Gemini CLI): escolher, instalar, conectar, testar e usar. */

/** Nome e instalação de cada IA que conversa com o Prumo pelo MCP. Também usado em Agentes e em Projetos. */
const IAS_DO_MCP = {
  claude: { nome: 'Claude Code', pacote: '@anthropic-ai/claude-code', cli: 'claude' },
  codex: { nome: 'Codex', pacote: '@openai/codex', cli: 'codex' },
  copilot: { nome: 'GitHub Copilot', pacote: '@github/copilot', cli: 'copilot' },
  gemini: { nome: 'Gemini CLI', pacote: '@google/gemini-cli', cli: 'gemini', aviso: 'Com conta pessoal do Google, o Gemini CLI pode recusar o login; nesse caso, defina a variável GEMINI_API_KEY antes de abrir.' }
};
const ORDEM_DAS_IAS = ['claude', 'codex', 'copilot', 'gemini'];
const PEDIDOS_DE_EXEMPLO = ['Use o Prumo e leia o contexto deste projeto.', 'Pergunte ao Orchestrator do Prumo como está a regressão.', 'Proponha no Prumo casos de teste para o requisito de login.'];
let iaEscolhidaNoMcp = null;
let gradienteDaIa = 0;

/** Marca de cada IA desenhada em SVG (sem imagens externas). */
function iconeDaIa(cliente, classe = 'v36a-cliente-icone') {
  const ns = 'http://www.w3.org/2000/svg';
  const s = (tag, attrs, ...filhos) => { const e = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); e.append(...filhos); return e; };
  const caixa = h('span', { class: classe + ' ' + cliente, 'aria-hidden': 'true' });
  let marca;
  if (cliente === 'claude') marca = s('svg', { viewBox: '0 0 64 64' }, ...Array.from({ length: 12 }, (_, i) => s('path', { d: 'M32 32 L' + (32 + Math.cos(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1) + ' ' + (32 + Math.sin(i * Math.PI / 6) * (i % 2 ? 19 : 26)).toFixed(1), stroke: '#d97757', 'stroke-width': 6.5, 'stroke-linecap': 'round' })));
  else if (cliente === 'copilot') marca = s('svg', { viewBox: '0 0 64 64', fill: 'none', stroke: 'currentColor', 'stroke-width': 3.6, 'stroke-linejoin': 'round' },
    s('path', { d: 'M12 34c0-11 8-18 20-18s20 7 20 18v9c0 6-9 11-20 11s-20-5-20-11z' }), s('rect', { x: 17, y: 25, width: 13, height: 11, rx: 5 }), s('rect', { x: 34, y: 25, width: 13, height: 11, rx: 5 }), s('path', { d: 'M27 45h0M37 45h0', 'stroke-width': 4.5, 'stroke-linecap': 'round' }));
  else if (cliente === 'gemini') {
    const id = 'ia-gemini-' + (++gradienteDaIa);
    marca = s('svg', { viewBox: '0 0 64 64' }, s('defs', {}, s('linearGradient', { id, x1: 0, y1: 0, x2: 1, y2: 1 }, s('stop', { offset: '0', 'stop-color': '#4f8df5' }), s('stop', { offset: '.55', 'stop-color': '#9168c0' }), s('stop', { offset: '1', 'stop-color': '#d6645d' }))),
      s('path', { d: 'M32 5c1.6 14.4 12.6 25.4 27 27-14.4 1.6-25.4 12.6-27 27-1.6-14.4-12.6-25.4-27-27C19.4 30.4 30.4 19.4 32 5z', fill: 'url(#' + id + ')' }));
  } else marca = s('svg', { viewBox: '0 0 64 64' }, ...Array.from({ length: 6 }, (_, i) => s('rect', { x: 26, y: 9, width: 12, height: 30, rx: 6, fill: 'none', stroke: 'currentColor', 'stroke-width': 3.4, transform: 'rotate(' + i * 60 + ' 32 32)' })));
  caixa.append(marca); return caixa;
}

/** Situação da IA em linguagem simples: [classe do ponto, texto]. */
function situacaoDaIa(c) {
  if (c.state === 'ERRO') return ['erro', 'Precisa de atenção'];
  if (c.state === 'UTILIZADO') return ['ok', 'Conectada e em uso'];
  if (c.state === 'VALIDADO' || c.state === 'CONFIGURADO') return ['ok', 'Conectada'];
  return c.installed ? ['pronta', 'Pronta para conectar'] : ['off', 'Não instalada'];
}

async function mostrarConfiguracaoMcp(el, opcoes = {}) {
  el.append(h('h1', {}, 'Conectar sua IA ao Prumo'));
  if (!estado.root) return el.append(semProjeto());
  const raiz = estado.root;
  const lista = await chamar(() => api.conexoes(raiz)); if (!lista) return;
  const ias = ORDEM_DAS_IAS.map((id) => lista.find((c) => c.client === id)).filter(Boolean);
  if (!ias.length) return;
  iaEscolhidaNoMcp = opcoes.ia || iaEscolhidaNoMcp || (ias.find((c) => c.state === 'UTILIZADO' || c.state === 'VALIDADO' || c.state === 'CONFIGURADO') || ias.find((c) => c.installed) || ias[0]).client;
  const windows = /Win/i.test(navigator.platform || '');
  const copiar = (texto) => navigator.clipboard.writeText(texto).then(() => avisar(tr('Copiado.')), () => avisar(tr('Não foi possível copiar.'), true));
  const comando = (texto, rotulo = 'Copiar comando') => h('div', { class: 'ia-mcp-comando' }, h('code', { 'data-i18n-ignore': '' }, texto), h('button', { type: 'button', class: 'ia-mcp-copiar', 'aria-label': tr(rotulo), onclick: () => copiar(texto) }, tr('Copiar')));
  const escolha = h('div', { class: 'ia-mcp-ias', role: 'group', 'aria-label': tr('Escolha sua IA') });
  const guia = h('div', { class: 'ia-mcp-guia', 'aria-live': 'polite' });
  el.append(escolha, guia);

  function desenhar() {
    escolha.replaceChildren(...ias.map((c) => {
      const [ponto, texto] = situacaoDaIa(c);
      return h('button', { type: 'button', class: 'ia-mcp-ia', 'data-ia': c.client, 'aria-pressed': String(c.client === iaEscolhidaNoMcp), onclick: () => { iaEscolhidaNoMcp = c.client; desenhar(); } },
        iconeDaIa(c.client, 'ia-mcp-icone'), h('span', { class: 'ia-mcp-ia-nome', 'data-i18n-ignore': '' }, IAS_DO_MCP[c.client].nome), h('span', { class: 'ia-mcp-ia-estado' }, h('i', { class: ponto }), tr(texto)));
    }));
    guia.replaceChildren(...passos(ias.find((c) => c.client === iaEscolhidaNoMcp)));
  }

  // Quatro passos, sempre na mesma ordem; o primeiro que falta fica em destaque.
  function passos(c) {
    const ia = IAS_DO_MCP[c.client];
    const conectada = !!c.configuration?.found;
    const testado = c.protocolCurrent && c.lastProtocol ? c.lastProtocol.state : null;
    const feitos = [c.installed, conectada, testado === 'VALIDADO', !!c.lastObserved];
    const atual = feitos.indexOf(false);
    const passo = (i, titulo, ...conteudo) => h('li', { class: 'ia-mcp-passo' + (feitos[i] ? ' feito' : '') + (i === atual ? ' atual' : ''), 'data-passo': String(i + 1) },
      h('span', { class: 'ia-mcp-num', 'aria-hidden': 'true' }, feitos[i] ? '✓' : String(i + 1)), h('div', { class: 'ia-mcp-passo-corpo' }, h('strong', {}, tr(titulo)), ...conteudo));
    const instalar = c.installed ? [h('p', {}, tr('Encontrado neste computador.'))]
      : [h('p', {}, tr('Rode no terminal e entre na sua conta:')), comando((windows ? 'npm.cmd' : 'npm') + ' install -g ' + ia.pacote), h('p', { class: 'ia-mcp-dica' }, tr('Depois abra com {cli} e faça login.', { cli: ia.cli + (windows ? '.cmd' : '') }))];
    if (ia.aviso) instalar.push(DS.info(ia.aviso, { rotulo: 'Sobre o login do Gemini' }));
    const botaoConectar = h('button', { type: 'button', class: 'v36a-primario ia-mcp-acao', id: 'ia-mcp-conectar', onclick: async () => {
      botaoConectar.disabled = true;
      const r = await chamar(() => api.conectar(raiz, c.client));
      if (r) avisar(r.configured ? tr('Pronto! Feche e abra o {nome} de novo.', { nome: ia.nome }) : r.reason, !r.configured);
      if (r?.configured) await recarregar(); else botaoConectar.disabled = false;
    } }, tr('Conectar ao Prumo'));
    const conectar = conectada ? [h('p', {}, tr('O Prumo já está no {nome}.', { nome: ia.nome })), h('p', { class: 'ia-mcp-dica' }, tr('Se ele estava aberto, feche e abra de novo.'))]
      : !c.installed ? [h('p', { class: 'ia-mcp-dica' }, tr('Instale primeiro.'))]
      : c.automatic ? [botaoConectar, h('details', { class: 'ia-mcp-manual' }, h('summary', {}, tr('Prefiro copiar o comando')), comando(c.command))]
      : [h('p', {}, tr('Rode no terminal:')), comando(c.command)];
    const resultado = h('p', { class: 'ia-mcp-resultado' + (testado === 'VALIDADO' ? ' ok' : testado === 'ERRO' ? ' erro' : '') },
      testado === 'VALIDADO' ? tr('Funcionando · {quando}', { quando: hora(c.lastProtocol.at) }) : testado === 'ERRO' ? tr('Não respondeu. Deixe o Prumo aberto e com você conectado.') : tr('Confere se o Prumo responde.'));
    const botaoTestar = h('button', { type: 'button', class: 'ia-mcp-secundario ia-mcp-acao', id: 'ia-mcp-testar', onclick: async () => {
      botaoTestar.disabled = true; resultado.textContent = tr('Testando…');
      const x = await chamar(() => api.testarIntegracao(raiz, c.client));
      if (x) { Object.assign(c, x); desenhar(); } else botaoTestar.disabled = false;
    } }, tr('Testar conexão'));
    const usar = [h('p', {}, tr('Abra o {nome} e peça, por exemplo:', { nome: ia.nome })),
      h('div', { class: 'ia-mcp-pedidos' }, PEDIDOS_DE_EXEMPLO.map((p) => h('button', { type: 'button', class: 'ia-mcp-pedido', title: tr('Copiar'), onclick: () => copiar(tr(p)) }, tr(p)))),
      h('p', { class: 'ia-mcp-dica' }, c.lastObserved ? tr('Última chamada: {quando} · {ferramenta}', { quando: hora(c.lastObserved.at), ferramenta: c.lastObserved.tool }) : tr('Ainda sem chamadas do {nome}.', { nome: ia.nome }))];
    return [
      h('ol', { class: 'ia-mcp-passos', 'aria-label': tr('Passos para conectar o {nome}', { nome: ia.nome }) },
        passo(0, 'Instalar', ...instalar), passo(1, 'Conectar', ...conectar), passo(2, 'Testar', botaoTestar, resultado), passo(3, 'Usar', ...usar)),
      h('details', { class: 'ia-mcp-tecnico' }, h('summary', {}, tr('Detalhes técnicos')),
        h('dl', {},
          h('dt', {}, tr('Estado')), h('dd', {}, selo(c.state)),
          h('dt', {}, tr('Arquivo de configuração')), h('dd', {}, h('code', { 'data-i18n-ignore': '' }, c.destination)),
          h('dt', {}, tr('Comando de conexão')), h('dd', {}, comando(c.command)),
          h('dt', {}, tr('Último teste (SDK)')), h('dd', {}, c.lastProtocol ? `${hora(c.lastProtocol.at)} · ${c.lastProtocol.state} · ${ms(c.lastProtocol.durationMs)}${c.protocolCurrent ? '' : ' · ' + tr('escopo anterior')}` : tr('não executado')),
          h('dt', {}, tr('Ferramentas já usadas')), h('dd', {}, c.toolsUsed?.join(', ') || tr('nenhuma')),
          c.problems ? h('dt', {}, tr('Registros inválidos')) : null, c.problems ? h('dd', {}, String(c.problems)) : null),
        h('p', { class: 'suave' }, c.notice))];
  }

  async function recarregar() {
    const novas = await chamar(() => api.conexoes(raiz)); if (!novas) return;
    for (const c of ias) Object.assign(c, novas.find((x) => x.client === c.client) || {});
    desenhar();
  }
  desenhar();
}
