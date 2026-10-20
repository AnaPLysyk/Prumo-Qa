/** Organiza as escritas autorizadas em repositórios GitHub: branch, arquivo de teste e pull request. */
import { z } from "zod";
import { caminhoDoRepositorio, commitAtualDoBranch, dadosDoRepositorio } from "./dadosDoGithub.js";
import { ErroServico } from "../integracoes/ErroServico.js";
import { criarBranch, sha40, commitar, abrirPr } from "../tipos/escritaGithub.js";
import { DefOperacao } from "../tipos/operacao.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { ContextoServico } from "../tipos/adaptador.js";
import { Recurso } from "../../projetos/contratos.js";

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

export const gravarTesteNoGithub: DefOperacao<z.infer<typeof commitar>> = {
  id: 'github.commitar_arquivo', servico: 'github', rotulo: 'Gravar arquivo de teste em branch de trabalho', efeito: 'Cria ou atualiza um arquivo de teste no branch prumo/..., gerando um commit. Não toca no branch padrão nem em workflows.', exigeConfirmacao: true, schema: commitar,
  resumo: p => `Commit em ${p.branch}: ${p.caminho} (${Buffer.byteLength(p.conteudo)} bytes)`,
  async executar(ctx, rec, p) {
    const repo = await dadosDoRepositorio(ctx, rec); if (p.branch === repo.default_branch) throw new ErroServico('SERVICE_WRITE_BLOCKED'); if (!(await commitAtualDoBranch(ctx, rec, p.branch))) throw new ErroServico('SERVICE_NOT_FOUND');
    const caminho = p.caminho.split('/').map(codificarParaUrl).join('/'); const texto = mascarar(p.conteudo); let shaAtual: string | undefined;
    try {
      const a = z.object({ sha: z.string(), content: z.string().optional(), encoding: z.string().optional() }).passthrough().parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/contents/${caminho}?ref=${codificarParaUrl(p.branch)}`));
      if (a.encoding === 'base64' && a.content && Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') === texto) return { id: a.sha, chave: p.caminho, detalhes: { semMudanca: true, atualizacao: false } }; // idempotente
      shaAtual = a.sha;
    } catch (e) { if (!(e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND')) throw e; }
    const r = z.object({ commit: z.object({ sha: sha40, html_url: z.string().optional() }).passthrough(), content: z.object({ html_url: z.string().optional() }).passthrough().optional() }).passthrough()
      .parse(await ctx.enviar('PUT', `${caminhoDoRepositorio(rec)}/contents/${caminho}`, JSON.stringify({ message: mascarar(p.mensagem), content: Buffer.from(texto, 'utf8').toString('base64'), branch: p.branch, ...(shaAtual ? { sha: shaAtual } : {}) })));
    return { id: r.commit.sha, chave: p.caminho, url: r.commit.html_url ?? r.content?.html_url, detalhes: { semMudanca: false, atualizacao: shaAtual !== undefined } };
  },
  async confirmar(ctx, rec, p) {
    const a = z.object({ content: z.string().optional() }).passthrough().parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/contents/${p.caminho.split('/').map(codificarParaUrl).join('/')}?ref=${codificarParaUrl(p.branch)}`));
    return !!a.content && Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') === mascarar(p.conteudo);
  }
};

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
