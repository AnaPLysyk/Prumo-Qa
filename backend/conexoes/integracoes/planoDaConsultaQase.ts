/** Monta a consulta no Qase (defeitos, suites, casos, planos, runs e resultados) só no projeto vinculado. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { parametrosDaUrl } from '../../compartilhado/texto/parametrosDaUrl.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { OperacaoServico, PlanoDaConsulta } from '../tipos/adaptador.js';
import { Filtros } from '../tipos/leituras.js';
import { paginaSchema } from '../tipos/transporte.js';
import { ErroServico } from './ErroServico.js';
import { idNumericoDaConsulta } from './idNumericoDaConsulta.js';

export function planoDaConsultaQase(r: Recurso, operacao: OperacaoServico, p: z.output<typeof paginaSchema>, id?: string, filtros?: Filtros): PlanoDaConsulta {
  if (!/^[A-Z][A-Z0-9]{1,9}$/.test(r.chave) || r.id !== r.chave) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  const mapa: Partial<Record<OperacaoServico, string>> = { defeitos: 'defect', defeito: 'defect', suites: 'suite', casos: 'case', caso: 'case', planos: 'plan', runs: 'run', run: 'run', resultados: 'result' };
  const tipo = mapa[operacao]; if (!tipo) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  const detalhe = operacao === 'caso' || operacao === 'run' || operacao === 'defeito';
  const statusDefeito = operacao === 'defeitos' && filtros?.status ? z.enum(['open', 'resolved', 'in_progress', 'invalid']).safeParse(filtros.status) : null;
  if (statusDefeito && !statusDefeito.success) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  const endpoint = '/v1/' + tipo + '/' + codificarParaUrl(r.chave) + (detalhe ? '/' + idNumericoDaConsulta(id) : '') + '?' + parametrosDaUrl({ offset: detalhe ? undefined : p.offset, limit: detalhe ? undefined : p.limite, status: statusDefeito?.success ? statusDefeito.data : undefined, include: operacao === 'casos' || operacao === 'caso' ? 'external_issues' : undefined, run: operacao === 'resultados' && id ? idNumericoDaConsulta(id) : undefined });
  return { endpoint, envelope: detalhe ? 'qase-item' : 'qase-page' };
}
