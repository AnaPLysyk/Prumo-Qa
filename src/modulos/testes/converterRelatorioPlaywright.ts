/** Converte o relatório JSON do Playwright em resultados estruturados do Prumo. */
import { z } from 'zod';
import { mascarar } from '../../projeto.js';
import type { Status } from '../../evidencias.js';

/**
 * Converte o relatório JSON estruturado do Playwright (reporter "json") nos cenários do contrato do Prumo.
 * Não usa exit code para inventar cenários: sem relatório estruturado a rodada continua "round" (sem casos).
 * Contrato do projeto: o runner (ou o reporter incluído em reporters/prumo-playwright-reporter.cjs) grava o resultado
 * em PRUMO_RESULT_FILE; esta função serve para quem preferir apontar para o JSON nativo do Playwright.
 */
type Res = { status: string; error?: { message?: string }; errors?: { message?: string }[] };
type Teste = { status?: string; expectedStatus?: string; results?: Res[]; projectName?: string };
type Suite = { title?: string; file?: string; specs?: { title: string; file?: string; tests?: Teste[] }[]; suites?: Suite[] };
const relatorio = z.object({ suites: z.array(z.custom<Suite>(v => typeof v === 'object' && v !== null)) }).passthrough();

export type CasoConvertido = { id: string; status: Status; evidence: string };
export function converterRelatorioPlaywright(json: unknown, segredos: string[] = []): CasoConvertido[] {
  const r = relatorio.parse(json); const casos: CasoConvertido[] = []; const vistos = new Map<string, number>();
  const visitar = (s: Suite, caminho: string[]) => {
    const proprio = s.title && s.title !== s.file ? [...caminho, s.title] : caminho;
    for (const sp of s.specs ?? []) for (const t of sp.tests ?? []) {
      const base = [sp.file ?? s.file ?? '', ...proprio.filter(x => x !== (sp.file ?? s.file)), sp.title, ...(t.projectName ? [`[${t.projectName}]`] : [])].filter(Boolean).join(' › ');
      const n = (vistos.get(base) ?? 0) + 1; vistos.set(base, n);
      const id = (n > 1 ? `${base} #${n}` : base).slice(0, 100);
      const resultados = t.results ?? []; const ultimo = resultados.at(-1); const msg = (ultimo?.errors?.[0]?.message ?? ultimo?.error?.message ?? '').replace(/\u001b\[[0-9;]*m/g, '').trim();
      let status: Status; let evidence: string;
      if (t.status === 'skipped' || ultimo?.status === 'skipped') { status = 'NOT_RUN'; evidence = 'Teste ignorado (skip) pelo Playwright.'; }
      else if (ultimo?.status === 'interrupted') { status = 'NOT_RUN'; evidence = 'Execução interrompida antes do término do teste.'; }
      else if (t.status === 'expected' || t.status === 'flaky') {
        status = 'PASS';
        evidence = t.status === 'flaky' ? `Passou após ${resultados.length} tentativas (instável: falhou antes de passar).` : t.expectedStatus === 'failed' ? 'Falha esperada (test.fail) ocorreu como previsto.' : `Passou em ${resultados.length || 1} tentativa(s).`;
      }
      else if (t.status === 'unexpected' || ultimo?.status === 'failed' || ultimo?.status === 'timedOut') { status = 'FAIL'; evidence = (ultimo?.status === 'timedOut' ? 'Tempo esgotado. ' : '') + (msg || 'Teste falhou sem mensagem no relatório.'); }
      else { status = 'BLOCKED'; evidence = `Estado não reconhecido no relatório: ${t.status ?? ultimo?.status ?? 'ausente'}.`; }
      casos.push({ id, status, evidence: mascarar(evidence, segredos).slice(0, 1000) || 'sem detalhe' });
    }
    for (const filho of s.suites ?? []) visitar(filho, proprio);
  };
  for (const s of r.suites) visitar(s, []);
  return casos.slice(0, 1000);
}
