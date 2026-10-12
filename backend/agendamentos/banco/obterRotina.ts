/** Busca uma rotina pelo id; se não existe, avisa SCHEDULE_NOT_FOUND. */
import { lerAgenda } from './lerAgenda.js';

export function obterRotina(id: string, base?: string) { const r = lerAgenda(base).rotinas.find(x => x.id === id); if (!r) throw new Error('SCHEDULE_NOT_FOUND'); return r; }
