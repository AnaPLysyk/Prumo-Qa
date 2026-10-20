/** Porta de entrada do aplicativo desktop: prepara a pasta de dados, registra os canais da janela, abre a janela e a bandeja e mantém o worker de agendamentos. */
import { app, Menu, session } from 'electron';
import path from 'node:path';
import { conectarAvisosDoWorker, workerDoAplicativo } from './agendamentos/worker/workerDoAplicativo.js';
import { registrarCanaisIpc } from './aplicativo/api/registrarCanaisIpc.js';
import { empilharAviso } from './aplicativo/estadoDoAplicativo.js';
import { publicarEventoDoWorker } from './aplicativo/avisos/publicarEventoDoWorker.js';
import { atualizarBandeja } from './aplicativo/bandeja/cicloDaBandeja.js';
import { criarBandeja } from './aplicativo/bandeja/cicloDaBandeja.js';
import { estadoDoAplicativo } from './aplicativo/estadoDoAplicativo.js';
import { mostrarJanela } from './aplicativo/janela/controleDaJanela.js';
import { SEIS_HORAS, iniciouOculto } from './aplicativo/tipos/aplicativo.js';
import { avisoAutomaticoDeVersao } from './atualizacoes/servicoVerificacao.js';
import { diretorioBase } from './compartilhado/banco/diretorioDados.js';
import { contaDaSessao } from './login/regras/sessao.js';
import { validarSessaoRemota } from './login/integracoes/autenticacaoRemota.js';
import { iniciarPonteDaSessaoMcp, fecharPonteDaSessaoMcp } from './aplicativo/ponteDaSessaoMcp.js';

// Dados do aplicativo no mesmo diretório do histórico (LOCALAPPDATA\PrumoQA), nunca em roaming.
app.setPath('userData', path.join(diretorioBase(), 'app'));
// O worker conhece apenas eventos; o Electron decide como apresentá-los.
conectarAvisosDoWorker(publicarEventoDoWorker);
registrarCanaisIpc();
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => mostrarJanela());
  // macOS: clicar no ícone do Dock reabre a janela (o Prumo continua residente depois de fechá-la).
  app.on('activate', () => mostrarJanela());
  // Encerramento controlado: para o worker (mata filhos, registra interrupção, libera a trava) antes de sair de verdade.
  let encerrando = false;
  app.on('before-quit', e => {
    if (encerrando) return; e.preventDefault(); encerrando = true; estadoDoAplicativo.saindo = true;
    void workerDoAplicativo.parar().catch(() => undefined).finally(() => { estadoDoAplicativo.bandeja?.destroy(); estadoDoAplicativo.bandeja = null; app.quit(); });
  });
  app.on('will-quit', fecharPonteDaSessaoMcp);
  void app.whenReady().then(async () => {
    try { await iniciarPonteDaSessaoMcp(async () => { await validarSessaoRemota(); return contaDaSessao()?.id ?? null; }); }
    catch { /* A janela segue funcionando; MCP sem autorização local é recusado. */ }
    // macOS precisa do menu padrão (copiar, colar, sair com ⌘Q); nos outros sistemas a janela não tem menu.
    Menu.setApplicationMenu(process.platform === 'darwin' ? Menu.buildFromTemplate([{ role: 'appMenu' }, { role: 'editMenu' }, { role: 'windowMenu' }]) : null);
    // Nada de rede na janela: só file:// (a própria página) e devtools em desenvolvimento.
    session.defaultSession.webRequest.onBeforeRequest((d, cb) => cb({ cancel: !(d.url.startsWith('file:') || d.url.startsWith('devtools:')) }));
    session.defaultSession.setPermissionRequestHandler((_w, _p, cb) => cb(false));
    // Nenhum erro de bandeja ou worker impede a janela de abrir; o problema aparece como aviso.
    try { criarBandeja(); } catch (err) { empilharAviso({ tipo: 'WORKER_INTERROMPIDO', titulo: 'Bandeja', detalhe: (err as Error).message }); }
    // Agendamentos só começam depois do login, dentro do escopo do usuário confirmado.
    try { atualizarBandeja(); } catch { /* o aviso do worker já foi registrado acima */ }
    if (!iniciouOculto || !estadoDoAplicativo.bandeja) mostrarJanela();
    // Aviso de versão nova ao abrir (depois que a janela carrega) e a cada 6 horas, mesmo só na bandeja.
    setTimeout(() => { void avisoAutomaticoDeVersao().catch(() => undefined); }, 4000).unref();
    setInterval(() => { void avisoAutomaticoDeVersao().catch(() => undefined); }, SEIS_HORAS).unref();
  });
  // Sem `window-all-closed` => app.quit(): o Prumo fica residente até "Sair do Prumo".
  app.on('window-all-closed', () => undefined);
}
