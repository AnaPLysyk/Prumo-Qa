/** Executa o CLI do Claude/Codex numa pasta temporária vazia, sem shell, com tempo limite, e apaga a pasta no fim. */
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ambienteDaIa } from './ambienteDaIa.js';
import { Executor } from '../tipos/chat.js';

export const executarCliDeIa: Executor = (comando, args, o) => new Promise(ok => {
  // Não carrega configuração, hooks ou MCP do repositório conectado.
  const temporario = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-chat-'));
  execFile(comando, args, { timeout: o.timeoutMs, maxBuffer: 1024 * 1024, windowsHide: true, shell: false, cwd: temporario, env: ambienteDaIa() }, (erro, saida, err) => {
    // Caminho criado pelo próprio processo e conferido antes da remoção recursiva.
    const relativo = path.relative(os.tmpdir(), temporario);
    if (!path.isAbsolute(relativo) && !relativo.startsWith('..') && path.basename(temporario).startsWith('prumo-chat-')) {
      try { fs.rmSync(temporario, { recursive: true, force: true }); } catch { /* limpeza não muda a resposta do provedor */ }
    }
    ok({ codigo: erro ? (typeof (erro as NodeJS.ErrnoException & { code?: unknown }).code === 'number' ? (erro as unknown as { code: number }).code : null) : 0, saida: String(saida ?? ''), erro: String(err ?? '') });
  });
});
