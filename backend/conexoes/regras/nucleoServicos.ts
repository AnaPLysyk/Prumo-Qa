/** Núcleo das conexões e fachada de aplicação — arquivos relacionados agrupados para manutenção. */
import { z } from "zod";
import { cofreCredenciais } from "../banco/credenciais.js";
import { listarContas, lerContasDeServico, gravarContasDeServico } from "../banco/contasDeServico.js";
import { enviarAoServico, lerDoServico } from "../integracoes/requisicoes.js";
import { ContextoServico, OperacaoServico } from "../tipos/adaptador.js";
import { ContextoDosServicos, CredencialOAuth, RenovadorOAuth, RevogadorOAuth, conexaoEntrada } from "../tipos/contaDeServico.js";
import { Protetor } from "../tipos/adaptador.js";
import { Filtros } from "../tipos/adaptador.js";
import { TransporteEscrita, TransporteServico, paginaSchema } from "../tipos/adaptador.js";
import { Recurso, Servico } from "../../projetos/contratos.js";
import { adicionarConta, adicionarContaOAuth, trocarToken, adaptadorDaConta, contaAtiva, contaAtivaRenovada, credencialOAuthDaConta, verificarVinculoDoServico, codigoDoErroDeServico, vinculoDoServico } from "../servicoContas.js";
import { importarProjetosQase } from "./importarProjetosQase.js";
import { descobrirSiteDoJira } from "./descobrirSiteDoJira.js";
import { obterEspaco, listarEspacos } from "../../projetos/banco/projetos.js";
import { vincularServicoAoEspaco, criarEspaco, atualizarEstadoDoVinculo, registrarConsultaExterna, configurarAceite } from "../../projetos/servicoProjetos.js";
import { ErroServico } from "../integracoes/configuracaoDosServicos.js";
import { safeStorage } from "electron";
import { protetorDoSistema } from "../servicoContas.js";
import { renovarPeloServico, revogarPeloServico } from "../integracoes/servicoDeAutorizacao.js";

// ── nucleoServicos ──
async function comentarNoJira(c: ContextoDosServicos, espacoId: string, ticket: string, adf: unknown) {
  try {
    const v = await verificarVinculoDoServico(c, espacoId, 'jira');
    const r = await v.adaptador.publicarComentario(v.recurso, ticket, adf);
    registrarConsultaExterna(espacoId, 'jira', 'COMMENT_OK', c.base);
    const vi = vinculoDoServico(c, espacoId, 'jira');
    return { ...r, vinculoId: vi.id, conexaoId: vi.conexaoId };
  } catch (e) { registrarConsultaExterna(espacoId, 'jira', codigoDoErroDeServico(e), c.base); throw e; }
}

async function consultarServico(c: ContextoDosServicos, espacoId: string, servico: Servico, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, filtros?: Filtros) {
  try {
    const v = await verificarVinculoDoServico(c, espacoId, servico);
    const r = await v.adaptador.consultar(v.recurso, operacao, pagina, id, v.campoAceite, filtros);
    registrarConsultaExterna(espacoId, servico, 'OK', c.base); return r;
  } catch (e) { registrarConsultaExterna(espacoId, servico, codigoDoErroDeServico(e), c.base); throw e; }
}

async function escolherCampoAceite(c: ContextoDosServicos, espacoId: string, campo: string) {
  const v = await verificarVinculoDoServico(c, espacoId, 'jira'); const r = await v.adaptador.consultar(v.recurso, 'campos');
  if (!Array.isArray(r.dados) || !r.dados.some(x => x.id === campo && x.custom === true)) throw new Error('JIRA_FIELD_NOT_AVAILABLE');
  return configurarAceite(espacoId, campo, c.base);
}

async function executarComServico<T>(c: ContextoDosServicos, espacoId: string, servico: Servico, fn: (ctx: ContextoServico, recurso: Recurso, info: { vinculoId: string; conexaoId: string }) => Promise<T>): Promise<T> {
  const v = await verificarVinculoDoServico(c, espacoId, servico); const vi = vinculoDoServico(c, espacoId, servico);
  try { return await fn(v.adaptador.contexto(), v.recurso, { vinculoId: vi.id, conexaoId: vi.conexaoId }); }
  catch (e) { registrarConsultaExterna(espacoId, servico, codigoDoErroDeServico(e), c.base); throw e; }
}

