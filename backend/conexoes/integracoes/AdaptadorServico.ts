/** Adaptador das integrações: autenticação, leitura, comentário e publicação. */
import { z } from "zod";
import { PartesDoAdaptador, nome, obj, paginaQase, sid, ConfigServico, ContextoServico, OperacaoServico } from "../tipos/adaptador.js";
import { ErroServico } from "./configuracaoDosServicos.js";
import { lerComCredencial, enviarAoServico, lerDoServico, obterRecursoDoServico } from "./requisicoes.js";
import { limparRespostaDoServico, textoRemoto } from "./configuracaoDosServicos.js";
import { Recurso } from "../../projetos/contratos.js";
import { consultarNoServico } from "./leiturasDeServicos.js";
import { codificarParaUrl } from "../../compartilhado/texto.js";
import { cabecalhosDoServico, instanciaServico } from "./configuracaoDosServicos.js";
import { Filtros } from "../tipos/adaptador.js";
import { TransporteEscrita, TransporteServico, paginaSchema } from "../tipos/adaptador.js";
import { contextoDoAdaptador, listarRecursosDoServico } from "./leiturasDeServicos.js";

// autenticarNoServico — responsabilidade deste trecho
export async function autenticarNoServico(a: PartesDoAdaptador) {
  try {
    if (a.c.servico === 'jira') { const r = obj.parse(await lerComCredencial(a, '/rest/api/3/myself')); const contaId = z.string().regex(/^[A-Za-z0-9:-]{1,128}$/).parse(r.accountId); if (contaId === a.c.token) throw new Error(); return { contaId, nome: limparRespostaDoServico(a.c, nome.parse(r.displayName)) as string }; }
    if (a.c.servico === 'github') { const r = obj.parse(await lerComCredencial(a, '/user')); const contaId = sid.parse(r.id); if (!/^\d{1,20}$/.test(contaId) || contaId === a.c.token) throw new Error(); return { contaId, nome: limparRespostaDoServico(a.c, nome.parse(r.login)) as string }; }
    // API v1 Qase não fornece /me nem ID de conta em Project. Não inventar principal remoto.
    paginaQase.parse(await lerComCredencial(a, '/v1/project?limit=1&offset=0'));
    return { contaId: 'conexao-local:' + a.c.id, nome: 'Qase (escopo desta conexão; conta não informada pelo Qase)' };
  } catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}

// procurarComentarioNoTicket — responsabilidade deste trecho
export async function procurarComentarioNoTicket(a: PartesDoAdaptador, r: Recurso, ticket: string, marcador: string): Promise<string | null> {
  let offset = 0;
  for (let i = 0; i < 5; i++) {
    const pag = await consultarNoServico(a, r, 'comentarios', { offset, limite: 100 }, ticket);
    for (const c of pag.dados as Record<string, unknown>[]) { if (textoRemoto(c.body).includes(marcador)) return String(c.id); }
    if (typeof pag.proxima !== 'number') return null; offset = pag.proxima;
  }
  return null;
}

// publicarComentarioNoTicket — responsabilidade deste trecho
export async function publicarComentarioNoTicket(a: PartesDoAdaptador, r: Recurso, ticket: string, adf: unknown): Promise<{ id: string }> {
  if (a.c.servico !== 'jira' || !a.c.token) throw new ErroServico('SERVICE_WRITE_BLOCKED');
  if (!/^[A-Z][A-Z0-9_]*-\d+$/.test(ticket)) throw new ErroServico('SERVICE_RESPONSE_INVALID');
  await consultarNoServico(a, r, 'ticket', {}, ticket);
  let resposta: unknown;
  try { resposta = await a.escrita({ servico: 'jira', instancia: a.c.instancia, ...(a.c.nuvem ? { nuvem: a.c.nuvem } : {}), caminho: '/rest/api/3/issue/' + codificarParaUrl(ticket) + '/comment', headers: cabecalhosDoServico(a.c), corpo: JSON.stringify({ body: adf }) }); }
  catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_UNAVAILABLE'); }
  try { return { id: z.string().regex(/^\d{1,20}$/).parse(obj.parse(resposta).id) }; } catch { throw new ErroServico('SERVICE_RESPONSE_INVALID'); }
}

// AdaptadorServico — responsabilidade deste trecho
// Cada método só chama o arquivo que faz o trabalho; a credencial fica em this.c e nunca é devolvida.
export class AdaptadorServico {
  constructor(readonly c: ConfigServico, readonly transporte: TransporteServico = lerDoServico, readonly escrita: TransporteEscrita = enviarAoServico) {
    if (instanciaServico(c.servico, c.instancia) !== c.instancia) throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
    if (c.nuvem && c.servico !== 'jira') throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
  }
  /** Contexto mínimo dos módulos de escrita (Jira, Qase, GitHub): a credencial nunca sai daqui. */
  contexto(): ContextoServico { return contextoDoAdaptador(this); }
  publicarComentario(r: Recurso, ticket: string, adf: unknown) { return publicarComentarioNoTicket(this, r, ticket, adf); }
  procurarComentario(r: Recurso, ticket: string, marcador: string) { return procurarComentarioNoTicket(this, r, ticket, marcador); }
  autenticar() { return autenticarNoServico(this); }
  listar(pagina: z.input<typeof paginaSchema> = {}) { return listarRecursosDoServico(this, pagina); }
  obterRecurso(id: string) { return obterRecursoDoServico(this, id); }
  consultar(r: Recurso, operacao: OperacaoServico, pagina: z.input<typeof paginaSchema> = {}, id?: string, campoAceite?: string, filtros?: Filtros) { return consultarNoServico(this, r, operacao, pagina, id, campoAceite, filtros); }
}
