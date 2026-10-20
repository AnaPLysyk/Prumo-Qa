/** Verifica os limites e capacidades disponíveis para rotinas agendadas. */
import { capacidadeDoK6 } from "../servicoK6.js";
import { Rotina, DadosRotina, dadosRotinaSchema } from "../tipos/rotina.js";
import { obterEspaco } from "../../projetos/repositorio.js";
import { obterRunLocal } from "../../testes/repositorioRuns.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { carregarProjeto } from "../../compartilhado/projeto/carregarProjeto.js";

export function capacidadesDaRotina(r: Rotina, base?: string): string[] {
  if (r.tipo === 'smoke' || r.tipo === 'regressao') return r.capability ? [r.capability] : [];
  if (r.tipo === 'k6') return r.k6 ? [capacidadeDoK6(r.k6)] : [];
  if (r.tipo === 'run-qase') { try { return [...new Set(obterRunLocal(r.runLocalId!, base).casos.map(c => c.capability).filter((c): c is string => !!c))]; } catch { return []; } }
  if (r.tipo === 'validacao-ticket') { const e = obterEspaco(r.espacoId, base); return [...new Set(e.relacoes.filter(x => x.de.tipo === 'jira' && x.de.id === r.ticket && x.para.tipo === 'automacao').map(x => x.para.id))].slice(0, 5); }
  return [];
}

/** Valida o que o esquema sozinho não vê: projeto existe, pasta de automação, capability declarada e vínculos exigidos. */
export async function validarRotina(dados: DadosRotina, base?: string) {
  const d = dadosRotinaSchema.parse(dados); const e = obterEspaco(d.espacoId, base);
  if (d.tipo === 'run-qase') { const run = obterRunLocal(d.runLocalId!, base); if (run.espacoId !== d.espacoId) throw new ErroQa('RUN_PROJECT_MISMATCH', 'A run pertence a outro projeto.'); if (!run.runIdRemoto) throw new ErroQa('RUN_NOT_CREATED', 'Crie a run no Qase antes de agendá-la.'); }
  if (['smoke', 'regressao', 'validacao-ticket', 'k6', 'run-qase'].includes(d.tipo) && !e.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Este tipo de rotina executa testes e precisa de uma pasta de automação vinculada ao projeto.');
  if (d.capability && e.pastaLocal) { const p = await carregarProjeto(e.pastaLocal); if (!Object.hasOwn(p.manifesto.commands, d.capability)) throw new ErroQa('CAPABILITY_NOT_ALLOWED', `A capability "${d.capability}" não está declarada no contrato do projeto.`); }
  if (d.tipo === 'consulta-jira' && !e.vinculos.some(v => v.servico === 'jira')) throw new ErroQa('JIRA_LINK_REQUIRED', 'Vincule um projeto Jira antes de agendar consultas.');
  if (d.tipo === 'analise-mudancas' && !e.vinculos.some(v => v.servico === 'github')) throw new ErroQa('GITHUB_LINK_REQUIRED', 'Vincule um repositório GitHub antes de agendar a análise de mudanças.');
  return d;
}
