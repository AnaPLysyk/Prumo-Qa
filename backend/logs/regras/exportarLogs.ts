/** Gera o texto JSON com todos os registros do diário do projeto para salvar em arquivo. */
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { consultarAtividades } from '../banco/atividades.js';
import { projetoVinculado } from '../../projetos/servicoProjetos.js';

/** Exporta o histórico bruto do projeto (somente campos do esquema, sem texto livre). */
export async function exportarLogs(raiz: string) {
  const p = await projetoVinculado(raiz, diretorioDados());
  const h = consultarAtividades(p, diretorioDados());
  return JSON.stringify({ exportedAt: new Date().toISOString(), project: p.manifesto.id, events: h.events, problems: h.problems }, null, 2);
}
