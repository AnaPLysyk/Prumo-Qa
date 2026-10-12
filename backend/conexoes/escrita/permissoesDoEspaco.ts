/** Mostra, para Jira, Qase e GitHub, se a escrita está ligada no projeto. */
import { escritaHabilitada } from './escritaHabilitada.js';

export const permissoesDoEspaco = (espacoId: string, b?: string) => (['jira', 'qase', 'github'] as const).map(s => ({ servico: s, escrita: escritaHabilitada(espacoId, s, b) }));
