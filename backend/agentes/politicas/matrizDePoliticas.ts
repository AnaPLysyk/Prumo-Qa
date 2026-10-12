/** Lista todas as capacidades da IA com o estado e o motivo, para a tela Agentes. */
import { capacidadeEfetiva } from './capacidadeEfetiva.js';
import { capacidades } from '../tipos/politicas.js';

/** Matriz completa para a interface e para a ferramenta listar_politicas. */
export function matrizDePoliticas(espacoId: string | null, b?: string) {
  return capacidades.map(d => { const e = capacidadeEfetiva(espacoId, d.id, b); return { id: d.id, rotulo: d.rotulo, ferramenta: d.ferramenta, estado: e.estado, motivo: e.motivo, editavel: d.editavel, explicacao: d.explicacao }; });
}
