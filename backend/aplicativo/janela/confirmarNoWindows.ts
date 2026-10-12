/** Mostra a caixa de confirmação NATIVA do Windows (que a página não consegue simular) e diz se a pessoa confirmou. */
import { BrowserWindow, dialog } from 'electron';

export const confirmarNoWindows = async (janela: BrowserWindow | null, titulo: string, mensagem: string, detalhe: string, botao: string) => (await dialog.showMessageBox(janela!, { type: 'warning', title: titulo, buttons: ['Cancelar', botao], defaultId: 0, cancelId: 0, noLink: true, message: mensagem, detail: detalhe })).response === 1;
