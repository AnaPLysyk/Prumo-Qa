/** Edita uma rotina (o projeto não pode mudar) e recomeça a contagem dos horários a partir de agora. */
import { alterarRotina } from '../banco/alterarRotina.js';
import { anotarNaRotina } from './anotarNaRotina.js';
import { DadosRotina, dadosRotinaSchema } from '../tipos/rotina.js';

export function editarRotina(id: string, dados: DadosRotina, base?: string, agora = new Date()) {
  const d = dadosRotinaSchema.parse(dados);
  return alterarRotina(id, r => {
    if (d.espacoId !== r.espacoId) throw new Error('SCHEDULE_PROJECT_IMMUTABLE');
    Object.assign(r, d); r.ancora = agora.toISOString(); r.ultimoSlot = null; if (r.estado === 'CONCLUIDA') r.estado = 'ATIVA'; anotarNaRotina(r, 'EDITADA');
  }, base);
}
