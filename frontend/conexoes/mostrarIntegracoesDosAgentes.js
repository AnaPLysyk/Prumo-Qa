'use strict';
/** Conexões como ponto de distribuição: o que alimenta os agentes (Claude Code e Codex por MCP; Qase, Jira e GitHub para testes) e o caminho para configurar cada um. */
// `agentesLegados` (usarTelaAgentes.js) guarda a página original de configuração e teste do MCP.
const conexoesSemIntegracoes = abas.conexoes;
abas.conexoes = async (el) => {
  await conexoesSemIntegracoes(el);
  const quieto = async (fn) => { try { const r = await fn(); return r && r.ok ? r.data : null; } catch { return null; } };
  const e = estado.espaco;
  const centro = h('section', { id: 'integracoes-agentes', class: 'nota' });
  const titulo = el.querySelector('h1'); if (titulo) titulo.after(centro); else el.prepend(centro);
  const [contas, clientes, perm] = await Promise.all([quieto(() => api.servicos()), estado.root ? quieto(() => api.conexoes(estado.root)) : null, e ? escritaDoProjeto(e).catch(() => null) : null]);
  const painelMcp = h('div', { id: 'conexao-mcp-painel' }); let carregado = false;
  const mcp = h('details', { id: 'conexao-mcp', ontoggle: async (ev) => { if (!ev.currentTarget.open || carregado) return; carregado = true; await agentesLegados(painelMcp); painelMcp.querySelector('h1')?.remove(); } },
    h('summary', {}, tr('Configurar e testar Claude Code e Codex (MCP)')), painelMcp);
  const abrirMcp = () => { mcp.open = true; mcp.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const linha = (atributos, nome, detalhe, situacao, ...acoes) => h('div', { class: 'linha', ...atributos }, h('strong', { 'data-i18n-ignore': '' }, nome), ' ', situacao, ' ', h('span', { class: 'suave' }, detalhe), ' ', ...acoes);
  const ia = ['claude', 'codex'].map((cliente) => {
    const nome = cliente === 'claude' ? 'Claude Code' : 'Codex'; const c = clientes?.find((x) => x.client === cliente);
    const usado = c?.lastObserved ? tr('Última chamada: {quando}', { quando: hora(c.lastObserved.at) }) : tr('Nenhuma chamada observada');
    return linha({ 'data-integracao': cliente }, nome, e ? (c ? usado : tr('Estado indisponível agora.')) : tr('Selecione um projeto para configurar.'), c ? selo(c.state) : null, e ? botao(tr('Configurar e testar'), abrirMcp, 'integracao-' + cliente) : null);
  });
  const testes = [['qase', tr('casos, planos e runs para os agentes de teste')], ['jira', tr('tickets e critérios de aceite para os agentes de análise')], ['github', tr('repositório, branches e Pull Requests de teste')]].map(([sv, serve]) => {
    const ativas = (contas || []).filter((c) => c.ativa && c.servico === sv);
    const escrita = perm ? (perm[sv] ? tr('escrita habilitada') : tr('somente leitura')) : null;
    return linha({ 'data-integracao': sv }, nomeServ[sv], serve + (escrita ? ' · ' + escrita : ''), ativas.length ? selo('VALIDO') : null,
      ativas.length ? h('span', { class: 'suave', 'data-i18n-ignore': '' }, ativas.map((c) => c.identidade).join(', ')) : h('span', { class: 'suave' }, tr('Sem conta conectada.')),
      botao(ativas.length ? tr('Adicionar outra conta') : tr('Conectar {nome}', { nome: nomeServ[sv] }), () => { document.getElementById('conexao-nova')?.click(); const s = document.getElementById('conexao-servico'); if (s) { s.value = sv; s.dispatchEvent(new Event('change')); s.scrollIntoView({ block: 'center' }); } }, 'integracao-conectar-' + sv));
  });
  centro.append(h('h2', {}, tr('Integrações dos agentes'), DS.info(tr('Aqui nascem as ligações que os agentes usam. A plataforma e os agentes locais funcionam sem elas; elas só ampliam o que os agentes alcançam.'))),
    h('h3', {}, tr('IA por MCP')), h('div', { id: 'integracoes-ia' }, ia), mcp,
    h('h3', {}, tr('Testes e tickets')), h('div', { id: 'integracoes-testes' }, testes),
    h('p', {}, botao(tr('Abrir Agentes'), () => mostrar('agentes'), 'integracao-abrir-agentes')));
};
