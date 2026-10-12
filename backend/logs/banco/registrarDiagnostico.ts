/** Registra uma chamada da janela (canal, estado, duração, código), só metadados e com limite por dia. */
import fs from 'node:fs';
import path from 'node:path';
import { eAtalho } from '../../compartilhado/seguranca/eAtalho.js';
import { pastaDoDiagnostico } from './pastaDoDiagnostico.js';
import { EventoDiagnostico, eventoDiagnosticoSchema, limiteArquivo } from '../tipos/diagnostico.js';

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
