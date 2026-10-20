/** Pausa uma rotina ativa. */
import { alterarRotina } from '../banco/agenda.js';
import { anotarNaRotina } from './anotarNaRotina.js';

export const pausarRotina = (id: string, base?: string) => alterarRotina(id, r => { if (r.estado === 'ATIVA') { r.estado = 'PAUSADA'; anotarNaRotina(r, 'PAUSADA'); } }, base);
