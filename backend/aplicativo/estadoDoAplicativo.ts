/** estadoDoAplicativo: mantém reunidas as operações do mesmo fluxo. */
import { BrowserWindow, Tray } from "electron";
import { Aviso } from "./tipos/aplicativo.js";

// estadoDoAplicativo — responsabilidade integrada
export const estadoDoAplicativo = {
  ultimaRelease: (undefined) as string | undefined,
  ultimaVersao: (undefined) as string | undefined,
  contadorAviso: 0,
  janelaPrincipal: (null) as BrowserWindow | null,
  bandeja: (null) as Tray | null,
  saindo: false,
  avisouBandeja: false,
};

// avisos — responsabilidade integrada
export const avisosDaJanela: Aviso[] = [];

export function empilharAviso(a: Omit<Aviso, 'n' | 'at'>) { avisosDaJanela.push({ ...a, n: ++estadoDoAplicativo.contadorAviso, at: new Date().toISOString() }); if (avisosDaJanela.length > 100) avisosDaJanela.shift(); }
