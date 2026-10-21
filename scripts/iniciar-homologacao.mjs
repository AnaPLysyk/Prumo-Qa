/** Inicia a homologação do cadastro em perfil isolado; nunca abre o banco/serviço de produção. */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

const DEV = 'https://prumo-qa-auth-dev.onrender.com';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

/** Versão que vai subir: a pedida (`npm run app:homologacao -- 2.18.1`), a preparada no catálogo ou a publicada com o número do meio somado. */
export function versaoEmHomologacao(catalogo, pedida) {
  if (/^\d+\.\d+\.\d+$/.test(pedida || '')) return pedida;
  const [topo] = catalogo.versions;
  if (topo.status !== 'publicada') return topo.version;
  const [maior, menor] = topo.version.split('.').map(Number);
  return `${maior}.${menor + 1}.0`;
}

export function ambienteDaHomologacao(env = process.env, versao = versaoEmHomologacao(
  JSON.parse(fs.readFileSync(path.join(raiz, 'docs', 'catalogo', 'versoes.json'), 'utf8')), process.argv[2])) {
  const base = env.LOCALAPPDATA || path.join(os.tmpdir(), 'prumo-qa');
  const perfil = path.resolve(base, 'PrumoQA-Homologacao-Cadastro');
  return {
    ...env,
    PRUMO_AMBIENTE: 'homologacao',
    PRUMO_VERSAO_HOMOLOGACAO: versao,
    PRUMO_AUTH_API_URL: DEV,
    PRUMO_SERVICO: DEV,
    PRUMO_LOGIN_MVP: '1',
    // Conta de teste da homologação vê a Administração mesmo antes de PRUMO_ADMIN_EMAILS estar no Render DEV (o app ignora isto fora da homologação).
    PRUMO_HOMOLOGACAO_ADMINS: env.PRUMO_HOMOLOGACAO_ADMINS ?? 'paulalysyk123@gmail.com',
    PRUMO_DATA_DIR: perfil
  };
}

async function iniciar() {
  console.log('Prumo QA — Homologação do cadastro');
  console.log('Servidor: ' + DEV);
  console.log('Nenhuma conta ou credencial do perfil de produção será copiada.');

  let resposta;
  try {
    resposta = await fetch(DEV + '/saude/autenticacao', {
      redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(70000)
    });
  } catch {
    console.error('Servidor DEV indisponível ou ainda iniciando. Confira o deploy prumo-qa-auth-dev no Render.');
    process.exitCode = 1; return;
  }
  if (resposta.status !== 200) {
    console.error('O serviço de homologação ainda não está pronto (HTTP ' + resposta.status + ').');
    console.error('Configure o banco DEV, Better Auth e o remetente verificado do Resend no Render.');
    console.error('Nenhuma autenticação foi desativada e o Prumo QA instalado permanece intacto.');
    process.exitCode = 1; return;
  }
  const ambiente = ambienteDaHomologacao();
  console.log('Versão em homologação: ' + ambiente.PRUMO_VERSAO_HOMOLOGACAO);
  fs.mkdirSync(ambiente.PRUMO_DATA_DIR, { recursive: true });
  // Terminais de editores (VS Code) herdam ELECTRON_RUN_AS_NODE=1, que faz o Electron rodar como Node puro e falhar ao importar 'electron'.
  delete ambiente.ELECTRON_RUN_AS_NODE;
  const electron = require('electron');
  const processo = spawn(electron, ['.'], { cwd: raiz, env: ambiente, stdio: 'inherit' });
  processo.on('error', () => { console.error('Não foi possível iniciar o Electron de homologação.'); process.exitCode=1; });
  processo.on('exit', codigo => { process.exitCode = codigo || 0; });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await iniciar();
