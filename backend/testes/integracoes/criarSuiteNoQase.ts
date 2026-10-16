/** Operação "Criar suite no Qase", sem repetir suite com o mesmo nome. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { idCriadoNoQase } from './idCriadoNoQase.js';
import { listarNoQase } from './listarNoQase.js';
import { tituloComparavel } from './tituloComparavel.js';
import { criarSuite } from '../tipos/escritaQase.js';

const mesmaSuite = (s: Record<string, unknown>, p: z.infer<typeof criarSuite>) =>
  tituloComparavel(String(s.title)) === tituloComparavel(p.titulo) &&
  (p.paiId === undefined ? (s.parent_id == null || s.parent_id === 0) : Number(s.parent_id) === p.paiId);

export const criarSuiteNoQase: DefOperacao<z.infer<typeof criarSuite>> = {
  id: 'qase.criar_suite', servico: 'qase', rotulo: 'Criar suite no Qase', efeito: 'Cria uma suite no projeto Qase vinculado.', exigeConfirmacao: true, schema: criarSuite,
  resumo: p => `Criar suite "${p.titulo}"`,
  async executar(ctx, rec, p) {
    const ja = (await listarNoQase(ctx, rec, 'suite', { search: p.titulo })).find(s => mesmaSuite(s, p));
    if (ja) throw new ErroServico('SERVICE_DUPLICATE'); // já existe: nunca duplica
    const novo = idCriadoNoQase(await ctx.enviar('POST', `/v1/suite/${codificarParaUrl(rec.chave)}`, JSON.stringify({ title: mascarar(p.titulo), description: mascarar(p.descricao), ...(p.paiId ? { parent_id: p.paiId } : {}) })));
    return { id: novo, detalhes: { titulo: p.titulo } };
  },
  async reconciliar(ctx, rec, p) {
    const s = (await listarNoQase(ctx, rec, 'suite', { search: p.titulo })).find(x => mesmaSuite(x, p));
    return s ? { id: String(s.id), detalhes: { titulo: p.titulo } } : null;
  },
  async confirmar(ctx, rec, p, remoto) {
    const suite = (await listarNoQase(ctx, rec, 'suite', { search: p.titulo }))
      .find(s => String(s.id) === remoto.id);
    return !!suite && mesmaSuite(suite, p) && (suite.description ?? '') === mascarar(p.descricao);
  }
};
