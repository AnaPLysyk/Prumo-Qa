/** Cria a janela segura do Prumo (sem Node na página, sem navegação, sem novas janelas); fechar só esconde. */
import { BrowserWindow, app, Notification } from 'electron';
import path from 'node:path';
import { textoNoIdioma } from '../bandeja/textoNoIdioma.js';
import { estadoDoAplicativo } from '../estadoDoAplicativo.js';
import { rendererDir } from '../tipos/aplicativo.js';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';
import { idiomaAtual } from '../../configuracoes/regras/idiomaAtual.js';

export function criarJanela(): BrowserWindow {
  const janela = new BrowserWindow({
    width: 1080, height: 720, minWidth: 820, minHeight: 560, show: false, backgroundColor: '#0b1020', title: 'Prumo QA',
    icon: path.join(raizDoAplicativo, 'assets', 'prumo-icon.png'),
    webPreferences: { preload: path.join(raizDoAplicativo, 'backend', 'aplicativo', 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, spellcheck: false, devTools: !app.isPackaged }
  });
  janela.once('ready-to-show', () => janela.show());
  janela.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  janela.webContents.on('will-navigate', e => e.preventDefault());
  janela.webContents.on('will-attach-webview', e => e.preventDefault());
  // Fechar a janela NÃO encerra o Prumo: ele continua na bandeja para que as rotinas sigam funcionando.
  janela.on('close', e => {
    if (estadoDoAplicativo.saindo) return;
    e.preventDefault(); janela.hide();
    if (!estadoDoAplicativo.avisouBandeja && Notification.isSupported()) { estadoDoAplicativo.avisouBandeja = true; const i = idiomaAtual(); new Notification({ title: textoNoIdioma('bandejaTitulo', i), body: textoNoIdioma('bandejaCorpo', i), silent: true }).show(); }
  });
  janela.on('closed', () => { if (estadoDoAplicativo.janelaPrincipal === janela) estadoDoAplicativo.janelaPrincipal = null; });
  void janela.loadFile(path.join(rendererDir, 'index.html'));
  return janela;
}
