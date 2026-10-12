/** Cria rascunhos de bug para os casos que falharam na run. */
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { obterRunLocal } from '../banco/obterRunLocal.js';
import { criarProposta } from '../../tickets/regras/criarProposta.js';

/** Rascunhos de bug para cada falha da run (um por caso), com ticket Jira de origem quando houver relação declarada. Nada é publicado. */
export function propostasDeBugs(runLocalId: string, b?: string) {
  const run = obterRunLocal(runLocalId, b); const e = obterEspaco(run.espacoId, b); const criadas = [];
  for (const c of run.casos.filter(k => k.resultado?.status === 'FAIL')) {
    const rel = e.relacoes.find(r => r.de.tipo === 'jira' && r.para.tipo === 'qase' && r.para.id === String(c.casoId)); const origem = rel?.de.id;
    try { criadas.push(criarProposta({ espacoId: run.espacoId, tipo: 'bug', origem: 'PRUMO', dados: { resumo: `[Prumo QA] Falha: ${c.titulo}`.slice(0, 255), descricao: `Caso do Qase: ${c.casoId}\nRun do Qase: ${run.runIdRemoto ?? '(ainda não criada)'}\nAmbiente: ${run.ambiente}\nResultado: ${c.resultado!.status} (${c.resultado!.granularidade === 'RODADA' ? 'escopo da rodada' : 'cenário'})\nEvidência local: ${c.resultado!.evidenciaId ?? '—'}\n\n${c.resultado!.comentario}`, ...(origem && /^[A-Z][A-Z0-9_]*-\d+$/.test(origem) ? { origem } : {}), rotulos: ['prumo-qa', 'regressao'] }, falhaDeOrigem: { runLocalId, casoId: c.casoId } }, b)); } catch (er) { if (!/DUPLICATE_PROPOSAL/.test((er as Error).message)) throw er; }
  }
  return criadas;
}
