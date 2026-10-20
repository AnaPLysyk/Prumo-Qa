/** Operação "Abrir Pull Request no GitHub" (rascunho), sem merge nem aprovação. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { caminhoDoRepositorio } from './caminhoDoRepositorio.js';
import { commitAtualDoBranch } from './commitAtualDoBranch.js';
import { dadosDoRepositorio } from './dadosDoRepositorio.js';

import { ErroServico } from '../integracoes/ErroServico.js';
import { abrirPr } from '../tipos/escritaGithub.js';
import { DefOperacao } from '../tipos/operacao.js';
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { ContextoServico } from '../tipos/adaptador.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

const pullRequestDoBranch = async (ctx: ContextoServico, rec: Recurso, branch: string) => {
  const dono = rec.chave.split('/')[0]!; const l = z.array(z.object({ number: z.number(), html_url: z.string(), state: z.string() }).passthrough()).parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/pulls?head=${codificarParaUrl(dono + ':' + branch)}&state=open&per_page=5`));
  return l[0] ?? null;
};


export const abrirPullRequestNoGithub: DefOperacao<z.infer<typeof abrirPr>> = {
  id: 'github.abrir_pr', servico: 'github', rotulo: 'Abrir Pull Request no GitHub', efeito: 'Abre um Pull Request (rascunho por padrão) do branch prumo/... para o branch base. Não faz merge nem aprova nada.', exigeConfirmacao: true, schema: abrirPr,
  resumo: p => `Abrir PR "${p.titulo}" de ${p.branch}${p.rascunho ? ' (rascunho)' : ''}`,
  async executar(ctx, rec, p) {
    const repo = await dadosDoRepositorio(ctx, rec); const base = p.base ?? repo.default_branch; if (p.branch === base) throw new ErroServico('SERVICE_WRITE_BLOCKED'); if (!(await commitAtualDoBranch(ctx, rec, p.branch))) throw new ErroServico('SERVICE_NOT_FOUND');
    const aberto = await pullRequestDoBranch(ctx, rec, p.branch); if (aberto) return { id: String(aberto.number), chave: `#${aberto.number}`, url: aberto.html_url, detalhes: { existente: true } };
    const r = z.object({ number: z.number(), html_url: z.string() }).passthrough().parse(await ctx.enviar('POST', `${caminhoDoRepositorio(rec)}/pulls`, JSON.stringify({ title: mascarar(p.titulo), head: p.branch, base, body: mascarar(p.corpo), draft: p.rascunho })));
    return { id: String(r.number), chave: `#${r.number}`, url: r.html_url, detalhes: { existente: false, base } };
  },
  async reconciliar(ctx, rec, p) { const a = await pullRequestDoBranch(ctx, rec, p.branch); return a ? { id: String(a.number), chave: `#${a.number}`, url: a.html_url, detalhes: { existente: true } } : null; }
};
