'use strict';
/** Conexões como ponto de distribuição: serviços de teste e tickets (linhas da tela base) e, abaixo, a IA por MCP (Claude Code e Codex). */
// `agentesLegados` (usarTelaAgentes.js) guarda a página original de configuração e teste do MCP.
const conexoesSemIntegracoes = abas.conexoes;
abas.conexoes = async (el) => {
  await conexoesSemIntegracoes(el);
  const quieto = async (fn) => { try { const r = await fn(); return r && r.ok ? r.data : null; } catch { return null; } };
  const e = estado.espaco;
  const centro = h('div', { id: 'integracoes-agentes', class: 'ds-integracoes' });
  // As linhas de Qase, Jira e GitHub já vêm da tela base: entram no mesmo bloco, antes da IA, sem repetir os serviços.
  const servicos = el.querySelector('#cx-servicos'); if (servicos) { servicos.replaceWith(centro); centro.append(servicos); } else el.append(centro);
  const clientes = estado.root ? await quieto(() => api.conexoes(estado.root)) : null;
  const painelMcp = h('div', { id: 'conexao-mcp-painel' }); let carregado = false;
  const mcp = h('details', { id: 'conexao-mcp', ontoggle: async (ev) => { if (!ev.currentTarget.open || carregado) return; carregado = true; await agentesLegados(painelMcp); painelMcp.querySelector('h1')?.remove(); } },
    h('summary', {}, tr('Configurar e testar Claude Code e Codex (MCP)')), painelMcp);
  const abrirMcp = () => { mcp.open = true; mcp.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const linha = (atributos, nome, detalhe, situacao, ...acoes) => h('div', { class: 'ds-integra', ...atributos }, h('strong', { 'data-i18n-ignore': '' }, nome), h('span', { class: 'suave' }, detalhe), h('span', { class: 'ds-integra-estado' }, situacao), h('span', { class: 'ds-integra-acoes' }, acoes));
  const ia = ['claude', 'codex'].map((cliente) => {
    const nome = cliente === 'claude' ? 'Claude Code' : 'Codex'; const c = clientes?.find((x) => x.client === cliente);
    const usado = c?.lastObserved ? tr('Última chamada: {quando}', { quando: hora(c.lastObserved.at) }) : tr('Nenhuma chamada observada');
    return linha({ 'data-integracao': cliente }, nome, e ? (c ? usado : tr('Estado indisponível agora.')) : tr('Selecione um projeto para configurar.'), c ? selo(c.state) : null, e ? botao(tr('Configurar e testar'), abrirMcp, 'integracao-' + cliente) : null);
  });
  centro.append(DS.secao('IA por MCP', [h('div', { id: 'integracoes-ia' }, ia), mcp], { acoes: [botao(tr('Abrir Agentes'), () => mostrar('agentes'), 'integracao-abrir-agentes')] }));
};
