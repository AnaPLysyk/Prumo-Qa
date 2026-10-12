/** Lista os registros do diário de operações do projeto para a tela Logs, com filtro. */
import { pastaDeDadosEscolhida } from '../../compartilhado/banco/pastaDeDadosEscolhida.js';
import { consultarAtividades } from '../banco/consultarAtividades.js';
import { apresentarRegistroDoDiario } from './apresentarRegistroDoDiario.js';
import { filtrarRegistrosDoDiario } from './filtrarRegistrosDoDiario.js';
import { projetoVinculado } from '../../projetos/regras/projetoVinculado.js';
import { Filtro, filtroSchema } from '../../projetos/tipos/painel.js';

export async function listarLogsDoProjeto(raiz: string, filtro: Filtro = {}) {
  const f = filtroSchema.parse(filtro); const p = await projetoVinculado(raiz, pastaDeDadosEscolhida());
  const h = consultarAtividades(p, pastaDeDadosEscolhida());
  return { events: filtrarRegistrosDoDiario(h.events, f).slice(-f.limit).map(e => apresentarRegistroDoDiario(e)), problems: h.problems, complete: h.complete };
}
