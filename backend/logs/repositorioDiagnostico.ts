/** Persistência de logs: operações relacionadas no mesmo módulo. */
import fs from "node:fs";
import path from "node:path";
import { eAtalho } from "./banco/eAtalho.js";
import { nomeValido, EventoDiagnostico, eventoDiagnosticoSchema, limiteArquivo } from "./contratos.js";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";

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
