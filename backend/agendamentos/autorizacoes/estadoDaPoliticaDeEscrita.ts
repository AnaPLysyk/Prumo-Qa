/** Diz o estado de uma política de escrita no Qase. */
import { PoliticaEscrita } from '../tipos/autorizacoes.js';

export const estadoDaPoliticaDeEscrita = (p: PoliticaEscrita, agora = new Date()) => p.revogadaEm ? 'REVOGADA' : Date.parse(p.validaAte) <= agora.getTime() ? 'EXPIRADA' : p.usos >= p.maxUsos ? 'ESGOTADA' : 'VIGENTE';
