/** Desenha o mapa de ligações do projeto (Jira, Qase, repositório, tickets, casos, runs, execuções e evidências) e mostra o que falta ligar. */
import { listarOperacoes } from '../../conexoes/banco/operacoes.js';
import { obterEspaco } from '../../projetos/banco/projetos.js';
import { GrafoDeVinculos, LacunaDoMapa } from '../tipos/catalogoDeTestes.js';
import { Espaco } from '../../projetos/contratos.js';
import { catalogoDeTestes } from '../servicoClassificacao.js';
import { listarRunsLocais } from '../banco/runs.js';
import { listarTrabalhos } from '../../agendamentos/banco/fila.js';
import { listarPropostas } from '../../tickets/banco/tickets.js';
import { listarRepositorioLocal } from '../servicoCasos.js';

export function mapaDeVinculos(espacoId: string, b?: string) {
  const e = obterEspaco(espacoId, b); const g = novoGrafoDeVinculos(); const avisos: string[] = [];
  // Cada etapa acrescenta ligações de uma fonte: cadastro, código, runs, execuções e propostas publicadas.
  const prumo = ligarCadastroDoProjeto(g, e);
  ligarCasosLocais(g, espacoId, prumo, b);
  ligarTestesDoCodigo(g, e, avisos);
  ligarRunsDoProjeto(g, espacoId, prumo, b);
  ligarExecucoesDeTickets(g, espacoId, b);
  ligarPropostasPublicadas(g, espacoId, prumo, b);
  return { avisos, projeto: { id: e.id, nome: e.nome }, nos: [...g.nos.values()], arestas: g.arestas, lacunas: lacunasDoMapa(g),
    operacoesRecentes: listarOperacoes(espacoId, 20, b).map(o => ({ id: o.id, operacao: o.operacao, estado: o.estado, resumo: o.resumo, remoto: o.remoto, em: o.atualizadoEm })),
    aviso: 'Mostra relações cadastradas, registradas por fluxos do Prumo, observadas em execuções ou lidas estaticamente no código. Uma relação não prova cobertura nem requisito aprovado; ausência de relação não prova ausência de teste.' };
}

/** Começa um grafo vazio de ligações; acrescentar um nó ou uma ligação que já existe não duplica. */
function novoGrafoDeVinculos(): GrafoDeVinculos {
  const g: GrafoDeVinculos = { nos: new Map(), arestas: [], no: () => '', ar: () => undefined };
  g.no = (n) => { if (!g.nos.has(n.id)) g.nos.set(n.id, n); return n.id; };
  g.ar = (a) => { if (!g.arestas.some(x => x.de === a.de && x.para === a.para && x.tipo === a.tipo)) g.arestas.push(a); };
  return g;
}

/** Põe no mapa o que a pessoa cadastrou: o projeto, a pasta de automação, os serviços vinculados e as relações declaradas (as de vínculo removido aparecem como desatualizadas). */
/** Devolve o id do nó do projeto, ponto de partida das demais ligações. */
function ligarCadastroDoProjeto(g: GrafoDeVinculos, e: Espaco) {
  const prumo = g.no({ id: 'prumo', tipo: 'projeto', rotulo: e.nome, detalhe: 'ID ' + e.id });
  if (e.pastaLocal) g.ar({ de: prumo, para: g.no({ id: 'pasta', tipo: 'pasta', rotulo: 'Pasta de automação', detalhe: e.pastaLocal }), tipo: 'possui', origem: 'DECLARADO_PELO_USUARIO' });
  for (const v of e.vinculos) g.ar({ de: prumo, para: g.no({ id: 'srv:' + v.servico, tipo: 'servico', rotulo: `${v.servico}: ${v.recurso.chave}`, detalhe: `ID ${v.recurso.id} · ${v.recurso.instancia}`, estado: v.estado }), tipo: 'vinculado a', origem: 'DECLARADO_PELO_USUARIO' });
  // Relações históricas preservam a identidade do vínculo removido. Um ID igual
  // no recurso atual não transforma essa associação em relação vigente.
  const vigente = (r: { vinculoId?: string }) => !r.vinculoId || e.vinculos.some(v => v.id === r.vinculoId);
  const idRef = (r: { tipo: string; id: string; vinculoId?: string }) => `${r.tipo}:${r.id}${vigente(r) ? '' : ':vinculo:' + r.vinculoId}`;
  const noDaRef = (r: { tipo: string; id: string; vinculoId?: string }) => g.no({ id: idRef(r), tipo: r.tipo, rotulo: rotuloDaReferencia(r), ...(!vigente(r) ? { estado: 'DESATUALIZADO', detalhe: 'Vínculo original removido: ' + r.vinculoId } : {}) });
  for (const rel of e.relacoes) { const a = noDaRef(rel.de); const c = noDaRef(rel.para); g.ar({ de: a, para: c, tipo: 'relacionado a', origem: rel.origemRegistro, nota: rel.justificativa }); }
  return prumo;
}

