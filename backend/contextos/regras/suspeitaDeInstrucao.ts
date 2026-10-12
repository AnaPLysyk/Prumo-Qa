/** Avisa quando o texto de um contexto parece uma ordem para a IA (ex.: "ignore as instruções"), para não ser tratado como regra. */
import { ehInstrucao } from '../tipos/contexto.js';

export const suspeitaDeInstrucao = (texto: string) => ehInstrucao.test(texto);
