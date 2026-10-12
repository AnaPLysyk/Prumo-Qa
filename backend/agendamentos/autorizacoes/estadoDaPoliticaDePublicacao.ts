/** Diz o estado de uma política de publicação no Jira. */
import { PoliticaPublicacao } from '../tipos/autorizacoes.js';

export function estadoDaPoliticaDePublicacao(p: PoliticaPublicacao, agora = new Date()) { return p.revogadaEm ? 'REVOGADA' : Date.parse(p.validaAte) <= agora.getTime() ? 'EXPIRADA' : p.usadas >= p.maxPublicacoes ? 'ESGOTADA' : 'VIGENTE'; }
