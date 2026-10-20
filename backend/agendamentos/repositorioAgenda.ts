/** Persistência de agendamentos: operações relacionadas no mesmo módulo. */
import { z } from "zod";
import { lerLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { gravarLocal } from "../compartilhado/banco/persistenciaLocal.js";
import { Registro, registro, Rotina, rotinaSchema } from "./tipos/rotina.js";
import { EstadoRot, estadoRot } from "./tipos/worker.js";

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

export const lerEstadoDasRotinas = (base?: string): EstadoRot =>
  lerLocal<EstadoRot>(
    'agenda-estado.json',
    estadoRot,
    { version: 1, itens: {} },
    base
  );

export const gravarEstadoDasRotinas = (estado: EstadoRot, base?: string) =>
  gravarLocal('agenda-estado.json', estadoRot.parse(estado), base);
