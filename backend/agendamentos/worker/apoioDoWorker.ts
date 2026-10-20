/** apoioDoWorker: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { capacidadeDoK6 } from "../servicoK6.js";
import { Rotina } from "../tipos/rotina.js";
import { EstadoDoWorker, TipoEvento, travaSchema } from "../tipos/worker.js";
import { ErroQa } from "../../compartilhado/erros.js";
import { carregarProjeto } from "../../compartilhado/projeto/carregarProjeto.js";
import { Projeto } from "../../compartilhado/projeto/contratos.js";
import { obterEspaco } from "../../projetos/banco/projetos.js";
import fs from "node:fs";
import { gravarLocal, arquivoLocal, lerLocal } from "../../compartilhado/banco/persistenciaLocal.js";

// --- apoioDoWorker ---
export function capacidadeDaRotinaAgendada(r: Rotina) {
  return r.capability ?? (r.k6 ? capacidadeDoK6(r.k6) : undefined);
}

export function emitirEventoDoWorker(e: EstadoDoWorker, tipo: TipoEvento, rotinaId: string, trabalhoId: string, titulo: string, detalhe: string) {
  const chave = `${tipo}|${rotinaId}|${detalhe.slice(0, 40)}`; const t = e.agora().getTime(); const ultimo = e.emitidos.get(chave);
  if (ultimo !== undefined && t - ultimo < 30 * 60000 && tipo !== 'AGENDAMENTO_INICIADO') return; // não repete o mesmo aviso a cada tentativa
  e.emitidos.set(chave, t); if (e.emitidos.size > 200) e.emitidos.delete(e.emitidos.keys().next().value!);
  try { e.d.aoEvento?.({ tipo, rotinaId, trabalhoId, titulo, detalhe, at: e.agora().toISOString() }); } catch { /* notificação nunca derruba o worker */ }
}

export async function projetoDaRotina(e: EstadoDoWorker, espacoId: string): Promise<Projeto> {
  const espaco = obterEspaco(espacoId, e.base);
  if (!espaco.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Esta rotina executa testes e precisa de uma pasta de automação vinculada ao projeto Prumo.');
  return carregarProjeto(espaco.pastaLocal);
}

// --- travaDoWorker ---
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
