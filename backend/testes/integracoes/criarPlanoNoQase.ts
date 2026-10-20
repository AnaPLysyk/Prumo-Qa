/** Operação "Criar plano de teste no Qase". */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { marcadorDaOperacao } from '../../conexoes/escrita/marcadorDaOperacao.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { conferirCasosNoQase } from './consultasDeCasosQase.js';
import { conferirIdsDoObjetoQase } from '../integracaoFormatosQase.js';
import { idCriadoNoQase } from '../integracaoFormatosQase.js';
import { listarNoQase } from './listarNoQase.js';
import { criarPlano } from '../tipos/escritaQase.js';

export const criarPlanoNoQase: DefOperacao<z.infer<typeof criarPlano>> = {
  id: 'qase.criar_plano', servico: 'qase', rotulo: 'Criar plano de teste no Qase', efeito: 'Cria um plano com os casos escolhidos (todos conferidos no projeto vinculado).', exigeConfirmacao: true, schema: criarPlano,
  resumo: p => `Criar plano "${p.titulo}" com ${p.casos.length} caso(s)`,
  async executar(ctx, rec, p, k) {
    await conferirCasosNoQase(ctx, rec, p.casos);
    const novo = idCriadoNoQase(await ctx.enviar('POST', `/v1/plan/${codificarParaUrl(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: `${mascarar(p.descricao)}\n[${marcadorDaOperacao(k)}]`.trim(), cases: [...new Set(p.casos)] })));
    return { id: novo, detalhes: { casos: new Set(p.casos).size } };
  },
  async reconciliar(ctx, rec, p, k) { const x = (await listarNoQase(ctx, rec, 'plan', {})).find(e => String(e.description ?? '').includes(`[${marcadorDaOperacao(k)}]`)); return x ? { id: String(x.id), detalhes: { casos: new Set(p.casos).size } } : null; },
  async confirmar(ctx, rec, p, r, k) {
    const resposta = z.object({ result: z.object({
      id: z.union([z.number(), z.string()]).transform(String),
      title: z.string().optional(), description: z.string().nullable().optional(),
      cases: z.unknown().optional()
    }).passthrough() }).passthrough().parse(
      await ctx.ler(`/v1/plan/${codificarParaUrl(rec.chave)}/${codificarParaUrl(r.id!)}`)
    ).result;
    return resposta.id === r.id && resposta.title === mascarar(p.titulo) &&
      resposta.description === `${mascarar(p.descricao)}\n[${marcadorDaOperacao(k)}]`.trim() &&
      conferirIdsDoObjetoQase(resposta.cases, p.casos);
  }
};
