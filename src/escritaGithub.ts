import { z } from 'zod';
import { ErroServico } from './httpServicos.js';
import { sensivel, mascarar } from './projeto.js';
import type { DefOperacao } from './operacoesTipos.js';
import type { ContextoServico } from './adaptadoresServicos.js';
import type { Recurso } from './espacos.js';

/**
 * Escritas controladas no GitHub (REST, versão 2022-11-28): criar branch de trabalho, gravar arquivos de teste nela e abrir Pull Request.
 * Regras fixas: o branch de trabalho sempre começa com "prumo/"; nunca se escreve no branch padrão nem em branch alheio; não existe
 * force push, merge, exclusão nem alteração de workflows (.github/). Arquivos precisam parecer testes e não podem ser sensíveis.
 */
const enc = encodeURIComponent;
const ramo = z.string().regex(/^prumo\/[a-z0-9][a-z0-9._/-]{2,78}$/).refine(r => !r.includes('..') && !r.endsWith('/') && !r.endsWith('.lock'), 'ramo inválido');
const ramoBase = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._/-]{0,100}$/).refine(r => !r.includes('..'), 'ramo inválido');
const urlRepo = (rec: Recurso) => `/repos/${rec.chave.split('/').map(enc).join('/')}`;
const sha40 = z.string().regex(/^[a-f0-9]{40}$/);
const padraoTeste = /(^|\/)(tests?|e2e|__tests__|specs?|cypress|playwright|automacao|automation)\//i;
const arquivoTeste = /\.(spec|test)\.[a-z]+$/i;
const extensoes = /\.(ts|tsx|js|mjs|cjs|jsx|py|java|kt|cs|rb|feature|md|json|yml|yaml)$/i;

