/** Gera o texto JSON com todos os registros do diário do projeto para salvar em arquivo. */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { consultarAtividades } from '../banco/consultarAtividades.js';
import { projetoVinculado } from '../../projetos/regras/projetoVinculado.js';

/** Exporta o histórico bruto do projeto (somente campos do esquema, sem texto livre). */
export async function exportarLogs(raiz: string) {
  const p = await projetoVinculado(raiz, pastaDeDadosEscolhida());
  const h = consultarAtividades(p, pastaDeDadosEscolhida());
  return JSON.stringify({ exportedAt: new Date().toISOString(), project: p.manifesto.id, events: h.events, problems: h.problems }, null, 2);
}
