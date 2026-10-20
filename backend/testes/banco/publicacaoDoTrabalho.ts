/** Busca a publicação de comentário de uma execução. */
import { lerPublicacoesJira } from './publicacoesJira.js';

export const publicacaoDoTrabalho = (id: string, b?: string) => lerPublicacoesJira(b).itens.find(x => x.trabalhoId === id) ?? null;
