/** Faz uma consulta de leitura da tela no recurso vinculado: monta o endereço do serviço, lê a resposta, confere o escopo e devolve só o seguro. */
import { z } from 'zod';
import { Recurso } from '../../projetos/tipos/espacos.js';
import { OperacaoServico, PartesDoAdaptador } from '../tipos/adaptador.js';
import { Filtros, OperacaoExtra, operacoesExtras } from '../tipos/leituras.js';
import { paginaSchema } from '../tipos/transporte.js';
import { conferirEscopoDaConsulta } from './conferirEscopoDaConsulta.js';
import { contextoDoAdaptador } from './contextoDoAdaptador.js';
import { ErroServico } from './ErroServico.js';
import { lerComCredencial } from './lerComCredencial.js';
import { lerDetalheDoServico } from './lerDetalheDoServico.js';
import { lerEnvelopeDaConsulta } from './lerEnvelopeDaConsulta.js';
import { planoDaConsultaGithub } from './planoDaConsultaGithub.js';
import { planoDaConsultaJira } from './planoDaConsultaJira.js';
import { planoDaConsultaQase } from './planoDaConsultaQase.js';
import { saidaDaConsulta } from './saidaDaConsulta.js';

export async function consultarNoServico(a: PartesDoAdaptador, r: Recurso, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, campoAceite?: string, filtros?: Filtros) {
  if (r.instancia !== a.c.instancia || r.contaId !== a.c.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  const p = paginaSchema.parse(pagina);
  if ((operacoesExtras as readonly string[]).includes(operacao)) {
    try { const x = await lerDetalheDoServico(contextoDoAdaptador(a), r, operacao as OperacaoExtra, { offset: p.offset, limite: p.limite }, id, filtros); return saidaDaConsulta(a.c, x.dados, x.proxima, r, x.endpoint); }
    catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
  }
  if (a.c.servico !== 'qase' && !/^\d{1,20}$/.test(r.id)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  if (campoAceite && !/^customfield_\d+$/.test(campoAceite)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  const plano = a.c.servico === 'jira' ? await planoDaConsultaJira(a, r, operacao, p, id, campoAceite, filtros) : a.c.servico === 'qase' ? planoDaConsultaQase(r, operacao, p, id, filtros) : planoDaConsultaGithub(r, operacao, p, id);
  if ('pronto' in plano) return plano.pronto;
  try {
    let endpoint = plano.endpoint; let limitacao: string | undefined; let bruto: unknown;
    try { bruto = await lerComCredencial(a, endpoint); }
    catch (e) {
      if (!(e instanceof ErroServico && e.codigo === 'SERVICE_PLAN_LIMIT' && /[?&]include=external_issues\b/.test(endpoint))) throw e;
      endpoint = endpoint.replace(/([?&])include=external_issues(&|$)/, (_m, a1, a2) => (a2 ? a1 : '')).replace(/[?&]$/, '');
      limitacao = 'O plano do Qase não libera os vínculos com o Jira (external_issues): os casos aparecem sem eles.';
      bruto = await lerComCredencial(a, endpoint);
    }
    const { dados, proxima } = lerEnvelopeDaConsulta(a.c, bruto, plano, operacao, p);
    return { ...saidaDaConsulta(a.c, conferirEscopoDaConsulta(r, operacao, dados, id), proxima, r, endpoint), ...(limitacao ? { limitacao } : {}) };
  } catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}
