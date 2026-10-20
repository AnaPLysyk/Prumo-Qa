/** Lê a trava que garante um único worker ligado; se o arquivo estiver ilegível (ex.: queda de energia), põe de lado e segue. */
import fs from 'node:fs';
import { travaSchema } from '../tipos/worker.js';
import { arquivoLocal } from '../../compartilhado/banco/arquivoLocal.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';

// Uma trava ilegível (ex.: arquivo zerado por queda de energia) não pode impedir o aplicativo de abrir. Ela é
// posta de lado (renomeada, para diagnóstico) e tratada como ausente; o worker grava uma nova ao assumir.
export const lerTravaDoWorker = (b?: string) => {
  try { return lerLocal('worker-trava.json', travaSchema.nullable(), null, b); }
  catch {
    try { const alvo = arquivoLocal('worker-trava.json', b); fs.renameSync(alvo, `${alvo}.ilegivel-${Date.now()}`); } catch { /* sem permissão: segue como ausente */ }
    return null;
  }
};
