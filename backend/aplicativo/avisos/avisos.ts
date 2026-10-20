/** Reúne avisos da funcionalidade, mantendo cada operação identificável pelo nome. */
import { Aviso } from "../tipos/aplicativo.js";
import { estadoDoAplicativo } from "../estadoDoAplicativo.js";

export const avisosDaJanela: Aviso[] = [];

export function empilharAviso(a: Omit<Aviso, 'n' | 'at'>) { avisosDaJanela.push({ ...a, n: ++estadoDoAplicativo.contadorAviso, at: new Date().toISOString() }); if (avisosDaJanela.length > 100) avisosDaJanela.shift(); }
