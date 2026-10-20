import test from 'node:test';
import assert from 'node:assert/strict';
import { plataformaDoInstalador } from '../../../../dist/atualizacoes/regras/plataformaDoInstalador.js';
import { nomeDoInstalador } from '../../../../dist/atualizacoes/regras/nomeDoInstalador.js';
import { protetorDoSistema } from '../../../../dist/conexoes/regras/protetorDoSistema.js';
import { diretorioBase, diretorioDados } from '../../../../dist/compartilhado/banco/diretorioDados.js';
import { executarNoEscopoDoUsuario } from '../../../../dist/compartilhado/banco/escopoDeUsuario.js';

test('cada sistema recebe o seu instalador; sistemas sem instalador oficial ficam sem atualização automática', () => {
  assert.equal(plataformaDoInstalador('win32', 'x64', {}), 'win');
  assert.equal(plataformaDoInstalador('win32', 'arm64', {}), null);
  assert.equal(plataformaDoInstalador('darwin', 'arm64', {}), 'mac-arm64');
  assert.equal(plataformaDoInstalador('darwin', 'x64', {}), 'mac-x64');
  assert.equal(plataformaDoInstalador('linux', 'x64', { APPIMAGE: '/tmp/Prumo.AppImage' }), 'linux-appimage');
  assert.equal(plataformaDoInstalador('linux', 'x64', {}), 'linux-deb');
  assert.equal(plataformaDoInstalador('linux', 'arm64', {}), null);
  assert.equal(plataformaDoInstalador('freebsd', 'x64', {}), null);
});

test('nomes dos instaladores seguem o artifactName do electron-builder e o do Windows não mudou', () => {
  assert.equal(nomeDoInstalador('1.2.3', 'win'), 'Prumo-QA-Setup-1.2.3.exe');
  assert.equal(nomeDoInstalador('1.2.3', 'mac-arm64'), 'Prumo-QA-1.2.3-mac-arm64.dmg');
  assert.equal(nomeDoInstalador('1.2.3', 'mac-x64'), 'Prumo-QA-1.2.3-mac-x64.dmg');
  assert.equal(nomeDoInstalador('1.2.3', 'linux-appimage'), 'Prumo-QA-1.2.3-linux-x86_64.AppImage');
  assert.equal(nomeDoInstalador('1.2.3', 'linux-deb'), 'Prumo-QA-1.2.3-linux-amd64.deb');
  assert.throws(() => nomeDoInstalador('1.2.3', null), /UPDATE_UNSUPPORTED/);
});

test('cofre: Linux sem cofre real (basic_text) é recusado; Windows e macOS dependem só do sistema; nada fica em texto aberto', () => {
  const base = (extra) => ({ isEncryptionAvailable: () => true, encryptString: s => Buffer.from('c:' + s), decryptString: b => b.toString().slice(2), ...extra });
  assert.equal(protetorDoSistema(base({ getSelectedStorageBackend: () => 'basic_text' }), 'linux').disponivel(), false);
  assert.equal(protetorDoSistema(base({}), 'linux').disponivel(), false, 'backend desconhecido = recusa');
  assert.equal(protetorDoSistema(base({ getSelectedStorageBackend: () => 'gnome_libsecret' }), 'linux').disponivel(), true);
  assert.equal(protetorDoSistema(base({ getSelectedStorageBackend: () => 'kwallet6' }), 'linux').disponivel(), true);
  assert.equal(protetorDoSistema(base({}), 'darwin').disponivel(), true);
  assert.equal(protetorDoSistema(base({}), 'win32').disponivel(), true);
  assert.equal(protetorDoSistema(base({ isEncryptionAvailable: () => false }), 'darwin').disponivel(), false);
  const p = protetorDoSistema(base({}), 'darwin'); assert.equal(p.abrir(p.proteger('segredo')), 'segredo');
});

