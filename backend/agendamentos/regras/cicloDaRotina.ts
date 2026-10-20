/** Ciclo de vida das rotinas agendadas: criação, edição e histórico. */
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Rotina, evento, DadosRotina, dadosRotinaSchema, rotinaSchema } from '../tipos/rotina.js';
import { gravarAgenda, lerAgenda, alterarRotina } from '../repositorioAgenda.js';

/** Anota a ação e preserva somente os últimos 200 eventos. */
export function anotarNaRotina(rotina: Rotina, acao: z.infer<typeof evento>['acao']) {
  rotina.historico.push({ at: new Date().toISOString(), acao });
  rotina.historico = rotina.historico.slice(-200);
}

export function criarRotina(dados: DadosRotina, base?: string, agora = new Date()): Rotina {
  const validado = dadosRotinaSchema.parse(dados);
  const agenda = lerAgenda(base);
  if (agenda.rotinas.length >= 200) throw new Error('SCHEDULE_LIMIT');
  if (validado.frequencia.tipo === 'unico' && Date.parse(validado.frequencia.em) <= agora.getTime()) {
    throw new Error('SCHEDULE_IN_THE_PAST');
  }
  const rotina: Rotina = {
    ...validado,
    id: randomUUID(),
    estado: 'ATIVA',
    ancora: agora.toISOString(),
    ultimoSlot: null,
    criadaEm: agora.toISOString(),
    historico: []
  };
  anotarNaRotina(rotina, 'CRIADA');
  agenda.rotinas.push(rotinaSchema.parse(rotina));
  gravarAgenda(agenda, base);
  return rotina;
}

/** Mantém o projeto original e reinicia os horários após edição. */
export function editarRotina(id: string, dados: DadosRotina, base?: string, agora = new Date()) {
  const validado = dadosRotinaSchema.parse(dados);
  return alterarRotina(id, rotina => {
    if (validado.espacoId !== rotina.espacoId) {
      throw new Error('SCHEDULE_PROJECT_IMMUTABLE');
    }
    Object.assign(rotina, validado);
    rotina.ancora = agora.toISOString();
    rotina.ultimoSlot = null;
    if (rotina.estado === 'CONCLUIDA') rotina.estado = 'ATIVA';
    anotarNaRotina(rotina, 'EDITADA');
  }, base);
}
