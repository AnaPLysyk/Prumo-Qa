import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { diretorioDados } from './atividades.js';

/**
 * Diagnóstico técnico das chamadas IPC da interface. Fica em %LOCALAPPDATA%\PrumoQA\diagnostico, SEPARADO do
 * histórico de operações de QA: não entra em métricas e consultar a tela não gera evento de qualidade.
 * Só metadados (canal, estado, duração, código, correlação). Nunca argumentos, caminhos, conteúdo ou segredos.
 */
const limiteArquivo = 1024 * 1024;
const nomeValido = /^ipc-\d{4}-\d{2}-\d{2}\.jsonl$/;
export const eventoDiagnosticoSchema = z.object({
  at: z.string().datetime(), channel: z.string().regex(/^[a-z]+:[a-z]+$/).max(40), state: z.enum(['OK', 'ERROR']),
  durationMs: z.number().finite().nonnegative(), code: z.string().regex(/^[A-Z_]{3,64}$/).optional(), correlationId: z.string().uuid()
}).strict();
export type EventoDiagnostico = z.infer<typeof eventoDiagnosticoSchema>;
const pasta = (base?: string) => path.join(diretorioDados(base), 'diagnostico');
const ehLink = (alvo: string) => { try { return fs.lstatSync(alvo).isSymbolicLink(); } catch { return false; } };

/** Falha de diagnóstico nunca derruba nem altera a operação observada: retorna false. */
export function registrarDiagnostico(evento: EventoDiagnostico, base?: string): boolean {
  try {
    const e = eventoDiagnosticoSchema.parse(evento); const dir = pasta(base);
    if (ehLink(dir)) return false;
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const alvo = path.join(dir, `ipc-${e.at.slice(0, 10)}.jsonl`);
    if (ehLink(alvo)) return false;
    const linha = JSON.stringify(e) + '\n';
    if ((fs.existsSync(alvo) ? fs.statSync(alvo).size : 0) + linha.length > limiteArquivo) return false; // teto diário: descarta, não cresce
    fs.appendFileSync(alvo, linha, { mode: 0o600 });
    return true;
  } catch { return false; }
}
export function lerDiagnostico(base?: string, limite = 200) {
  const dir = pasta(base); const eventos: EventoDiagnostico[] = []; let invalidos = 0;
  if (ehLink(dir)) return { events: eventos, invalid: 0 };
  let nomes: string[] = []; try { nomes = fs.readdirSync(dir).filter(n => nomeValido.test(n)).sort(); } catch { return { events: eventos, invalid: 0 }; }
  for (const n of nomes) {
    if (ehLink(path.join(dir, n))) continue;
    for (const l of fs.readFileSync(path.join(dir, n), 'utf8').split('\n').filter(Boolean)) {
      try { eventos.push(eventoDiagnosticoSchema.parse(JSON.parse(l))); } catch { invalidos++; }
    }
  }
  return { events: eventos.slice(-limite), invalid: invalidos };
}
/** Exclusão controlada: só arquivos ipc-AAAA-MM-DD.jsonl regulares, um a um; falhas parciais são devolvidas. */
export function excluirDiagnostico(base?: string) {
  const dir = pasta(base); const falhas: { file: string; code: string }[] = []; let apagados = 0;
  if (ehLink(dir)) return { deleted: 0, failed: [{ file: 'diagnostico', code: 'SYMLINK_FORBIDDEN' }] };
  let nomes: string[] = []; try { nomes = fs.readdirSync(dir).filter(n => nomeValido.test(n)); } catch { return { deleted: 0, failed: falhas }; }
  for (const n of nomes) {
    const alvo = path.join(dir, n);
    try { const st = fs.lstatSync(alvo); if (!st.isFile() || st.nlink !== 1) throw Object.assign(new Error('x'), { code: 'FILE_INVALID' }); fs.unlinkSync(alvo); apagados++; }
    catch (e) { falhas.push({ file: n, code: (e as NodeJS.ErrnoException).code ?? 'UNKNOWN' }); }
  }
  try { fs.rmdirSync(dir); } catch { /* ainda há arquivos: permanece */ }
  return { deleted: apagados, failed: falhas };
}
