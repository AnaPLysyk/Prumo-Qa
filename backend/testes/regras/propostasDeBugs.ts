/** Achados, comentários e propostas Jira — arquivos relacionados agrupados para manutenção. */
import { obterEspaco } from "../../projetos/banco/projetos.js";
import { obterRunLocal } from "../banco/runs.js";
import { criarProposta } from "../../tickets/servicoPropostas.js";
import { classificacoesDeFalha } from "../../tickets/contratos.js";
import { CasoTeste, QASE_PADROES } from "../tipos/catalogoDeTestes.js";
import { Trabalho } from "../../agendamentos/tipos/fila.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { Comentario, rotulo } from "../tipos/escritaQase.js";

// ── propostasDeBugs ──
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

// ── anotarQase ──
export function idsQase(trecho: string): string[] {
  const ids = new Set<string>();
  for (const re of QASE_PADROES) for (const m of trecho.matchAll(re)) {
    const projeto = m.groups?.projeto; const lista = m.groups?.ids ?? '';
    for (const bruto of lista.split(/[\s,]+/)) { const n = bruto.replace(/['"[\]]/g, ''); if (/^\d{1,9}$/.test(n)) ids.add(projeto ? projeto + '-' + n : n); }
  }
  return [...ids].slice(0, 20);
}

export function anotarQase(texto: string, casos: CasoTeste[]) {
  const linhas = texto.split(/\r?\n/); const ordem = [...casos].sort((a, b) => a.linha - b.linha);
  ordem.forEach((c, i) => {
    const fim = i + 1 < ordem.length ? ordem[i + 1]!.linha - 1 : linhas.length; c.fim = Math.max(c.linha, fim);
    // A closing line of the preceding test may contain qase.id(). Never inherit it.
    let inicio = c.linha - 1;
    while (inicio > 0 && /^\s*(?:@|\/\/|#|\/\*|\*)/.test(linhas[inicio - 1]!)) inicio--;
    let final = c.fim;
    if (i + 1 < ordem.length) while (final > c.linha && /^\s*(?:@|\/\/|#|\/\*|\*)/.test(linhas[final - 1]!)) final--;
    const ids = idsQase(linhas.slice(inicio, final).join('\n')); if (ids.length) c.qase = ids;
    c.tags = c.tags.filter((t) => !/^qase/.test(t));
  });
}

// ── montarComentario ──
const marcadorDaExecucao = (trabalhoId: string) => `Prumo-Execução: ${trabalhoId}`;

/** Monta um parágrafo do comentário no formato do Jira. */

const paragrafoDoComentario = (t: string) => ({ type: 'paragraph', content: [{ type: 'text', text: t }] });

export function montarComentario(t: Trabalho, nomeProjeto: string): Comentario {
  const res = t.resultado; if (!res || (res.status !== 'PASS' && res.status !== 'FAIL')) throw new Error('JIRA_COMMENT_NOT_APPLICABLE');
  if (!t.ticket) throw new Error('JIRA_TICKET_REQUIRED');
  const c = res.contagem ?? { pass: 0, fail: 0, blocked: 0, notRun: 0 }; const total = c.pass + c.fail + c.blocked + c.notRun;
  const marcador = marcadorDaExecucao(t.id);
  const veredito = res.status === 'FAIL'
    ? 'Validação reprovada nos cenários executados.'
    : total ? 'Cenários executados aprovados. Cobertura parcial: isto não representa aprovação do ticket inteiro.' : 'Rodada concluída com exit code 0, sem cenários individuais reportados; não há resultado por cenário.';
  const quando = t.terminadoEm ?? t.iniciadoEm ?? t.criadoEm;
  const linhas = [
    'PRUMO QA — RESULTADO DE VALIDAÇÃO', '',
    `Ticket: ${t.ticket}`, `Projeto Prumo: ${nomeProjeto}`, `Tipo: ${rotulo[t.tipo] ?? t.tipo}`, `Ambiente: ${t.ambiente}`, `Data: ${quando}`, `Execução: ${t.id}`, '',
    total ? `${total} cenário(s) executado(s): ${c.pass} PASS, ${c.fail} FAIL, ${c.blocked} BLOCKED, ${c.notRun} NOT_RUN` : 'Cenários individuais: nenhum reportado pelo runner',
  ];
  if (res.detalhes) linhas.push('', 'Falhas:', ...res.detalhes.split('\n').slice(0, 5).map(x => x.slice(0, 300)));
  linhas.push('', `Evidência: referência local da execução${res.evidenciaId ? ` ${res.evidenciaId}` : ''} (arquivo no projeto, não anexado).`, '', `Resultado: ${veredito}`, 'Este comentário não altera o status do ticket.', '', marcador);
  const texto = mascarar(linhas.join('\n')).slice(0, 8000);
  return { texto, marcador, adf: { type: 'doc', version: 1, content: texto.split('\n').map(l => l ? paragrafoDoComentario(l) : { type: 'paragraph' }) } };
}
