/** Constrói o mapa de vínculos declarados e observados de um projeto. */
import { obterEspaco } from '../../espacos.js';
import { listarRunsLocais } from '../../fluxoQase.js';
import { listarPropostas } from '../../propostas.js';
import { listarTrabalhos } from '../../fila.js';
import { listarOperacoes } from '../../operacoesExternas.js';
import { catalogoDeTestes } from '../../catalogoTestes.js';

/**
 * Mapa de vínculos do projeto (2.9): Projeto Prumo <-> Jira <-> Qase <-> repositório <-> ticket <-> caso <-> plano <-> run <-> execução <-> evidência.
 * Só mostra o que foi CADASTRADO pela pessoa, REGISTRADO por um fluxo do Prumo OBSERVADO numa execução ou OBSERVADO_NO_CODIGO por leitura estática. Relação cadastrada não prova cobertura;
 * "lacunas" listam apenas ausência de cadastro. Nada é deduzido por semelhança de nomes.
 */
type No = { id: string; tipo: string; rotulo: string; detalhe?: string; estado?: string };
type Aresta = { de: string; para: string; tipo: string; origem: 'DECLARADO_PELO_USUARIO' | 'REGISTRADO_PELO_PRUMO' | 'OBSERVADO' | 'OBSERVADO_NO_CODIGO'; nota?: string };
export function mapaDeVinculos(espacoId: string, b?: string) {
  const e = obterEspaco(espacoId, b); const nos = new Map<string, No>(); const arestas: Aresta[] = [];
  const no = (n: No) => { if (!nos.has(n.id)) nos.set(n.id, n); return n.id; }; const ar = (a: Aresta) => { if (!arestas.some(x => x.de === a.de && x.para === a.para && x.tipo === a.tipo)) arestas.push(a); };
  const prumo = no({ id: 'prumo', tipo: 'projeto', rotulo: e.nome, detalhe: 'ID ' + e.id });
  if (e.pastaLocal) ar({ de: prumo, para: no({ id: 'pasta', tipo: 'pasta', rotulo: 'Pasta de automação', detalhe: e.pastaLocal }), tipo: 'possui', origem: 'DECLARADO_PELO_USUARIO' });
  for (const v of e.vinculos) ar({ de: prumo, para: no({ id: 'srv:' + v.servico, tipo: 'servico', rotulo: `${v.servico}: ${v.recurso.chave}`, detalhe: `ID ${v.recurso.id} · ${v.recurso.instancia}`, estado: v.estado }), tipo: 'vinculado a', origem: 'DECLARADO_PELO_USUARIO' });
  // Relações históricas preservam a identidade do vínculo removido. Um ID igual
  // no recurso atual não transforma essa associação em relação vigente.
  const vigente = (r: { vinculoId?: string }) => !r.vinculoId || e.vinculos.some(v => v.id === r.vinculoId);
  const idRef = (r: { tipo: string; id: string; vinculoId?: string }) => `${r.tipo}:${r.id}${vigente(r) ? '' : ':vinculo:' + r.vinculoId}`;
  const rotulo = (r: { tipo: string; id: string }) => r.tipo === 'qase' ? `Caso Qase ${r.id}` : r.tipo === 'jira' ? `Ticket ${r.id}` : r.tipo === 'jira-bug' ? `Bug ${r.id}` : r.tipo === 'automacao' ? `Automação ${r.id}` : r.tipo === 'qase-run' ? `Run Qase ${r.id}` : r.tipo === 'qase-defeito' ? `Defeito Qase ${r.id}` : r.tipo === 'github-pr' ? `PR ${r.id}` : r.tipo === 'github-commit' ? `Commit ${r.id.slice(0, 7)}` : `${r.tipo} ${r.id}`;
  for (const rel of e.relacoes) { const a = no({ id: idRef(rel.de), tipo: rel.de.tipo, rotulo: rotulo(rel.de), ...(!vigente(rel.de) ? { estado: 'DESATUALIZADO', detalhe: 'Vínculo original removido: ' + rel.de.vinculoId } : {}) }); const c = no({ id: idRef(rel.para), tipo: rel.para.tipo, rotulo: rotulo(rel.para), ...(!vigente(rel.para) ? { estado: 'DESATUALIZADO', detalhe: 'Vínculo original removido: ' + rel.para.vinculoId } : {}) }); ar({ de: a, para: c, tipo: 'relacionado a', origem: rel.origemRegistro, nota: rel.justificativa }); }
  const avisos: string[] = [];
  if (e.pastaLocal) {
    try {
      const catalogo = catalogoDeTestes(e.pastaLocal);
      if (catalogo.truncado) avisos.push('Catálogo limitado; mapa parcial.');
      const qase = e.vinculos.find(v => v.servico === 'qase');
      for (const f of catalogo.features) {
        const fid = no({ id: 'feature:' + f.arquivo, tipo: 'feature', rotulo: f.nome, detalhe: f.arquivo });
        ar({ de: 'pasta', para: fid, tipo: 'contém feature', origem: 'OBSERVADO_NO_CODIGO' });
        for (const c of f.testes) {
          const cid = no({ id: 'automacao:' + f.arquivo + ':' + c.linha, tipo: 'automacao', rotulo: c.titulo, detalhe: `${f.arquivo}:${c.linha} · ${c.tipo} · leitura estática` });
          ar({ de: fid, para: cid, tipo: 'contém cenário', origem: 'OBSERVADO_NO_CODIGO' });
          if (qase) for (const anotacao of c.qase ?? []) {
            const prefixo = qase.recurso.chave + '-';
            const id = anotacao.startsWith(prefixo) ? anotacao.slice(prefixo.length) : anotacao;
            if (!/^\d+$/.test(id)) continue;
            const qid = no({ id: 'qase:' + id, tipo: 'qase', rotulo: 'Caso Qase ' + id, detalhe: 'Referência no código; existência remota não consultada' });
            ar({ de: qid, para: cid, tipo: 'anota implementação', origem: 'OBSERVADO_NO_CODIGO', nota: 'Anotação explícita; não comprova execução ou cobertura.' });
          }
        }
      }
    } catch { avisos.push('Catálogo indisponível; mapa parcial.'); }
  }
  const runs = listarRunsLocais(espacoId, b);
  for (const r of runs) {
    const rid = no({ id: 'run:' + r.id, tipo: 'run', rotulo: `Run "${r.titulo}"`, detalhe: r.runIdRemoto ? `Qase #${r.runIdRemoto}` : 'ainda não criada no Qase', estado: r.estado }); ar({ de: prumo, para: rid, tipo: 'possui', origem: 'REGISTRADO_PELO_PRUMO' });
    for (const c of r.casos) {
      const cid = no({ id: `qase:${c.casoId}`, tipo: 'qase', rotulo: `Caso Qase ${c.casoId}`, detalhe: c.titulo, estado: c.resultado?.status }); ar({ de: rid, para: cid, tipo: 'inclui', origem: 'REGISTRADO_PELO_PRUMO' });
      if (c.resultado?.evidenciaId) ar({ de: cid, para: no({ id: 'evidencia:' + c.resultado.evidenciaId, tipo: 'evidencia', rotulo: 'Evidência ' + c.resultado.evidenciaId.slice(0, 8), detalhe: `${c.resultado.origem} · escopo ${c.resultado.granularidade}` }), tipo: 'resultado de', origem: 'OBSERVADO' });
    }
  }
  for (const t of listarTrabalhos(b).filter(x => x.espacoId === espacoId && x.ticket && x.resultado?.evidenciaId)) ar({ de: no({ id: 'jira:' + t.ticket, tipo: 'jira', rotulo: 'Ticket ' + t.ticket }), para: no({ id: 'evidencia:' + t.resultado!.evidenciaId, tipo: 'evidencia', rotulo: 'Evidência ' + t.resultado!.evidenciaId!.slice(0, 8), detalhe: `${t.tipo} · ${t.resultado!.status}` }), tipo: 'validado por execução', origem: 'OBSERVADO' });
  for (const p of listarPropostas(espacoId, b).filter(x => x.estado === 'PUBLICADA' && x.remoto?.chave)) { const rid = no({ id: `${p.tipo === 'bug' ? 'jira-bug' : 'qase'}:${p.remoto!.chave}`, tipo: p.tipo === 'bug' ? 'jira-bug' : 'qase', rotulo: p.tipo === 'bug' ? `Bug ${p.remoto!.chave}` : `Caso ${p.remoto!.chave}`, detalhe: p.titulo }); ar({ de: prumo, para: rid, tipo: 'publicado pelo Prumo', origem: 'REGISTRADO_PELO_PRUMO' }); if (p.falhaDeOrigem) ar({ de: rid, para: `qase:${p.falhaDeOrigem.casoId}`, tipo: 'aberto por falha de', origem: 'REGISTRADO_PELO_PRUMO' }); }
  const casos = [...nos.values()].filter(n => n.tipo === 'qase'); const lacunas: { tipo: string; id: string; mensagem: string }[] = [];
  const liga = (id: string, tipo: string, sentido: 'de' | 'para') => arestas.some(a => a[sentido] === id && nos.get(sentido === 'de' ? a.para : a.de)?.tipo === tipo);
  for (const c of casos) { if (!liga(c.id, 'automacao', 'de')) lacunas.push({ tipo: 'CASO_SEM_AUTOMACAO', id: c.id, mensagem: `${c.rotulo} não tem automação associada no Prumo (pode ser um caso manual).` }); if (!liga(c.id, 'jira', 'para') && !liga(c.id, 'jira', 'de')) lacunas.push({ tipo: 'CASO_SEM_TICKET', id: c.id, mensagem: `${c.rotulo} não tem ticket Jira associado no Prumo.` }); }
  for (const t of [...nos.values()].filter(n => n.tipo === 'jira')) if (!liga(t.id, 'qase', 'de') && !liga(t.id, 'qase', 'para')) lacunas.push({ tipo: 'TICKET_SEM_CASO', id: t.id, mensagem: `${t.rotulo} não tem caso do Qase associado no Prumo.` });
  return { avisos, projeto: { id: e.id, nome: e.nome }, nos: [...nos.values()], arestas, lacunas, operacoesRecentes: listarOperacoes(espacoId, 20, b).map(o => ({ id: o.id, operacao: o.operacao, estado: o.estado, resumo: o.resumo, remoto: o.remoto, em: o.atualizadoEm })),
    aviso: 'Mostra relações cadastradas, registradas por fluxos do Prumo, observadas em execuções ou lidas estaticamente no código. Uma relação não prova cobertura nem requisito aprovado; ausência de relação não prova ausência de teste.' };
}
