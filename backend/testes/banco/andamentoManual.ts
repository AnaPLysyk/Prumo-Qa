/** Inícios manuais locais, separados dos resultados e vinculados ao projeto e à origem da run. */
import { z } from 'zod';
import { lerLocal, gravarLocal } from '../../compartilhado/banco/persistenciaLocal.js';

const pessoa = z.object({ id: z.string().max(200), nome: z.string().max(200), login: z.string().max(320) }).strict();
const inicio = z.object({ espacoId: z.string().uuid(), runId: z.string().max(80), vinculoId: z.string().max(200), casoId: z.number().int().positive(), por: pessoa, em: z.string().datetime() }).strict();
const registro = z.object({ version: z.literal(1), itens: z.array(inicio).max(10000) }).strict();
type Alvo = Pick<z.infer<typeof inicio>, 'espacoId' | 'runId' | 'vinculoId'>;
const mesmoAlvo = (a: Alvo, b: Alvo) => a.espacoId === b.espacoId && a.runId === b.runId && a.vinculoId === b.vinculoId;
const ler = (base?: string) => lerLocal('andamento-manual.json', registro, { version: 1 as const, itens: [] }, base);

export const listarAndamentoManual = (alvo: Alvo, base?: string) => ler(base).itens.filter(i => mesmoAlvo(i, alvo));

export function iniciarAndamentoManual(alvo: Alvo, casoId: number, por: z.infer<typeof pessoa>, base?: string, agora = new Date()) {
  const dados = ler(base);
  const existente = dados.itens.find(i => mesmoAlvo(i, alvo) && i.casoId === casoId);
  // Reabrir um caso retoma o início original, sem trocar autoria ou reiniciar o relógio.
  if (existente) return existente;
  const item = inicio.parse({ ...alvo, casoId, por, em: agora.toISOString() });
  dados.itens.push(item);
  gravarLocal('andamento-manual.json', registro.parse(dados), base);
  return item;
}
