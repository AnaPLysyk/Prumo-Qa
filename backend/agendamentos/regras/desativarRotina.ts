/** Desativa uma rotina. */
import { alterarRotina } from '../banco/agenda.js';
import { anotarNaRotina } from './anotarNaRotina.js';

export const desativarRotina = (id: string, base?: string) => alterarRotina(id, r => { r.estado = 'DESATIVADA'; anotarNaRotina(r, 'DESATIVADA'); }, base);
