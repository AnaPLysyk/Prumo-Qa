/** Exclui uma rotina (as execuções já registradas continuam no histórico). */
import { gravarAgenda } from '../banco/gravarAgenda.js';
import { lerAgenda } from '../banco/lerAgenda.js';

export function excluirRotina(id: string, base?: string) { const reg = lerAgenda(base); if (!reg.rotinas.some(r => r.id === id)) throw new Error('SCHEDULE_NOT_FOUND'); reg.rotinas = reg.rotinas.filter(r => r.id !== id); gravarAgenda(reg, base); return { excluida: true }; }
