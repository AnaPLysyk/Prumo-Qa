/** Operações do repositório GitHub e dados da origem — arquivos relacionados agrupados para manutenção. */
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { Recurso } from "../../projetos/contratos.js";
import { z } from "zod";
import { ContextoServico } from "../tipos/adaptador.js";
import { ErroServico } from "../integracoes/ErroServico.js";
import { sha40, criarBranch, commitar, abrirPr, criarIssue } from "../tipos/escritaGithub.js";
import { DefOperacao, Remoto } from "../tipos/operacao.js";
import { mascarar } from "../../compartilhado/seguranca/mascarar.js";
import { marcadorDaOperacao } from "../escrita/chaveDaOperacao.js";

// ── dadosDoGithub ──
export const caminhoDoRepositorio = (rec: Recurso) => `/repos/${rec.chave.split('/').map(codificarParaUrl).join('/')}`;

export async function dadosDoRepositorio(ctx: ContextoServico, rec: Recurso) {
  return z.object({ default_branch: z.string(), full_name: z.string(), id: z.number() }).passthrough().parse(await ctx.ler(caminhoDoRepositorio(rec)));
}

export async function commitAtualDoBranch(ctx: ContextoServico, rec: Recurso, r: string): Promise<string | null> {
  try { return z.object({ object: z.object({ sha: sha40 }).passthrough() }).passthrough().parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/git/ref/heads/${r.split('/').map(codificarParaUrl).join('/')}`)).object.sha; }
  catch (e) { if (e instanceof ErroServico && e.codigo === 'SERVICE_NOT_FOUND') return null; throw e; }
}

// ── fluxoRepositorio ──
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

// ── criarIssueNoGithub ──
type P = z.infer<typeof criarIssue>;

// O GitHub não renderiza comentário HTML: o marcador fica no corpo sem poluir a issue e permite reencontrá-la após resposta perdida.
const assinatura = (chave: string) => `<!-- ${marcadorDaOperacao(chave)} -->`;

const corpo = (p: P, chave: string) => `${mascarar(p.corpo).trim()}\n\n${assinatura(chave)}`.trimStart();

const normalizar = (s: unknown) => (typeof s === 'string' ? s.replace(/\r\n/g, '\n').trim() : null);

const issueSchema = z.object({
  number: z.number().int().positive(), html_url: z.string(), title: z.string(), body: z.string().nullable().optional(), state: z.string(),
  labels: z.array(z.union([z.string(), z.object({ name: z.string() }).passthrough()])).optional(), pull_request: z.unknown().optional()
}).passthrough();

type Issue = z.infer<typeof issueSchema>;

const nomesDosRotulos = (i: Issue) => (i.labels ?? []).map(l => (typeof l === 'string' ? l : l.name));

const mesma = (i: Issue, p: P, chave: string) => i.pull_request === undefined && i.title === mascarar(p.titulo) && normalizar(i.body) === normalizar(corpo(p, chave));

// Rótulos sem permissão de push são descartados em silêncio pelo GitHub: o Prumo registra isso em vez de fingir que aplicou.
const remoto = (i: Issue, p: P, existente: boolean): Remoto => {
  const aplicados = nomesDosRotulos(i);
  return { id: String(i.number), chave: `#${i.number}`, url: i.html_url, detalhes: { existente, rotulosPedidos: p.rotulos.length, rotulosAplicados: p.rotulos.filter(r => aplicados.includes(r)).length } };
};

const lerIssue = async (ctx: ContextoServico, rec: Recurso, numero: string) =>
  issueSchema.parse(await ctx.ler(`${caminhoDoRepositorio(rec)}/issues/${codificarParaUrl(numero)}`));

// Percorre páginas completas antes da primeira escrita. Uma lista truncada nunca pode autorizar um POST duplicado.
const procurarPeloMarcador = async (ctx: ContextoServico, rec: Recurso, chave: string) => {
  const encontrados: Issue[] = []; const vistos = new Set<number>();
  const tamanhoPagina = 100, maxPaginas = 20;
  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    const url = `${caminhoDoRepositorio(rec)}/issues?state=all&sort=created&direction=desc&per_page=${tamanhoPagina}&page=${pagina}`;
    const itens = z.array(issueSchema).max(tamanhoPagina).parse(await ctx.ler(url));
    for (const issue of itens) {
      if (vistos.has(issue.number)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
      vistos.add(issue.number);
      if (issue.pull_request === undefined && typeof issue.body === 'string' && issue.body.includes(assinatura(chave))) encontrados.push(issue);
    }
    if (encontrados.length > 1) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    if (itens.length < tamanhoPagina) return encontrados;
  }
  // Repositórios com mais de 2.000 issues precisam de busca verificável antes de criar outra.
  throw new ErroServico('SERVICE_RESPONSE_LIMIT');
};

export const criarIssueNoGithub: DefOperacao<P> = {
  id: 'github.criar_issue', servico: 'github', rotulo: 'Publicar issue no GitHub',
  efeito: 'Cria uma issue somente no repositório GitHub vinculado, depois de confirmação nativa. Não dispara GitHub Actions nem altera código.',
  exigeConfirmacao: true, schema: criarIssue,
  resumo: p => `Publicar issue "${p.titulo}" no GitHub${p.rotulos.length ? ` (rótulos: ${p.rotulos.join(', ')})` : ''}`,
  async executar(ctx, rec, p, chave) {
    const ja = await procurarPeloMarcador(ctx, rec, chave);
    if (ja.length > 1) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    if (ja[0]) { if (!mesma(ja[0], p, chave)) throw new ErroServico('SERVICE_RESPONSE_INVALID'); return remoto(ja[0], p, true); }
    const r = issueSchema.parse(await ctx.enviar('POST', `${caminhoDoRepositorio(rec)}/issues`, JSON.stringify({ title: mascarar(p.titulo), body: corpo(p, chave), labels: p.rotulos })));
    return remoto(r, p, false);
  },
  async reconciliar(ctx, rec, p, chave, anterior) {
    if (anterior?.id) {
      const i = await lerIssue(ctx, rec, anterior.id);
      if (!mesma(i, p, chave)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
      return remoto(i, p, true);
    }
    const encontradas = await procurarPeloMarcador(ctx, rec, chave);
    if (encontradas.length > 1) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    const i = encontradas[0];
    if (!i) return null;
    if (!mesma(i, p, chave)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
    return remoto(i, p, true);
  },
  async confirmar(ctx, rec, p, r, chave) {
    if (!r.id || !/^\d{1,15}$/.test(r.id)) return false;
    const i = await lerIssue(ctx, rec, r.id);
    return String(i.number) === r.id && mesma(i, p, chave);
  }
};
