/** Escreve o marcador [prumo-…] colocado no comentário para reconhecê-lo depois. */
import { marcadorDaOperacao } from '../../conexoes/escrita/marcadorDaOperacao.js';

export const marcadorNoComentario = (k: string) => `[${marcadorDaOperacao(k)}]`;