/** Nome legível de uma referência do mapa (ex.: "Caso Qase 12", "Ticket ABC-3", "Commit 1a2b3c4"). */
function rotuloDaReferencia(r: { tipo: string; id: string }) {
  if (r.tipo === 'caso-local') return `Caso local ${r.id.slice(0, 8)}`;
  if (r.tipo === 'ticket-local') return `Ticket local ${r.id.slice(0, 8)}`;
  if (r.tipo === 'qase') return `Caso Qase ${r.id}`;
  if (r.tipo === 'jira') return `Ticket ${r.id}`;
  if (r.tipo === 'jira-bug') return `Bug ${r.id}`;
  if (r.tipo === 'automacao') return `Automação ${r.id}`;
  if (r.tipo === 'qase-run') return `Run Qase ${r.id}`;
  if (r.tipo === 'qase-defeito') return `Defeito Qase ${r.id}`;
  if (r.tipo === 'github-pr') return `PR ${r.id}`;
  if (r.tipo === 'github-commit') return `Commit ${r.id.slice(0, 7)}`;
  if (r.tipo === 'github-issue') return `Issue #${r.id}`;
  if (r.tipo === 'run') return `Run local ${r.id.slice(0, 8)}`;
  return `${r.tipo} ${r.id}`;
}

/** Põe no mapa o que se lê no código da pasta: funcionalidades, cenários e casos do Qase anotados nos testes (leitura estática; não prova execução). */
function ligarTestesDoCodigo(g: GrafoDeVinculos, e: Espaco, avisos: string[]) {
  if (!e.pastaLocal) return;
  try {
    const catalogo = catalogoDeTestes(e.pastaLocal);
    if (catalogo.truncado) avisos.push('Catálogo limitado; mapa parcial.');
    const qase = e.vinculos.find(v => v.servico === 'qase');
    for (const f of catalogo.features) {
      const fid = g.no({ id: 'feature:' + f.arquivo, tipo: 'feature', rotulo: f.nome, detalhe: f.arquivo });
      g.ar({ de: 'pasta', para: fid, tipo: 'contém feature', origem: 'OBSERVADO_NO_CODIGO' });
      for (const c of f.testes) {
        const cid = g.no({ id: 'automacao:' + f.arquivo + ':' + c.linha, tipo: 'automacao', rotulo: c.titulo, detalhe: `${f.arquivo}:${c.linha} · ${c.tipo} · leitura estática` });
        g.ar({ de: fid, para: cid, tipo: 'contém cenário', origem: 'OBSERVADO_NO_CODIGO' });
        if (qase) for (const anotacao of c.qase ?? []) {
          const prefixo = qase.recurso.chave + '-';
          const id = anotacao.startsWith(prefixo) ? anotacao.slice(prefixo.length) : anotacao;
          if (!/^\d+$/.test(id)) continue;
          const qid = g.no({ id: 'qase:' + id, tipo: 'qase', rotulo: 'Caso Qase ' + id, detalhe: 'Referência no código; existência remota não consultada' });
          g.ar({ de: qid, para: cid, tipo: 'anota implementação', origem: 'OBSERVADO_NO_CODIGO', nota: 'Anotação explícita; não comprova execução ou cobertura.' });
        }
      }
    }
  } catch { avisos.push('Catálogo indisponível; mapa parcial.'); }
}

/** Põe no mapa as runs do projeto, os casos que cada uma inclui e as evidências dos resultados registrados pelo Prumo. */
function ligarRunsDoProjeto(g: GrafoDeVinculos, espacoId: string, prumo: string, b?: string) {
  for (const r of listarRunsLocais(espacoId, b)) {
    const rid = g.no({ id: 'run:' + r.id, tipo: 'run', rotulo: `Run "${r.titulo}"`, detalhe: r.runIdRemoto ? `Qase #${r.runIdRemoto}` : 'ainda não criada no Qase', estado: r.estado });
    g.ar({ de: prumo, para: rid, tipo: 'possui', origem: 'REGISTRADO_PELO_PRUMO' });
    for (const c of r.casos) {
      const cid = g.no({ id: `qase:${c.casoId}`, tipo: 'qase', rotulo: `Caso Qase ${c.casoId}`, detalhe: c.titulo, estado: c.resultado?.status });
      g.ar({ de: rid, para: cid, tipo: 'inclui', origem: 'REGISTRADO_PELO_PRUMO' });
      if (c.resultado?.evidenciaId) g.ar({ de: cid, para: g.no({ id: 'evidencia:' + c.resultado.evidenciaId, tipo: 'evidencia', rotulo: 'Evidência ' + c.resultado.evidenciaId.slice(0, 8), detalhe: `${c.resultado.origem} · escopo ${c.resultado.granularidade}` }), tipo: 'resultado de', origem: 'OBSERVADO' });
    }
  }
}

