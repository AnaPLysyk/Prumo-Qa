/** Conversa com um serviço (Jira, Qase ou GitHub): valida a conta, lista recursos e faz cada consulta da tela com o endereço certo. */
import { z } from 'zod';
import { ConfigServico, ContextoServico, OperacaoServico } from '../tipos/adaptador.js';
import { Filtros } from '../tipos/leituras.js';
import { TransporteEscrita, TransporteServico, paginaSchema } from '../tipos/transporte.js';
import { Recurso } from '../../projetos/contratos.js';
import { autenticarNoServico } from './autenticarNoServico.js';
import { consultarNoServico } from './consultarNoServico.js';
import { contextoDoAdaptador } from './contextoDoAdaptador.js';
import { enviarAoServico } from './requisicoes.js';
import { ErroServico } from './ErroServico.js';
import { instanciaServico } from './configuracaoDosServicos.js';
import { lerDoServico } from './requisicoes.js';
import { listarRecursosDoServico } from './listarRecursosDoServico.js';
import { obterRecursoDoServico } from './requisicoes.js';
import { procurarComentarioNoTicket } from './procurarComentarioNoTicket.js';
import { publicarComentarioNoTicket } from './publicarComentarioNoTicket.js';

// Cada método só chama o arquivo que faz o trabalho; a credencial fica em this.c e nunca é devolvida.
export class AdaptadorServico {
  constructor(readonly c: ConfigServico, readonly transporte: TransporteServico = lerDoServico, readonly escrita: TransporteEscrita = enviarAoServico) {
    if (instanciaServico(c.servico, c.instancia) !== c.instancia) throw new ErroServico('SERVICE_DESTINATION_BLOCKED');
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
