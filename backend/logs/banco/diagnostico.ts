/** Registra e consulta diagnósticos técnicos da execução do aplicativo. */
import fs from "node:fs";
import path from "node:path";
import { eAtalho } from "../regras/iniciarAtividade.js";
import { nomeValido, EventoDiagnostico, eventoDiagnosticoSchema, limiteArquivo } from "../contratos.js";
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { semLinks } from "../../compartilhado/seguranca/semLinks.js";

/** Auditoria de ações: registra somente metadados fixos, nunca argumentos, tokens, senhas ou conteúdo livre. */
const acaoAuditada = z.object({
  id: z.string().uuid(), at: z.string().datetime(), canal: z.string().regex(/^[a-z]+:[a-z]+$/).max(50),
  tipo: z.enum(['ALTERACAO', 'EXECUCAO', 'CONSULTA_AGENTE', 'SESSAO', 'ORQUESTRACAO']),
  estado: z.enum(['OK', 'ERROR', 'EXECUTANDO', 'CONCLUIDA', 'PARCIAL', 'FALHOU']),
  usuarioId: z.string().uuid().nullable(), espacoId: z.string().uuid().nullable(),
  correlacao: z.string().uuid(), duracaoMs: z.number().nonnegative(),
  codigo: z.string().regex(/^[A-Z_]{3,64}$/).nullable(),
  agente: z.string().regex(/^[a-z0-9-]{1,80}$/).nullable(),
  ambiente: z.string().max(40).nullable(), dispositivo: z.string().max(40).nullable(), navegador: z.string().max(40).nullable()
}).strict();
export type AcaoAuditada = z.infer<typeof acaoAuditada>;
const arquivoAuditoria = (base?: string) => path.join(diretorioDados(base), 'auditoria.jsonl');
/** Não interrompe a ação quando o armazenamento de auditoria falha. A UI não deve prometer registro completo. */
export function registrarAuditoria(dados: Omit<AcaoAuditada, 'id' | 'at'>, base?: string): boolean {
  try {
    const evento = acaoAuditada.parse({ id: randomUUID(), at: new Date().toISOString(), ...dados });
    const alvo = arquivoAuditoria(base); semLinks(alvo);
    fs.mkdirSync(path.dirname(alvo), { recursive: true, mode: 0o700 });
    const linha = JSON.stringify(evento) + '\n';
    if (fs.existsSync(alvo)) {
      const st = fs.lstatSync(alvo);
      if (!st.isFile() || st.nlink !== 1) return false;
      if (st.size + Buffer.byteLength(linha) > 2 * 1024 * 1024) {
        // Limite de segurança: conserva o histórico mais recente e evita crescimento sem controle.
        const ultimas = fs.readFileSync(alvo, 'utf8').split('\n').filter(Boolean).slice(-2500);
        fs.writeFileSync(alvo, ultimas.join('\n') + '\n', { mode: 0o600 });
      }
    }
    fs.appendFileSync(alvo, linha, { mode: 0o600 }); return true;
  } catch { return false; }
}
export function lerAuditoria(base?: string, limite = 500): { eventos: AcaoAuditada[]; invalidos: number } {
  const alvo = arquivoAuditoria(base); const eventos: AcaoAuditada[] = []; let invalidos = 0;
  try {
    semLinks(alvo);
    if (!fs.existsSync(alvo)) return { eventos, invalidos };
    const st = fs.lstatSync(alvo); if (!st.isFile() || st.nlink !== 1 || st.size > 3 * 1024 * 1024) return { eventos, invalidos: 1 };
    for (const l of fs.readFileSync(alvo, 'utf8').split('\n').filter(Boolean).slice(-Math.max(1, Math.min(2000, limite)))) {
      try { const x = acaoAuditada.safeParse(JSON.parse(l)); if (x.success) eventos.push(x.data); else invalidos++; }
      catch { invalidos++; }
    }
  } catch { invalidos++; }
  return { eventos, invalidos };
}


/** Exclusão controlada: só arquivos ipc-AAAA-MM-DD.jsonl regulares, um a um; falhas parciais são devolvidas. */
export function excluirDiagnostico(base?: string) {
  const dir = pastaDoDiagnostico(base); const falhas: { file: string; code: string }[] = []; let apagados = 0;
  if (eAtalho(dir)) return { deleted: 0, failed: [{ file: 'diagnostico', code: 'SYMLINK_FORBIDDEN' }] };
  let nomes: string[] = []; try { nomes = fs.readdirSync(dir).filter(n => nomeValido.test(n)); } catch { return { deleted: 0, failed: falhas }; }
  for (const n of nomes) {
    const alvo = path.join(dir, n);
    try { const st = fs.lstatSync(alvo); if (!st.isFile() || st.nlink !== 1) throw Object.assign(new Error('x'), { code: 'FILE_INVALID' }); fs.unlinkSync(alvo); apagados++; }
    catch (e) { falhas.push({ file: n, code: (e as NodeJS.ErrnoException).code ?? 'UNKNOWN' }); }
  }
  try { fs.rmdirSync(dir); } catch { /* ainda há arquivos: permanece */ }
  return { deleted: apagados, failed: falhas };
}

export function lerDiagnostico(base?: string, limite = 200) {
  const dir = pastaDoDiagnostico(base); const eventos: EventoDiagnostico[] = []; let invalidos = 0;
  if (eAtalho(dir)) return { events: eventos, invalid: 0 };
  let nomes: string[] = []; try { nomes = fs.readdirSync(dir).filter(n => nomeValido.test(n)).sort(); } catch { return { events: eventos, invalid: 0 }; }
  for (const n of nomes) {
    if (eAtalho(path.join(dir, n))) continue;
    for (const l of fs.readFileSync(path.join(dir, n), 'utf8').split('\n').filter(Boolean)) {
      try { eventos.push(eventoDiagnosticoSchema.parse(JSON.parse(l))); } catch { invalidos++; }
    }
  }
  return { events: eventos.slice(-limite), invalid: invalidos };
}

export const pastaDoDiagnostico = (base?: string) => path.join(diretorioDados(base), 'diagnostico');

/** Falha de diagnóstico nunca derruba nem altera a operação observada: retorna false. */
export function registrarDiagnostico(evento: EventoDiagnostico, base?: string): boolean {
  try {
    const e = eventoDiagnosticoSchema.parse(evento); const dir = pastaDoDiagnostico(base);
    if (eAtalho(dir)) return false;
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    const alvo = path.join(dir, `ipc-${e.at.slice(0, 10)}.jsonl`);
    if (eAtalho(alvo)) return false;
    const linha = JSON.stringify(e) + '\n';
    if ((fs.existsSync(alvo) ? fs.statSync(alvo).size : 0) + linha.length > limiteArquivo) return false; // teto diário: descarta, não cresce
    fs.appendFileSync(alvo, linha, { mode: 0o600 });
    return true;
  } catch { return false; }
}
