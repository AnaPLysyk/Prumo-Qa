/** Guarda a agenda de rotinas: leitura, gravação, busca, alteração e pausa geral. */
import { z } from 'zod';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { Registro, registro, Rotina, rotinaSchema } from '../tipos/rotina.js';

export const lerAgenda = (base?: string): Registro =>
  lerLocal<Registro>(
    'agenda.json',
    registro as unknown as z.ZodType<Registro>,
    { version: 1, pausaGlobal: false, rotinas: [] },
    base
  );

export const gravarAgenda = (agenda: Registro, base?: string) =>
  gravarLocal('agenda.json', registro.parse(agenda), base);

export const listarRotinas = (base?: string) => lerAgenda(base).rotinas;

export function obterRotina(id: string, base?: string) {
  const rotina = lerAgenda(base).rotinas.find(item => item.id === id);
  if (!rotina) throw new Error('SCHEDULE_NOT_FOUND');
  return rotina;
}

export function alterarRotina(id: string, alterar: (rotina: Rotina) => void, base?: string) {
  const agenda = lerAgenda(base);
  const rotina = agenda.rotinas.find(item => item.id === id);
  if (!rotina) throw new Error('SCHEDULE_NOT_FOUND');

  alterar(rotina);
  rotinaSchema.parse(rotina);
  gravarAgenda(agenda, base);
  return rotina;
}

export const agendaPausada = (base?: string) => lerAgenda(base).pausaGlobal;
