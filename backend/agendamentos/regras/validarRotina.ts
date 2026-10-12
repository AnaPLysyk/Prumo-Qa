/** Confere uma rotina antes de salvar: projeto, capacidade declarada, run do mesmo projeto, k6 e produção bloqueada. */
import { DadosRotina, dadosRotinaSchema } from '../tipos/rotina.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { obterRunLocal } from '../../testes/banco/obterRunLocal.js';

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
