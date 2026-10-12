/** Lista as publicações de comentário no Jira. */
import { lerPublicacoesJira } from './lerPublicacoesJira.js';

export const listarPublicacoes = (b?: string) => lerPublicacoesJira(b).itens;
