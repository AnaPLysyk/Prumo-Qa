/** Mostra a janela (cria se foi fechada) e traz para a frente. */
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { criarJanela } from './criarJanela.js';

export function mostrarJanela() {
  if (!estadoDoAplicativo.janelaPrincipal || estadoDoAplicativo.janelaPrincipal.isDestroyed()) estadoDoAplicativo.janelaPrincipal = criarJanela();
  const j = estadoDoAplicativo.janelaPrincipal; if (j.isMinimized()) j.restore(); j.show(); j.focus();
}
