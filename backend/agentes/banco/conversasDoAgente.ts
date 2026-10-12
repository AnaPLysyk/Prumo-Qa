/** Lista as conversas antigas de um agente, das mais novas para as mais antigas. */
import { lerConversas } from './lerConversas.js';

/** Conversas de um agente (mais recentes primeiro), para o Cérebro. */
export const conversasDoAgente = (espacoId: string | null, agente: string, limite = 40, base?: string) => lerConversas(espacoId, base).filter((r) => r.agente === agente).reverse().slice(0, limite);
