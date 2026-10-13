/** Escreve em texto as orientações dos achados de uma operação. */
import { Evento, orientacoes } from '../tipos/atividade.js';

export function descreverAchados(e:Evento) {return e.summary.types.map(t=>`${t.count} × ${orientacoes[t.type]}`).join(' ');}
