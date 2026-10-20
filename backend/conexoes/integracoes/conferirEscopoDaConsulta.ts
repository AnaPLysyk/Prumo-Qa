/** Confere que o que voltou pertence ao recurso vinculado (tickets, caso, defeito, repositório) e valida o formato dos defeitos do Qase. */
import { z } from 'zod';
import { Recurso } from '../../projetos/contratos.js';
import { OperacaoServico, nome, obj } from '../tipos/adaptador.js';
import { ErroServico } from './ErroServico.js';

export function conferirEscopoDaConsulta(r: Recurso, operacao: OperacaoServico, dados: unknown, id?: string): unknown {
  if (operacao === 'tickets') for (const issue of dados as Record<string, unknown>[]) { const f = obj.parse(issue.fields); if (String(obj.parse(f.project).id) !== r.id) throw new ErroServico('SERVICE_SCOPE_CHANGED'); }
  if ((operacao === 'caso' || operacao === 'defeito') && String(obj.parse(dados).id) !== id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  if (operacao === 'defeitos' || operacao === 'defeito') {
    const defect = z.object({ id: z.number().int().positive().safe(), title: nome, actual_result: z.string().optional(), severity: z.string().optional(), status: z.string().optional(), milestone_id: z.number().int().nullable().optional(), author_id: z.number().int().optional(), created_at: z.string().optional(), updated_at: z.string().optional(), created: z.string().optional(), updated: z.string().optional(), resolved_at: z.string().nullable().optional(), runs: z.array(z.number().int().positive()).max(100).optional(), results: z.array(z.string()).max(100).optional(), attachments: z.array(obj).max(100).optional(), tags: z.array(obj).max(100).optional(), external_data: z.string().optional() });
    dados = Array.isArray(dados) ? dados.map(d => defect.parse(d)) : defect.parse(dados);
  }
  if (operacao === 'repositorio' && String(obj.parse(dados).id) !== r.id) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return dados;
}
