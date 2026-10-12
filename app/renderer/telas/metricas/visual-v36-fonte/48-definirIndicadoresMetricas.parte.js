/** Define os indicadores e filtros disponiveis. Parte visual de interfaces-v36.js; nao carregar separadamente. */
  const ALIAS = { smoke: 'Smoke', regressao: 'Regressão', 'validacao-ticket': 'Por ticket', 'consulta-jira': 'Consulta Jira', 'analise-mudancas': 'Mudanças', 'run-qase': 'Run Qase', k6: 'k6' };
  const FONTES = { prumo: 'Prumo local', mcp: 'MCP / CLI', jira: 'Jira', qase: 'Qase', github: 'GitHub' };
  const AMBIENTES = { local: 'Local', teste: 'Teste', homologacao: 'Homologação' };
  const RESULTADOS = ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'];
  const COR_RESULTADO = { PASS: '#54d39b', FAIL: '#ff7b8c', BLOCKED: '#e8b84a', NOT_RUN: '#9aa8c2' };
  const PALETA = ['#6ea8ff', '#54d39b', '#ff7b8c', '#e8b84a', '#a78bfa', '#4dc5d2', '#b6bacc', '#faab79'];
  const corDe = (rot, i) => COR_RESULTADO[rot] || PALETA[i % PALETA.length];
  const DEFS = {
    trend: { nome: 'Execuções ao longo do tempo', tipo: 'line', tipos: ['line', 'area', 'bars'], largo: true },
    result: { nome: 'Resultados de execução', tipo: 'donut', tipos: ['donut', 'bars', 'strip'] },
    routines: { nome: 'Tipos de rotina', tipo: 'bars', tipos: ['bars', 'donut', 'strip'] },
    reviews: { nome: 'Achados nas revisões', tipo: 'bars', tipos: ['bars', 'donut', 'strip'], nota: 'totais do núcleo' },
    sources: { nome: 'Fontes de atividade', tipo: 'donut', tipos: ['donut', 'bars', 'strip'] },
    environment: { nome: 'Ambientes', tipo: 'strip', tipos: ['strip', 'donut', 'bars'] },
    time: { nome: 'Duração por tipo', tipo: 'bars', tipos: ['bars', 'strip'], sufixo: ' ms' },
    jira: { nome: 'Consultas e publicações Jira', tipo: 'bars', tipos: ['bars', 'strip'] }
  };
  const NOMES_TIPO = { line: 'Linha', area: 'Área', bars: 'Barras', donut: 'Rosca', strip: 'Faixas' };