test('pasta de dados: Windows em LOCALAPPDATA, macOS em Application Support, Linux em XDG; PRUMO_DATA_DIR sempre vence', () => {
  assert.equal(diretorioDados(process.platform === 'win32' ? 'C:\\dados-prumo' : '/tmp/dados-prumo'), process.platform === 'win32' ? 'C:\\dados-prumo' : '/tmp/dados-prumo');
  const padrao = diretorioBase();
  if (process.platform === 'darwin') assert.match(padrao, /Library[\\/]Application Support[\\/]PrumoQA$/);
  else if (process.platform === 'linux') assert.match(padrao, /prumo-qa$/);
  else assert.match(padrao, /PrumoQA$/);
  // Sem sessão autenticada, não acessa arquivos legados nem de outra conta.
  assert.match(diretorioDados(), /[\\/]usuarios[\\/]sem-sessao$/);
});

test('iniciar com o sistema: Windows e macOS usam o item de login; Linux grava e remove o atalho de autostart', async () => {
  const { iniciarComOSistema, atalhoDeAutostart } = await import('../../../../dist/configuracoes/regras/iniciarComOSistema.js');
  const fs = await import('node:fs'); const os = await import('node:os'); const path = await import('node:path');
  const chamadas = []; const app = { setLoginItemSettings: (o) => chamadas.push(o) };
  iniciarComOSistema(true, app, 'darwin'); iniciarComOSistema(false, app, 'win32');
  assert.deepEqual(chamadas, [{ openAtLogin: true, args: ['--oculto'] }, { openAtLogin: false, args: [] }]);
  const pastaConfig = fs.mkdtempSync(path.join(os.tmpdir(), 'prumo-autostart-'));
  try {
    iniciarComOSistema(true, app, 'linux', { pastaConfig, executavel: '/opt/Prumo QA/prumo-qa' });
    const arquivo = path.join(pastaConfig, 'autostart', 'prumo-qa.desktop');
    const texto = fs.readFileSync(arquivo, 'utf8');
    assert.match(texto, /^Exec="\/opt\/Prumo QA\/prumo-qa" --oculto$/m); assert.match(texto, /^Type=Application$/m);
    assert.equal(chamadas.length, 2, 'no Linux não usa o item de login do Electron');
    iniciarComOSistema(false, app, 'linux', { pastaConfig }); assert.equal(fs.existsSync(arquivo), false);
  } finally { fs.rmSync(pastaConfig, { recursive: true, force: true }); }
  assert.ok(atalhoDeAutostart('/tmp/a"b$c').includes('Exec="/tmp/a\\"b\\$c" --oculto'), 'aspas e cifrão do caminho são escapados');
});

test('comando de conexão com a IA: PowerShell no Windows, aspas de shell no macOS e Linux, sem interpretar apóstrofos', async () => {
  const { comandoParaOTerminal } = await import('../../../../dist/conexoes/ia/comandoParaOTerminal.js');
  assert.equal(comandoParaOTerminal('C:\\Users\\Ana\\codex.exe', ['mcp', 'add', "o'q"], 'win32'), "& 'C:\\Users\\Ana\\codex.exe' 'mcp' 'add' 'o''q'");
  assert.equal(comandoParaOTerminal('/usr/local/bin/claude', ['mcp', 'add', "o'q $HOME"], 'linux'), "'/usr/local/bin/claude' 'mcp' 'add' 'o'\\''q $HOME'");
  assert.equal(comandoParaOTerminal('claude', ['mcp'], 'darwin'), "'claude' 'mcp'");
});

test('site e aplicativo usam os mesmos nomes de instalador para cada sistema', async () => {
  const { instaladoresDaVersao } = await import('../../../../site/instaladores.mjs');
  const esperado = { win: 'win', 'mac-arm64': 'mac-arm64', 'mac-x64': 'mac-x64', 'linux-appimage': 'linux-appimage', 'linux-deb': 'linux-deb' };
  for (const i of instaladoresDaVersao('9.8.7')) assert.equal(i.arquivo, nomeDoInstalador('9.8.7', esperado[i.id]), i.id);
  assert.equal(instaladoresDaVersao('9.8.7').length, 5);
});

test('pasta de dados de cada conta segue o mesmo escopo nas leituras e gravacoes', () => {
  const a='11111111-1111-4111-8111-111111111111';
  const b='22222222-2222-4222-8222-222222222222';
  const local=(id)=>executarNoEscopoDoUsuario(id,()=>diretorioDados());
  assert.notEqual(local(a),local(b));
  assert.match(local(a),/[\\\\/]usuarios[\\\\/]11111111-1111-4111-8111-111111111111$/);
  assert.notEqual(local(a),diretorioBase());
});
