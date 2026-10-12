/** O que muda enquanto o aplicativo está aberto: janela, ícone da bandeja, encerramento, último aviso e a última versão verificada. */
import { BrowserWindow, Tray } from 'electron';

export const estadoDoAplicativo = {
  ultimaRelease: (undefined) as string | undefined,
  ultimaVersao: (undefined) as string | undefined,
  contadorAviso: 0,
  janelaPrincipal: (null) as BrowserWindow | null,
  bandeja: (null) as Tray | null,
  saindo: false,
  avisouBandeja: false,
};
