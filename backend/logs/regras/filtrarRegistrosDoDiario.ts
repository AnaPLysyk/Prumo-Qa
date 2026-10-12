/** Filtra registros do diário por ferramenta, estado e período. */
import { z } from 'zod';
import { Evento } from '../tipos/atividade.js';
import { filtroSchema } from '../../projetos/tipos/painel.js';

export function filtrarRegistrosDoDiario(eventos: Evento[], f: z.output<typeof filtroSchema>) {
  return eventos.filter(e => (!f.tool || e.tool === f.tool) && (!f.state || e.state === f.state) && (!f.since || e.at >= f.since) && (!f.until || e.at <= f.until));
}
