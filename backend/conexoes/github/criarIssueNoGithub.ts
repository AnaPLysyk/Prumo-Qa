/** Operação "Publicar issue no GitHub" (bug ou melhoria), com marcador de idempotência e confirmação por GET. */
import { z } from 'zod';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { codificarParaUrl } from '../../compartilhado/texto.js';
import { marcadorDaOperacao } from '../escrita/chaveDaOperacao.js';
import { ErroServico } from '../integracoes/ErroServico.js';
import { ContextoServico } from '../tipos/adaptador.js';
import { criarIssue } from '../tipos/escritaGithub.js';
import { DefOperacao, Remoto } from '../tipos/operacao.js';
import { Recurso } from '../../projetos/contratos.js';
import { caminhoDoRepositorio } from './dadosDoGithub.js';

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
