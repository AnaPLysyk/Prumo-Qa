/** Operações de janela: restaurar, exibir e direcionar à tela solicitada. */
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { criarJanela } from './criarJanela.js';
import { empilharAviso } from '../avisos/avisos.js';

export function mostrarJanela() {
  if (!estadoDoAplicativo.janelaPrincipal || estadoDoAplicativo.janelaPrincipal.isDestroyed()) {
    estadoDoAplicativo.janelaPrincipal = criarJanela();
  }
  const janela = estadoDoAplicativo.janelaPrincipal;
  if (janela.isMinimized()) janela.restore();
  janela.show();
  janela.focus();
}

/** Solicita navegação pelo canal de avisos, sem executar código da página. */
export function navegarPara(destino: string) {
  empilharAviso({ tipo: 'NAVEGAR', titulo: destino, detalhe: '', destino });
  mostrarJanela();
}
