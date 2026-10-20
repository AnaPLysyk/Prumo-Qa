/** Reúne consultas de vinculos da funcionalidade, mantendo cada operação identificável pelo nome. */
import { diretorioDados } from "../../compartilhado/banco/diretorioDados.js";
import { lerPastasVinculadas } from "../banco/pastasVinculadas.js";
import { situacaoProjeto } from "./situacaoProjeto.js";

export const listarPastasVinculadas = () => listarVinculos(diretorioDados());

export async function listarVinculos(base?: string) {
  return Promise.all(lerPastasVinculadas(base).map(async v => ({ ...(await situacaoProjeto(v.root)), addedAt: v.addedAt })));
}
