/** Procura um comentário já publicado pelo Prumo (pelo marcador), para não publicar duas vezes. */
import { ContextoServico } from '../../conexoes/tipos/adaptador.js';
import { Remoto } from '../../conexoes/tipos/operacao.js';
import { comentariosDoTicket } from './comentariosDoTicket.js';
import { enderecoDoTicket } from './enderecoDoTicket.js';
import { marcadorNoComentario } from './marcadorNoComentario.js';

export const acharComentarioDoPrumo = async (ctx: ContextoServico, t: string, k: string): Promise<Remoto | null> => { const c = (await comentariosDoTicket(ctx, t)).find(x => JSON.stringify(x.body).includes(marcadorNoComentario(k))); return c ? { id: c.id, chave: t, url: enderecoDoTicket(ctx, t) } : null; };
