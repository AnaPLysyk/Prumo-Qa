/** Tira os dados de dentro da resposta do serviço conforme o formato dela e calcula onde começa a próxima página. */
import { z } from 'zod';
import { ConfigServico, OperacaoServico, PlanoDaConsulta, itemQase, obj, objetos, paginaQase } from '../tipos/adaptador.js';
import { paginaSchema } from '../tipos/transporte.js';

export function lerEnvelopeDaConsulta(c: ConfigServico, bruto: unknown, plano: PlanoDaConsulta, operacao: OperacaoServico, p: z.output<typeof paginaSchema>): { dados: unknown; proxima: string | number | null } {
  if (plano.envelope === 'qase-page') { const b = paginaQase.parse(bruto); return { dados: b.result.entities, proxima: p.offset + b.result.entities.length < (b.result.filtered ?? b.result.total) ? p.offset + b.result.entities.length : null }; }
  if (plano.envelope === 'qase-item') return { dados: itemQase.parse(bruto).result, proxima: null };
  if (plano.envelope === 'array') { const dados = (operacao === 'campos' ? z.array(obj).max(1000) : objetos).parse(bruto); return { dados, proxima: c.servico === 'github' && dados.length === p.limite ? p.offset + p.limite : null }; }
  if (plano.envelope === 'object') return { dados: obj.parse(bruto), proxima: null };
  const b = obj.parse(bruto); const dados = objetos.parse(b[plano.colecao!]);
  if (plano.envelope === 'jira-cursor') {
    if (b.isLast === true) return { dados, proxima: null };
    if (typeof b.nextPageToken !== 'string') throw new Error();
    return { dados, proxima: b.nextPageToken };
  }
  const total = z.number().int().nonnegative().parse(b.total ?? b.total_count);
  return { dados, proxima: p.offset + dados.length < total ? p.offset + dados.length : null };
}
