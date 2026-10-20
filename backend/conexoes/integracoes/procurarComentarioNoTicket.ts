/** Procura um marcador nos comentários do ticket (até 500), para não duplicar o comentário depois de uma falha de rede. */
import { Recurso } from '../../projetos/contratos.js';
import { PartesDoAdaptador } from '../tipos/adaptador.js';
import { consultarNoServico } from './consultarNoServico.js';
import { textoRemoto } from './textoRemoto.js';

export async function procurarComentarioNoTicket(a: PartesDoAdaptador, r: Recurso, ticket: string, marcador: string): Promise<string | null> {
  let offset = 0;
  for (let i = 0; i < 5; i++) {
    const pag = await consultarNoServico(a, r, 'comentarios', { offset, limite: 100 }, ticket);
    for (const c of pag.dados as Record<string, unknown>[]) { if (textoRemoto(c.body).includes(marcador)) return String(c.id); }
    if (typeof pag.proxima !== 'number') return null; offset = pag.proxima;
  }
  return null;
}