export function caminhoDeTesteValido(c: string) {
  if (c.length < 3 || c.length > 300 || c.startsWith('/') || /^[a-z]:/i.test(c) || c.split('/').some(p => p === '..' || p === '.' || p === '') || /[\x00-\x1f\\:*?"<>|]/.test(c)) return false;
  if (/^\.github\//i.test(c) || /(^|\/)\.git(\/|$)/i.test(c) || sensivel(c)) return false;
  return extensoes.test(c) && (padraoTeste.test(c) || arquivoTeste.test(c));
}
async function info(ctx: ContextoServico, rec: Recurso) {
  return z.object({ default_branch: z.string(), full_name: z.string(), id: z.number() }).passthrough().parse(await ctx.ler(urlRepo(rec)));
}
async function refSha(ctx: ContextoServico, rec: Recurso, r: string): Promise<string | null> {
  try { return z.object({ object: z.object({ sha: sha40 }).passthrough() }).passthrough().parse(await ctx.ler(`${urlRepo(rec)}/git/ref/heads/${r.split('/').map(enc).join('/')}`)).object.sha; }
  catch (e) { if (e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND') return null; throw e; }
}

const criarBranch = z.object({ nome: ramo, base: ramoBase.optional() }).strict();
export const branchCriar: DefOperacao<z.infer<typeof criarBranch>> = {
  id: 'github.criar_branch', servico: 'github', rotulo: 'Criar branch de trabalho no GitHub', efeito: 'Cria o branch prumo/... a partir do branch base. Nunca altera o branch padrão.', exigeConfirmacao: true, schema: criarBranch,
  resumo: p => `Criar branch ${p.nome}${p.base ? ` a partir de ${p.base}` : ''}`,
  async executar(ctx, rec, p) {
    const repo = await info(ctx, rec); const base = p.base ?? repo.default_branch; if (p.nome === repo.default_branch) throw new ErroServico('SERVICE_WRITE_BLOCKED');
    const existente = await refSha(ctx, rec, p.nome); if (existente) return { id: existente, chave: p.nome, detalhes: { existente: true, base } };
    const sha = await refSha(ctx, rec, base); if (!sha) throw new ErroServico('SERVICE_NOT_FOUND');
    const r = z.object({ ref: z.string(), object: z.object({ sha: sha40 }).passthrough() }).passthrough().parse(await ctx.enviar('POST', `${urlRepo(rec)}/git/refs`, JSON.stringify({ ref: `refs/heads/${p.nome}`, sha })));
    return { id: r.object.sha, chave: p.nome, detalhes: { existente: false, base } };
  },
  async reconciliar(ctx, rec, p) { const s = await refSha(ctx, rec, p.nome); return s ? { id: s, chave: p.nome, detalhes: { existente: true } } : null; },
  async confirmar(ctx, rec, p) { return (await refSha(ctx, rec, p.nome)) !== null; }
};

const commitar = z.object({ branch: ramo, caminho: z.string().min(3).max(300), conteudo: z.string().max(256 * 1024), mensagem: z.string().trim().min(3).max(200) }).strict().refine(p => caminhoDeTesteValido(p.caminho), 'caminho não permitido');
export const arquivoCommitar: DefOperacao<z.infer<typeof commitar>> = {
  id: 'github.commitar_arquivo', servico: 'github', rotulo: 'Gravar arquivo de teste em branch de trabalho', efeito: 'Cria ou atualiza um arquivo de teste no branch prumo/..., gerando um commit. Não toca no branch padrão nem em workflows.', exigeConfirmacao: true, schema: commitar,
  resumo: p => `Commit em ${p.branch}: ${p.caminho} (${Buffer.byteLength(p.conteudo)} bytes)`,
  async executar(ctx, rec, p) {
    const repo = await info(ctx, rec); if (p.branch === repo.default_branch) throw new ErroServico('SERVICE_WRITE_BLOCKED'); if (!(await refSha(ctx, rec, p.branch))) throw new ErroServico('SERVICE_NOT_FOUND');
    const caminho = p.caminho.split('/').map(enc).join('/'); const texto = mascarar(p.conteudo); let shaAtual: string | undefined;
    try {
      const a = z.object({ sha: z.string(), content: z.string().optional(), encoding: z.string().optional() }).passthrough().parse(await ctx.ler(`${urlRepo(rec)}/contents/${caminho}?ref=${enc(p.branch)}`));
      if (a.encoding === 'base64' && a.content && Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') === texto) return { id: a.sha, chave: p.caminho, detalhes: { semMudanca: true, atualizacao: false } }; // idempotente
      shaAtual = a.sha;
    } catch (e) { if (!(e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND')) throw e; }
    const r = z.object({ commit: z.object({ sha: sha40, html_url: z.string().optional() }).passthrough(), content: z.object({ html_url: z.string().optional() }).passthrough().optional() }).passthrough()
      .parse(await ctx.enviar('PUT', `${urlRepo(rec)}/contents/${caminho}`, JSON.stringify({ message: mascarar(p.mensagem), content: Buffer.from(texto, 'utf8').toString('base64'), branch: p.branch, ...(shaAtual ? { sha: shaAtual } : {}) })));
    return { id: r.commit.sha, chave: p.caminho, url: r.commit.html_url ?? r.content?.html_url, detalhes: { semMudanca: false, atualizacao: shaAtual !== undefined } };
  },
  async confirmar(ctx, rec, p) {
    const a = z.object({ content: z.string().optional() }).passthrough().parse(await ctx.ler(`${urlRepo(rec)}/contents/${p.caminho.split('/').map(enc).join('/')}?ref=${enc(p.branch)}`));
    return !!a.content && Buffer.from(a.content.replace(/\n/g, ''), 'base64').toString('utf8') === mascarar(p.conteudo);
  }
};

const abrirPr = z.object({ branch: ramo, base: ramoBase.optional(), titulo: z.string().trim().min(3).max(200), corpo: z.string().max(8000).default(''), rascunho: z.boolean().default(true) }).strict();
const prDoRamo = async (ctx: ContextoServico, rec: Recurso, branch: string) => {
  const dono = rec.chave.split('/')[0]!; const l = z.array(z.object({ number: z.number(), html_url: z.string(), state: z.string() }).passthrough()).parse(await ctx.ler(`${urlRepo(rec)}/pulls?head=${enc(dono + ':' + branch)}&state=open&per_page=5`));
  return l[0] ?? null;
};
export const prAbrir: DefOperacao<z.infer<typeof abrirPr>> = {
  id: 'github.abrir_pr', servico: 'github', rotulo: 'Abrir Pull Request no GitHub', efeito: 'Abre um Pull Request (rascunho por padrão) do branch prumo/... para o branch base. Não faz merge nem aprova nada.', exigeConfirmacao: true, schema: abrirPr,
  resumo: p => `Abrir PR "${p.titulo}" de ${p.branch}${p.rascunho ? ' (rascunho)' : ''}`,
  async executar(ctx, rec, p) {
    const repo = await info(ctx, rec); const base = p.base ?? repo.default_branch; if (p.branch === base) throw new ErroServico('SERVICE_WRITE_BLOCKED'); if (!(await refSha(ctx, rec, p.branch))) throw new ErroServico('SERVICE_NOT_FOUND');
    const aberto = await prDoRamo(ctx, rec, p.branch); if (aberto) return { id: String(aberto.number), chave: `#${aberto.number}`, url: aberto.html_url, detalhes: { existente: true } };
    const r = z.object({ number: z.number(), html_url: z.string() }).passthrough().parse(await ctx.enviar('POST', `${urlRepo(rec)}/pulls`, JSON.stringify({ title: mascarar(p.titulo), head: p.branch, base, body: mascarar(p.corpo), draft: p.rascunho })));
    return { id: String(r.number), chave: `#${r.number}`, url: r.html_url, detalhes: { existente: false, base } };
  },
  async reconciliar(ctx, rec, p) { const a = await prDoRamo(ctx, rec, p.branch); return a ? { id: String(a.number), chave: `#${a.number}`, url: a.html_url, detalhes: { existente: true } } : null; }
};
export const operacoesGithub = [branchCriar, arquivoCommitar, prAbrir] as unknown as DefOperacao<unknown>[];