/** Põe no mapa os tickets do Jira validados por uma execução agendada, ligados à evidência dessa execução. */
function ligarExecucoesDeTickets(g: GrafoDeVinculos, espacoId: string, b?: string) {
  for (const t of listarTrabalhos(b).filter(x => x.espacoId === espacoId && x.ticket && x.resultado?.evidenciaId)) {
    const ticket = g.no({ id: 'jira:' + t.ticket, tipo: 'jira', rotulo: 'Ticket ' + t.ticket });
    const evidencia = g.no({ id: 'evidencia:' + t.resultado!.evidenciaId, tipo: 'evidencia', rotulo: 'Evidência ' + t.resultado!.evidenciaId!.slice(0, 8), detalhe: `${t.tipo} · ${t.resultado!.status}` });
    g.ar({ de: ticket, para: evidencia, tipo: 'validado por execução', origem: 'OBSERVADO' });
  }
}

/** O cadastro offline é parte do repositório local: mostrar casos e tickets mesmo quando ainda não há vínculo. */
function ligarCasosLocais(g: GrafoDeVinculos, espacoId: string, prumo: string, b?: string) {
  for (const caso of listarRepositorioLocal(espacoId, b).casos) {
    const id = 'caso-local:' + caso.id;
    g.no({ id, tipo: 'caso-local', rotulo: caso.titulo, detalhe: 'Caso local · Prumo' });
    const no = g.nos.get(id);
    if (no) { no.rotulo = caso.titulo; no.detalhe = 'Caso local · Prumo'; }
    g.ar({ de: prumo, para: id, tipo: 'possui registro local', origem: 'REGISTRADO_PELO_PRUMO' });
  }
  // Tickets locais ainda têm cadastro próprio no fluxo de propostas, sem Qase ou Jira remoto.
  for (const p of listarPropostas(espacoId, b).filter(x => x.tipo === 'bug' && x.origem === 'PESSOA' && x.estado !== 'DESCARTADA' && !x.remoto)) {
    const id = 'ticket-local:' + p.id;
    g.no({ id, tipo: 'ticket-local', rotulo: p.titulo, detalhe: 'Ticket local · Prumo' });
    const no = g.nos.get(id);
    if (no) { no.rotulo = p.titulo; no.detalhe = 'Ticket local · Prumo'; }
    g.ar({ de: prumo, para: id, tipo: 'possui registro local', origem: 'REGISTRADO_PELO_PRUMO' });
  }
}

/** Põe no mapa os casos e bugs que o Prumo publicou a partir de propostas, e a falha de caso que originou cada bug. */
function ligarPropostasPublicadas(g: GrafoDeVinculos, espacoId: string, prumo: string, b?: string) {
  for (const p of listarPropostas(espacoId, b).filter(x => (x.estado === 'PUBLICADA' || x.estado === 'VINCULADA') && x.remoto?.chave)) {
    const bug = p.tipo === 'bug';
    const rid = g.no({ id: `${bug ? 'jira-bug' : 'qase'}:${p.remoto!.chave}`, tipo: bug ? 'jira-bug' : 'qase', rotulo: bug ? `Bug ${p.remoto!.chave}` : `Caso ${p.remoto!.chave}`, detalhe: p.titulo });
    g.ar({ de: prumo, para: rid, tipo: 'publicado pelo Prumo', origem: 'REGISTRADO_PELO_PRUMO' });
    if (p.falhaDeOrigem) g.ar({ de: rid, para: `qase:${p.falhaDeOrigem.casoId}`, tipo: 'aberto por falha de', origem: 'REGISTRADO_PELO_PRUMO' });
  }
}

/** Aponta o que falta ligar: caso do Qase sem automação, caso sem ticket do Jira e ticket sem caso (só ausência de cadastro, não de teste). */
function lacunasDoMapa(g: GrafoDeVinculos): LacunaDoMapa[] {
  const lacunas: LacunaDoMapa[] = [];
  const liga = (id: string, tipo: string, sentido: 'de' | 'para') => g.arestas.some(a => a[sentido] === id && g.nos.get(sentido === 'de' ? a.para : a.de)?.tipo === tipo);
  for (const c of [...g.nos.values()].filter(n => n.tipo === 'qase' || n.tipo === 'caso-local')) {
    if (c.tipo === 'qase' && !liga(c.id, 'automacao', 'de')) lacunas.push({ tipo: 'CASO_SEM_AUTOMACAO', id: c.id, mensagem: `${c.rotulo} não tem automação associada no Prumo (pode ser um caso manual).` });
    if (!['jira','ticket-local'].some(t => liga(c.id, t, 'para') || liga(c.id, t, 'de'))) lacunas.push({ tipo: 'CASO_SEM_TICKET', id: c.id, mensagem: `${c.rotulo} não tem ticket vinculado no Prumo.` });
  }
  for (const t of [...g.nos.values()].filter(n => n.tipo === 'jira' || n.tipo === 'ticket-local')) if (!['qase', 'caso-local'].some(tipo => liga(t.id, tipo, 'de') || liga(t.id, tipo, 'para'))) lacunas.push({ tipo: 'TICKET_SEM_CASO', id: t.id, mensagem: `${t.rotulo} não tem caso Qase ou local associado no Prumo.` });
  return lacunas;
}
