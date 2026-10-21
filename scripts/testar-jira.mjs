/**
 * Teste real do Jira com o código do próprio Prumo (somente leitura: nada é criado, editado ou comentado).
 * O token vem só de variável de ambiente, nunca de argumento nem de arquivo, e nunca é impresso.
 *
 *   Token de API:  $env:JIRA_SITE='empresa'; $env:JIRA_EMAIL='voce@empresa.com'; $env:JIRA_TOKEN='...'; node scripts/testar-jira.mjs [CHAVE]
 *   OAuth (teste): $env:JIRA_SITE='empresa'; $env:JIRA_CLOUD_ID='<uuid>'; $env:JIRA_OAUTH_TOKEN='...'; node scripts/testar-jira.mjs [CHAVE]
 *
 * CHAVE (opcional) escolhe o projeto, por exemplo KAN; sem ela usa o primeiro que a conta enxerga. Rode depois de `npm run build`.
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const carregar = (arquivo) => import(pathToFileURL(path.join(raiz, 'dist', arquivo)).href);
const { AdaptadorServico } = await carregar('conexoes/integracoes/AdaptadorServico.js');
const { enderecoDoSiteJira, instanciaServico } = await carregar('conexoes/integracoes/configuracaoDosServicos.js');
const { lerDoServico, enviarAoServico } = await carregar('conexoes/integracoes/requisicoes.js');

const env = process.env;
const oauth = !!env.JIRA_OAUTH_TOKEN;
const token = oauth ? env.JIRA_OAUTH_TOKEN : env.JIRA_TOKEN;
if (!env.JIRA_SITE || !token || (oauth ? !env.JIRA_CLOUD_ID : !env.JIRA_EMAIL)) {
  console.error('Faltam variáveis. Veja o início de scripts/testar-jira.mjs (JIRA_SITE, JIRA_EMAIL e JIRA_TOKEN; ou JIRA_CLOUD_ID e JIRA_OAUTH_TOKEN).');
  process.exit(2);
}
let instancia;
try { instancia = instanciaServico('jira', enderecoDoSiteJira(env.JIRA_SITE)); }
catch { console.error('JIRA_SITE inválido: use só o nome (empresa) ou empresa.atlassian.net.'); process.exit(2); }
const base = { id: 'teste-real', servico: 'jira', instancia, token, ...(oauth ? { oauth: true, nuvem: env.JIRA_CLOUD_ID } : { usuario: env.JIRA_EMAIL }) };
const adaptador = (contaId = 'pendente') => new AdaptadorServico({ ...base, contaId }, lerDoServico, enviarAoServico);

const resultados = [];
const passo = async (nome, fn) => {
  const inicio = Date.now();
  try { const detalhe = await fn(); resultados.push({ nome, ok: true, detalhe, ms: Date.now() - inicio }); return true; }
  catch (e) { resultados.push({ nome, ok: false, detalhe: String(e?.codigo ?? e?.message ?? e), ms: Date.now() - inicio }); return false; }
};

console.log(`Jira ${instancia} · ${oauth ? 'OAuth (api.atlassian.com)' : 'token de API'} · somente leitura\n`);
let identidade, recurso, ticket;
if (await passo('Autenticar (myself)', async () => { identidade = await adaptador().autenticar(); return identidade.nome; })) {
  const a = adaptador(identidade.contaId);
  let projetos = [];
  await passo('Listar projetos', async () => { const r = await a.listar({ limite: 50 }); projetos = r.recursos; return `${r.recursos.length} projeto(s): ${r.recursos.slice(0, 6).map(x => x.chave).join(', ')}`; });
  const escolhido = projetos.find(p => p.chave === (process.argv[2] || '').toUpperCase()) ?? projetos[0];
  if (escolhido && await passo(`Abrir projeto ${escolhido.chave}`, async () => { recurso = await a.obterRecurso(escolhido.id); return `${recurso.nome} (id ${recurso.id})`; })) {
    const consultar = (op, pagina = { limite: 5 }, id) => a.consultar(recurso, op, pagina, id);
    await passo('Tickets do projeto', async () => { const r = await consultar('tickets'); ticket = r.dados[0]; return `${r.dados.length} ticket(s)${ticket ? ', primeiro ' + ticket.key : ''}`; });
    await passo('Campos do Jira', async () => `${(await consultar('campos', { limite: 100 })).dados.length} campo(s)`);
    await passo('Tipos para criar (bug, melhoria...)', async () => { const r = await consultar('metadados'); return `${Array.isArray(r.dados) ? r.dados.length : Object.keys(r.dados ?? {}).length} item(ns)`; });
    if (ticket) {
      await passo(`Ler ${ticket.key}`, async () => { const r = await consultar('ticket', {}, ticket.key); return String(r.dados?.fields?.summary ?? 'ok').slice(0, 60); });
      await passo(`Comentários de ${ticket.key}`, async () => `${(await consultar('comentarios', { limite: 5 }, ticket.key)).dados.length} comentário(s)`);
      await passo(`Transições de ${ticket.key}`, async () => `${(await consultar('transicoes', {}, ticket.key)).dados.length} transição(ões)`);
      await passo(`Histórico de ${ticket.key}`, async () => `${(await consultar('historico', { limite: 5 }, ticket.key)).dados.length} entrada(s)`);
    }
  }
}
for (const r of resultados) console.log(`${r.ok ? 'OK    ' : 'FALHOU'}  ${r.nome.padEnd(38)} ${String(r.detalhe).slice(0, 90)}  (${r.ms} ms)`);
const falhas = resultados.filter(r => !r.ok).length;
console.log(`\n${resultados.length - falhas} de ${resultados.length} passos OK.${falhas ? ' Mande a lista acima (sem token) para eu corrigir.' : ''}`);
process.exit(falhas ? 1 : 0);
