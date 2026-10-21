/** Conecta repositórios GitHub pela autenticação do Git for Windows. */
// Credenciais restritas ao backend, sem Client ID/Secret próprios e sem exibição no Electron.
import { spawn } from 'node:child_process';
import os from 'node:os';

const usuarioValido = (nome: string) => /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(nome);
export const githubWindowsDisponivel = () => process.platform === 'win32';

function executar(argumentos: string[], entrada: string, tempoMs: number, interativo: boolean, signal?: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const filho = spawn('git', ['credential-manager', ...argumentos], {
      cwd: os.homedir(), windowsHide: true, shell: false, stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, GCM_INTERACTIVE: interativo ? 'always' : 'never',
        ...(interativo ? { GCM_GITHUB_AUTHMODES: 'browser' } : {}) }, signal
    });
    let saida = '', excedeu = false;
    const limite = setTimeout(() => filho.kill(), tempoMs);
    const recolher = (texto: Buffer) => {
      if (saida.length + texto.length > 16384) { excedeu = true; filho.kill(); return; }
      saida += texto.toString('utf8');
    };
    filho.stdout.on('data', recolher);
    // Não registrar stderr: o provedor pode incluir informações de autenticação.
    filho.stderr.on('data', () => {});
    filho.on('error', (erro) => { clearTimeout(limite); reject(erro); });
    filho.on('close', codigo => {
      clearTimeout(limite);
      if (excedeu || codigo !== 0) reject(new Error('GITHUB_WINDOWS_AUTH_FAILED'));
      else resolve(saida);
    });
    filho.stdin.on('error', () => {});
    filho.stdin.end(entrada);
  });
}

/** Apenas usernames, não tokens. null indica que o helper não está disponível. */
export async function listarGitHubWindows(): Promise<string[] | null> {
  if (!githubWindowsDisponivel()) return null;
  try {
    const saida = await executar(['github', 'list'], '', 10000, false);
    return [...new Set(saida.split(/\r?\n/).map(x => x.trim()).filter(usuarioValido))].slice(0, 25);
  } catch { return null; }
}

/** Solicita autorização no navegador nativo do Git, se ainda não houver credencial. */
export async function autenticarGitHubWindows(signal?: AbortSignal): Promise<void> {
  await executar(['github', 'login', '--browser'], '', 180000, true, signal);
}

/** Lê a credencial da conta escolhida, sem mostrar seu conteúdo à janela ou aos logs. */
export async function tokenGitHubWindows(usuario: string, signal?: AbortSignal): Promise<string> {
  if (!usuarioValido(usuario)) throw new Error('GITHUB_ACCOUNT_INVALID');
  const resposta = await executar(['get', '--no-ui'],
    'protocol=https\nhost=github.com\nusername=' + usuario + '\n\n', 25000, false, signal);
  const campos = new Map(resposta.split(/\r?\n/).filter(Boolean).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
  }));
  const token = campos.get('password') || '';
  // O GCM pode devolver um username técnico; a identidade verdadeira é conferida
  // com a API /user do GitHub antes de associar a credencial ao usuário escolhido.
  if (!/^[^\s\x00-\x1f]{20,1000}$/.test(token))
    throw new Error('GITHUB_WINDOWS_CREDENTIAL_UNAVAILABLE');
  return token;
}
