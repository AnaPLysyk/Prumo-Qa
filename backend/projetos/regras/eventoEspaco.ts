/** Anota um acontecimento no histórico do projeto (criado, editado, vinculado, consulta...), guardando só os 1.000 últimos. */
import { z } from 'zod';
import { Espaco, evento } from '../tipos/espacos.js';

export function eventoEspaco(e:Espaco,acao:z.infer<typeof evento>['acao'],extra:Partial<z.infer<typeof evento>>={}){e.historico.push(evento.parse({at:new Date().toISOString(),acao,...extra}));e.historico=e.historico.slice(-1000);}