async function listarRecursosDaConta(c: ContextoDosServicos, id: string, pagina: z.input<typeof paginaSchema> = {}) {
  return adaptadorDaConta(c, await contaAtivaRenovada(c, id)).listar(pagina);
}

/** Cada recurso selecionado origina um projeto Prumo isolado; nunca associa outras contas por nome. */
async function importarRecursoComoProjeto(c: ContextoDosServicos, conexaoId: string, informado: Recurso) {
  const conta = await contaAtivaRenovada(c, conexaoId);
  const adaptador = adaptadorDaConta(c, conta);
  const identidade = await adaptador.autenticar();
  if (identidade.contaId !== conta.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  const recurso = await adaptador.obterRecurso(informado.id);
  if (JSON.stringify(recurso) !== JSON.stringify(informado)) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  if (conta.servico === 'qase' && listarEspacos(c.base).some(e => e.vinculos.some(v => v.servico === 'qase' && v.recurso.instancia === recurso.instancia && v.recurso.chave === recurso.chave && v.conexaoId !== conta.id))) throw new Error('QASE_PROJECT_AMBIGUOUS');
  const existente = listarEspacos(c.base).find(e => e.vinculos.some(v =>
    v.servico === conta.servico && v.recurso.instancia === recurso.instancia &&
    v.recurso.contaId === recurso.contaId && v.recurso.id === recurso.id));
  if (existente) return { projeto: existente, criado: false };
  const projeto = await criarEspaco({nome: recurso.nome, descricao: ''}, c.base, {servico:conta.servico,conexaoId:conta.id,recurso});
  return { projeto, criado: true };
}

async function procurarComentarioNoJira(c: ContextoDosServicos, espacoId: string, ticket: string, marcador: string) {
  const v = await verificarVinculoDoServico(c, espacoId, 'jira');
  return v.adaptador.procurarComentario(v.recurso, ticket, marcador);
}

/** Conexão OAuth: pede ao provedor que revogue a autorização (quando a API permite); falha de rede não impede a remoção local. */
async function revogarAutorizacaoExterna(c: ContextoDosServicos, id: string) {
  const conta = lerContasDeServico(c.base).contas.find(x => x.id === id);
  if (!conta || conta.autenticacao !== 'oauth' || !c.revogar) return;
  try { await c.revogar(conta.servico, credencialOAuthDaConta(c, conta).acesso); } catch { /* a credencial local é apagada de qualquer forma */ }
}

async function removerConta(c: ContextoDosServicos, id: string) {
  await revogarAutorizacaoExterna(c, id);
  const r = lerContasDeServico(c.base); const conta = r.contas.find(x => x.id === id); if (!conta) throw new Error('CONNECTION_NOT_FOUND');
  conta.ativa = false; gravarContasDeServico(r, c.base); c.cofre.remover(id);
  for (const e of listarEspacos(c.base)) for (const v of e.vinculos) if (v.conexaoId === id) atualizarEstadoDoVinculo(e.id, v.servico, 'SEM_CREDENCIAL', 'CREDENTIAL_UNAVAILABLE', undefined, c.base);
  return { removida: true };
}

async function validarConta(c: ContextoDosServicos, id: string) {
  const conta = await contaAtivaRenovada(c, id); const atual = await adaptadorDaConta(c, conta).autenticar();
  if (atual.contaId !== conta.contaId) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  const r = lerContasDeServico(c.base); r.contas.find(x => x.id === id)!.validadaEm = new Date().toISOString(); gravarContasDeServico(r, c.base);
  return contaAtiva(c, id);
}

async function validarVinculoDoServico(c: ContextoDosServicos, espacoId: string, servico: Servico) {
  await verificarVinculoDoServico(c, espacoId, servico, true);
  return obterEspaco(espacoId, c.base);
}

async function vincularRecursoAoEspaco(c: ContextoDosServicos, espacoId: string, conexaoId: string, recurso: Recurso) {
  obterEspaco(espacoId, c.base); const conta = await contaAtivaRenovada(c, conexaoId);
  const atual = await adaptadorDaConta(c, conta).obterRecurso(recurso.id);
  if (JSON.stringify(atual) !== JSON.stringify(recurso)) throw new ErroServico('SERVICE_SCOPE_CHANGED');
  return vincularServicoAoEspaco(espacoId, conta.servico, conta.id, atual, c.base);
}

/** Dependências só do processo principal. Testes fornecem doubles; nenhum toggle em produção. Cada ação fica no seu arquivo. */
export function nucleoServicos(protetor: Protetor, transporte: TransporteServico = lerDoServico, base?: string, escrita: TransporteEscrita = enviarAoServico, oauth: { renovar?: RenovadorOAuth; revogar?: RevogadorOAuth } = {}) {
  const c: ContextoDosServicos = { protetor, transporte, escrita, base, cofre: cofreCredenciais(protetor, base), ...oauth };
  const importacaoQase = importarProjetosQase(c);
  // Serializa cadastros de recursos para que dois cliques simultâneos não criem espaços duplicados.
  let filaImportacao: Promise<unknown> = Promise.resolve();
  const importarProjeto = (conexaoId: string, recurso: Recurso) => {
    const atual = filaImportacao.then(() => importarRecursoComoProjeto(c, conexaoId, recurso));
    filaImportacao = atual.then(() => undefined, () => undefined);
    return atual;
  };
  return {
    contas: () => listarContas(base),
    qasePrever: (token: string) => importacaoQase.prever(token),
    qasePreverConta: (conexaoId: string) => importacaoQase.preverConta(conexaoId),
    qaseImportar: (previaId: string, codigos: string[]) => importacaoQase.importar(previaId, codigos),
    qaseConectar: (previaId: string) => importacaoQase.conectar(previaId),
    /** Só com o token: acha o site Jira pelo e-mail e pelas conexões que a pessoa já tem. */
    jiraDescobrir: (token: string, emails: string[]) => descobrirSiteDoJira(c, { token, emails: [...emails, ...listarContas(base).filter(x => x.ativa && x.servico === 'jira' && x.usuario).map(x => x.usuario!)], conhecidos: listarContas(base).filter(x => x.ativa && x.servico === 'jira').map(x => new URL(x.instancia).hostname.replace(/\.atlassian\.net$/, '')) }),
    qaseCancelar: (previaId: string) => importacaoQase.cancelar(previaId),
    limparPrevias: () => importacaoQase.limparTodas(),
    adicionar: (entrada: z.input<typeof conexaoEntrada>) => adicionarConta(c, entrada),
    adicionarOAuth: (entrada: { servico: 'github' | 'jira'; nome?: string; instancia?: string; nuvem?: string; credencial: CredencialOAuth }) => adicionarContaOAuth(c, entrada),
    validarConta: (id: string) => validarConta(c, id),
    removerConta: (id: string) => removerConta(c, id),
    trocarToken: (id: string, token: string) => trocarToken(c, id, token),
    listar: (id: string, pagina: z.input<typeof paginaSchema> = {}) => listarRecursosDaConta(c, id, pagina),
    importarProjeto,
    vincular: (espacoId: string, conexaoId: string, recurso: Recurso) => vincularRecursoAoEspaco(c, espacoId, conexaoId, recurso),
    validarVinculo: (espacoId: string, servico: Servico) => validarVinculoDoServico(c, espacoId, servico),
    consultar: (espacoId: string, servico: Servico, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, filtros?: Filtros) => consultarServico(c, espacoId, servico, operacao, pagina, id, filtros),
    comContexto: <T>(espacoId: string, servico: Servico, fn: (ctx: ContextoServico, recurso: Recurso, info: { vinculoId: string; conexaoId: string }) => Promise<T>) => executarComServico(c, espacoId, servico, fn),
    comentarJira: (espacoId: string, ticket: string, adf: unknown) => comentarNoJira(c, espacoId, ticket, adf),
    procurarComentarioJira: (espacoId: string, ticket: string, marcador: string) => procurarComentarioNoJira(c, espacoId, ticket, marcador),
    campoAceite: (espacoId: string, campo: string) => escolherCampoAceite(c, espacoId, campo),
  };
}

// ── servicosDoAplicativo ──
export const servicosDoAplicativo=nucleoServicos(protetorDoSistema(safeStorage), undefined, undefined, undefined, { renovar: renovarPeloServico, revogar: revogarPeloServico });
