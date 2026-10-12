/** Marca a proposta como publicada e guarda o endereço do item criado no Jira ou Qase. */
import { alterarProposta } from '../banco/alterarProposta.js';

export const marcarPublicada = (id: string, remoto: { id?: string; chave?: string; url?: string }, b?: string) => alterarProposta(id, p => { p.estado = 'PUBLICADA'; p.remoto = remoto; }, b);
