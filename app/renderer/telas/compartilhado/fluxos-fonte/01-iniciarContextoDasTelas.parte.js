/** Inicia o escopo compartilhado das telas. Parte da origem gerada de fluxos-v40.js; nao carregar separadamente. */
  const vinc = (e, s) => e?.vinculos.find((v) => v.servico === s) || null;
  const memoria = (tela, id) => ((estado.ds ||= {})[tela + ':' + id] ||= {});
  const quando = (iso) => (iso ? hora(iso) : '—');
  const semProjetoDS = (titulo) => [DS.cabecalho({ titulo }), DS.estadoTela('vazio', 'Nenhum projeto selecionado', 'Selecione ou crie um projeto para continuar.', [DS.acao('Ir para Projetos', () => mostrar('projetos'))])];
  const relacoesDe = (e, tipos, id) => (e?.relacoes || []).filter((r) => [r.de, r.para].some((x) => tipos.includes(x.tipo) && String(x.id) === String(id)));
  const outroLado = (r, tipos, id) => ([r.de, r.para].find((x) => !(tipos.includes(x.tipo) && String(x.id) === String(id))) || r.para);
  const vigente = (e, ref) => !ref.vinculoId || e.vinculos.some((v) => v.id === ref.vinculoId);
  const servicoDoTipo = { jira: 'jira', 'jira-bug': 'jira', qase: 'qase', 'qase-run': 'qase', 'qase-defeito': 'qase', github: 'github', 'github-pr': 'github', 'github-commit': 'github', automacao: 'local', evidencia: 'local', execucao: 'local', run: 'prumo', contexto: 'prumo', pasta: 'local', projeto: 'prumo', servico: 'prumo' };
  const escritaDesligada = (servico) => DS.notaPermissao(tr('Escrita no {s} desligada. Habilite em Conexões.', { s: DS.nomesServico[servico] }));
  const atualizarEspaco = async (e) => { const r = await api.espacoObter(e.id); if (r.ok) { estado.espaco = r.data; return r.data; } return e; };
  const resultadoOp = (destino, r) => { if (r && destino?.isConnected) destino.append(painelResultado(r)); return r; };
  const tomStatusJira = (s) => ({ done: 'ok', indeterminate: 'info', new: null }[s?.statusCategory?.key] ?? null);

  /** Nós clicáveis da rastreabilidade e das relações dentro dos modais. */
