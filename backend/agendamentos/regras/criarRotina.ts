/** Cria uma rotina agendada, recusando horário único no passado e mais de 200 rotinas. */
import { randomUUID } from 'node:crypto';
import { gravarAgenda } from '../banco/gravarAgenda.js';
import { lerAgenda } from '../banco/lerAgenda.js';
import { anotarNaRotina } from './anotarNaRotina.js';
import { DadosRotina, Rotina, dadosRotinaSchema, rotinaSchema } from '../tipos/rotina.js';

export function criarRotina(dados: DadosRotina, base?: string, agora = new Date()): Rotina {
  const d = dadosRotinaSchema.parse(dados); const reg = lerAgenda(base);
  if (reg.rotinas.length >= 200) throw new Error('SCHEDULE_LIMIT');
  if (d.frequencia.tipo === 'unico' && Date.parse(d.frequencia.em) <= agora.getTime()) throw new Error('SCHEDULE_IN_THE_PAST');
  const r: Rotina = { ...d, id: randomUUID(), estado: 'ATIVA', ancora: agora.toISOString(), ultimoSlot: null, criadaEm: agora.toISOString(), historico: [] };
  anotarNaRotina(r, 'CRIADA'); reg.rotinas.push(rotinaSchema.parse(r)); gravarAgenda(reg, base); return r;
}
