/** Trava local do agendador: leitura, batimentos, integridade e verificação do processo. */
import fs from 'node:fs';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { arquivoLocal } from '../../compartilhado/banco/arquivoLocal.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { EstadoDoWorker, travaSchema } from '../tipos/worker.js';

/** Confere se o PID ainda existe; falta de permissão não significa processo encerrado. */
export function processoVivo(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (erro) {
    return (erro as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** Arquivo de trava corrompido é preservado para diagnóstico e tratado como ausente. */
export function lerTravaDoWorker(base?: string) {
  try {
    return lerLocal('worker-trava.json', travaSchema.nullable(), null, base);
  } catch {
    try {
      const arquivo = arquivoLocal('worker-trava.json', base);
      fs.renameSync(arquivo, `${arquivo}.ilegivel-${Date.now()}`);
    } catch {
      // Sem permissão para renomear: não impede a inicialização do aplicativo.
    }
    return null;
  }
}

/** Atualiza o batimento preservando o início da mesma instância. */
export function gravarTravaDoWorker(estado: EstadoDoWorker, ativo: boolean) {
  const agora = estado.agora().toISOString();
  const anterior = lerTravaDoWorker(estado.base);
  const trava = travaSchema.parse({
    instancia: estado.instancia,
    pid: process.pid,
    inicio: anterior?.instancia === estado.instancia ? anterior.inicio : agora,
    batimento: agora,
    ativo
  });
  gravarLocal('worker-trava.json', trava, estado.base);
}
