/** Lista as operações do projeto já consolidadas (início + término) para a tela Histórico. */
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { consultarAtividades } from '../banco/consultarAtividades.js';
import { apresentarRegistroDoDiario } from './apresentarRegistroDoDiario.js';
import { filtrarRegistrosDoDiario } from './filtrarRegistrosDoDiario.js';
import { projetoVinculado } from '../../projetos/regras/projetoVinculado.js';
import { Filtro, filtroSchema } from '../../projetos/tipos/painel.js';

export async function listarHistoricoDoProjeto(raiz: string, filtro: Filtro = {}) {
  const f = filtroSchema.parse(filtro); const p = await projetoVinculado(raiz, diretorioDados());
  const h = consultarAtividades(p, diretorioDados());
  return { activities: filtrarRegistrosDoDiario(h.activities, f).slice(-f.limit).reverse().map(a => apresentarRegistroDoDiario(a, true)), problems: h.problems, complete: h.complete,
    notice: 'Recomendações são orientações do Prumo. Ele não observa se a IA as aplicou.' };
}
