/** Prepara os dados, termos de busca e indice da Ajuda. */
'use strict';
/** Mostra a tela Ajuda e pesquisa a documentação do aplicativo. */
(() => {
  // ======================= Ajuda =======================
  const GRUPOS = [
    ['Primeiros passos', ['01-o-que-e', '02-como-funciona', '03-instalar', '04-vincular', '17-plataforma']],
    ['Fluxos de qualidade', ['15-contextos', '19-testes-e-integracoes', '18-agendamentos', '07-resultados', '08-metricas-e-logs']],
    ['IA e agentes', ['20-assistente-e-agentes', '05-conectar-ia', '06-sem-ia-e-com-ia']],
    ['Suporte', ['09-problemas', '10-perguntas', '16-suporte']],
    ['Segurança e dados', ['21-acesso-e-permissoes', '12-seguranca', '11-privacidade', 'dados', '13-termos']],
    ['Referência técnica', ['versoes', 'atualizacoes', 'integracoes', '14-sobre']]
  ];
  // 2.10.2: busca por palavras e radicais ("atualizar" acha "atualizações"), com sinônimos do vocabulário do Prumo.
  // Cada palavra precisa aparecer no título ou no texto; o título pesa mais na ordem.
  const VAZIAS = new Set(['a', 'o', 'as', 'os', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'para', 'pra', 'por', 'com', 'como', 'que', 'meu', 'minha', 'se', 'eu', 'the', 'to', 'of', 'how', 'and', 'in', 'my']);
  const radical = (p) => (p.length > 4 ? p.slice(0, Math.max(4, p.length - 3)) : p);
  const SINONIMOS = { conec: ['vincul', 'conex'], vincul: ['conec'], reposito: ['pasta', 'projeto'], cria: ['nov', 'propo'], baix: ['instal', 'download'], instal: ['baix'], atualiz: ['versao', 'versoes'], erro: ['falha', 'problema'], falh: ['erro', 'problema'], agend: ['rotina'], ia: ['agente', 'assistente'] };
  const termos = (q) => paraBusca(q).split(/[^a-z0-9.]+/).filter((p) => p.length > 1 && !VAZIAS.has(p)).map((p) => { const r = radical(p); const extra = Object.entries(SINONIMOS).filter(([k]) => r.startsWith(k)).flatMap(([, v]) => v); return [r, ...extra]; });
  const DESCRICAO_PAINEL = {
    atualizacoes: 'Verificar se há versão nova e atualizar com um clique: o Prumo baixa o instalador oficial, confere o SHA-256 e reabre atualizado. Aviso automático, sino e som.',
    versoes: 'Histórico de versões: novidades, segurança, compatibilidade, limitações conhecidas e migração de dados de cada versão.',
    integracoes: 'Integrações técnicas: operações IPC da janela e ferramentas MCP para agentes de IA, com permissões, erros e proteções.',
    dados: 'Privacidade e dados deste computador: pasta de dados, categorias, retenção, exportação e exclusão.'
  };
  function pontuar(it, ts) {
    const titulo = paraBusca(it.title), corpo = paraBusca(it.corpo); let total = 0;
    for (const alternativas of ts) {
      const noTitulo = alternativas.some((a) => titulo.includes(a)); const noCorpo = alternativas.filter((a) => corpo.includes(a));
      if (!noTitulo && !noCorpo.length) return 0;
      total += (noTitulo ? 10 : 0) + Math.min(5, noCorpo.reduce((n, a) => n + corpo.split(a).length - 1, 0));
    }
    // Título curto que a busca cobre inteiro ("atualizar" → "Atualizações") vem antes de página que só cita a palavra.
    const palavras = titulo.split(/[^a-z0-9]+/).filter((p) => p.length > 1 && !VAZIAS.has(p));
    const cobertas = palavras.filter((p) => ts.some((alt) => alt.some((a) => p.startsWith(a)))).length;
    return total + (palavras.length ? Math.round(10 * cobertas / palavras.length) : 0);
  }
  const primeiroAchado = (corpo, ts) => { const c = paraBusca(corpo); return ts.flat().map((a) => [a, c.indexOf(a)]).filter(([, i]) => i >= 0).sort((x, y) => x[1] - y[1])[0]?.[0] || ''; };
  function trecho(corpo, q) {
    const limpo = corpo.replace(/[#`*>]/g, '').replace(/\s+/g, ' '); const i = q ? paraBusca(limpo).indexOf(q) : -1; if (i < 0) return h('p', {}, limpo.slice(0, 160) + (limpo.length > 160 ? '…' : ''));
    const ini = Math.max(0, i - 70), fim = Math.min(limpo.length, i + q.length + 110);
    return h('p', {}, (ini ? '…' : '') + limpo.slice(ini, i), h('mark', {}, limpo.slice(i, i + q.length)), limpo.slice(i + q.length, fim) + (fim < limpo.length ? '…' : ''));
  }
