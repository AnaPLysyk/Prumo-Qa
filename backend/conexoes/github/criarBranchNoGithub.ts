/** Operação "Criar branch de trabalho no GitHub" (prumo/...), nunca o branch padrão. */
import { z } from 'zod';
import { caminhoDoRepositorio } from './caminhoDoRepositorio.js';
import { commitAtualDoBranch } from './commitAtualDoBranch.js';
import { dadosDoRepositorio } from './dadosDoRepositorio.js';
import { ErroServico } from '../integracoes/ErroServico.js';
import { criarBranch, sha40 } from '../tipos/escritaGithub.js';
import { DefOperacao } from '../tipos/operacao.js';

export const criarBranchNoGithub: DefOperacao<z.infer<typeof criarBranch>> = {
  id: 'github.criar_branch', servico: 'github', rotulo: 'Criar branch de trabalho no GitHub', efeito: 'Cria o branch prumo/... a partir do branch base. Nunca altera o branch padrão.', exigeConfirmacao: true, schema: criarBranch,
  resumo: p => `Criar branch ${p.nome}${p.base ? ` a partir de ${p.base}` : ''}`,
  async executar(ctx, rec, p) {
    const repo = await dadosDoRepositorio(ctx, rec); const base = p.base ?? repo.default_branch; if (p.nome === repo.default_branch) throw new ErroServico('SERVICE_WRITE_BLOCKED');
    const existente = await commitAtualDoBranch(ctx, rec, p.nome); if (existente) return { id: existente, chave: p.nome, detalhes: { existente: true, base } };
    const sha = await commitAtualDoBranch(ctx, rec, base); if (!sha) throw new ErroServico('SERVICE_NOT_FOUND');
    const r = z.object({ ref: z.string(), object: z.object({ sha: sha40 }).passthrough() }).passthrough().parse(await ctx.enviar('POST', `${caminhoDoRepositorio(rec)}/git/refs`, JSON.stringify({ ref: `refs/heads/${p.nome}`, sha })));
    return { id: r.object.sha, chave: p.nome, detalhes: { existente: false, base } };
  },
  async reconciliar(ctx, rec, p) { const s = await commitAtualDoBranch(ctx, rec, p.nome); return s ? { id: s, chave: p.nome, detalhes: { existente: true } } : null; },
  async confirmar(ctx, rec, p) { return (await commitAtualDoBranch(ctx, rec, p.nome)) !== null; }
};
