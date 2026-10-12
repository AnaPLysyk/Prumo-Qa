/** Monta o endereço do ticket no Jira (…/browse/CHAVE). */
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';

export const enderecoDoTicket = (ctx: ContextoServico, k: string) => `${ctx.instancia}/browse/${k}`;
