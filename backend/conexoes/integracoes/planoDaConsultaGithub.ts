/** Monta a consulta no GitHub (repositório, branches, commits, PRs, um PR e verificações de um commit) só no repositório vinculado. */
import { z } from 'zod';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { parametrosDaUrl } from '../../compartilhado/texto/parametrosDaUrl.js';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { OperacaoServico, PlanoDaConsulta } from '../tipos/adaptador.js';
import { paginaSchema } from '../tipos/transporte.js';
import { ErroServico } from './ErroServico.js';
import { idNumericoDaConsulta } from './idNumericoDaConsulta.js';

export function planoDaConsultaGithub(r: Recurso, operacao: OperacaoServico, p: z.output<typeof paginaSchema>, id?: string): PlanoDaConsulta {
  const repo = '/repos/' + r.chave.split('/').map(codificarParaUrl).join('/');
  const mapa: Partial<Record<OperacaoServico, string>> = { repositorio: '', branches: '/branches', commits: '/commits', prs: '/pulls', pr: '/pulls/' + (id ?? '') };
  if (operacao === 'verificacoes') {
    if (!id || !/^[a-f0-9]{40}$/.test(id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    return { endpoint: repo + '/commits/' + id + '/check-runs?' + parametrosDaUrl({ per_page: p.limite, page: Math.floor(p.offset / p.limite) + 1 }), colecao: 'check_runs', envelope: 'github-checks' };
  }
  if (!(operacao in mapa)) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  if (operacao === 'pr') idNumericoDaConsulta(id);
  return { endpoint: repo + mapa[operacao] + '?' + parametrosDaUrl({ per_page: p.limite, page: Math.floor(p.offset / p.limite) + 1, state: operacao === 'prs' ? 'all' : undefined }), envelope: operacao === 'repositorio' || operacao === 'pr' ? 'object' : 'array' };
}
