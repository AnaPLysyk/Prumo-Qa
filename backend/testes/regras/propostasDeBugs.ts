/** Elabora rascunhos de bugs para casos que falharam numa run, sem publicá-los. */
import { obterEspaco } from '../../projetos/banco/projetos.js';
import { obterRunLocal } from '../banco/runs.js';
import { criarProposta } from '../../tickets/servicoPropostas.js';
import { classificacoesDeFalha } from '../../tickets/contratos.js';

type ClassificacaoDeFalha = typeof classificacoesDeFalha[number];
const prefixo = {
  PRODUTO: 'Bug de produto',
  OUTRO_BUG: 'Outro bug',
  MELHORIA: 'Melhoria'
} as const;

/** Gera um rascunho por falha e inclui a origem Jira somente quando vinculada e válida. */
export function propostasDeBugs(
  runLocalId: string,
  base?: string,
  classificacao?: ClassificacaoDeFalha
) {
  const run = obterRunLocal(runLocalId, base);
  const espaco = obterEspaco(run.espacoId, base);
  const propostas = [];

  for (const caso of run.casos.filter(item => item.resultado?.status === 'FAIL')) {
    const relacao = espaco.relacoes.find(item =>
      item.de.tipo === 'jira' &&
      item.para.tipo === 'qase' &&
      item.para.id === String(caso.casoId)
    );
    const origemJira = relacao?.de.id;
    const titulo = classificacao ? prefixo[classificacao] : 'Falha';
    const resultado = caso.resultado!;
    const descricao = [
      'Caso do Qase: ' + caso.casoId,
      'Run do Qase: ' + (run.runIdRemoto ?? '(ainda não criada)'),
      'Ambiente: ' + run.ambiente,
      'Resultado: ' + resultado.status + ' (' +
        (resultado.granularidade === 'RODADA' ? 'escopo da rodada' : 'cenário') + ')',
      'Evidência local: ' + (resultado.evidenciaId ?? '—'),
      '',
      resultado.comentario
    ].join('\n');

    try {
      propostas.push(criarProposta({
        espacoId: run.espacoId,
        tipo: 'bug',
        origem: 'PRUMO',
        dados: {
          ...(classificacao ? { classificacao } : {}),
          resumo: ('[Prumo QA] ' + titulo + ': ' + caso.titulo).slice(0, 255),
          descricao,
          ...(origemJira && /^[A-Z][A-Z0-9_]*-\d+$/.test(origemJira)
            ? { origem: origemJira }
            : {}),
          rotulos: ['prumo-qa', 'regressao']
        },
        falhaDeOrigem: { runLocalId, casoId: caso.casoId }
      }, base));
    } catch (erro) {
      // A duplicação esperada não impede rascunhos para os demais casos.
      if (!/DUPLICATE_PROPOSAL/.test((erro as Error).message)) throw erro;
    }
  }
  return propostas;
}
