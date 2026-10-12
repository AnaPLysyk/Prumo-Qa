/** Formato do relatório JSON do Playwright e do caso convertido para o Prumo. */
import { z } from 'zod';
import { Status } from '../../evidencias/tipos/evidencia.js';

/**
 * Converte o relatório JSON estruturado do Playwright (reporter "json") nos cenários do contrato do Prumo.
 * Não usa exit code para inventar cenários: sem relatório estruturado a rodada continua "round" (sem casos).
 * Contrato do projeto: o runner (ou o reporter incluído em reporters/prumo-playwright-reporter.cjs) grava o resultado
 * em PRUMO_RESULT_FILE; esta função serve para quem preferir apontar para o JSON nativo do Playwright.
 */
export type Res = { status: string; error?: { message?: string }; errors?: { message?: string }[] };

export type Teste = { status?: string; expectedStatus?: string; results?: Res[]; projectName?: string };

export type Suite = { title?: string; file?: string; specs?: { title: string; file?: string; tests?: Teste[] }[]; suites?: Suite[] };

export const relatorio = z.object({ suites: z.array(z.custom<Suite>(v => typeof v === 'object' && v !== null)) }).passthrough();

export type CasoConvertido = { id: string; status: Status; evidence: string };
