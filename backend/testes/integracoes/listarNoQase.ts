/** Percorre as paginas da consulta Qase sem concluir falsamente que um caso/run/suite não existe. */
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { Recurso } from '../../projetos/contratos.js';
import { itensDaPaginaQase } from './itensDaPaginaQase.js';

/** Limite finito: se houver mais registros, a operação de escrita não pode assumir ausência de duplicata. */
export async function listarNoQase(ctx: ContextoServico, rec: Recurso, tipo: 'case' | 'run' | 'plan' | 'suite' | 'defect', filtros: Record<string, string | number>, max = 1000) {
  const teto = Math.min(Math.max(1, Math.trunc(max)), 2000);
  const itens: Record<string, unknown>[] = [];
  let offset = 0;
  while (offset < teto) {
    const limite = Math.min(100, teto - offset);
    const q = new URLSearchParams({ limit: String(limite), offset: String(offset) });
    for (const [k, v] of Object.entries(filtros)) q.set(k, String(v));
    const pagina = itensDaPaginaQase(await ctx.ler(`/v1/${tipo}/${codificarParaUrl(rec.chave)}?${q}`));
    const informados = pagina.filtered ?? pagina.total;
    if ((informados !== undefined && informados > teto) ||
        pagina.entities.length > limite ||
        (pagina.entities.length === 0 && informados !== undefined && offset < informados)) {
      throw new ErroServico('SERVICE_RESPONSE_INVALID');
    }
    itens.push(...pagina.entities);
    offset = itens.length;
    if (informados !== undefined) {
      if (offset >= informados) return itens;
      if (pagina.entities.length !== limite) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    } else if (pagina.entities.length < limite) {
      return itens;
    }
  }
  // Não liberar criação/reconciliação se o serviço não permitiu pesquisar todos os registros.
  throw new ErroServico('SERVICE_RESPONSE_INVALID');
}
