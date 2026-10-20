/** Reúne apoio do worker da funcionalidade, mantendo cada operação identificável pelo nome. */
import { capacidadeDoK6 } from "../k6/capacidadeDoK6.js";
import { Rotina } from "../tipos/rotina.js";
import { EstadoDoWorker, TipoEvento } from "../tipos/worker.js";
import { ErroQa } from "../../compartilhado/erros/ErroQa.js";
import { carregarProjeto } from "../../compartilhado/projeto/carregarProjeto.js";
import { Projeto } from "../../compartilhado/tipos/projeto.js";
import { obterEspaco } from "../../projetos/repositorio.js";

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
