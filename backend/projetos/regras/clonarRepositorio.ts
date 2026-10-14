/** Traz um repositório do GitHub para uma pasta deste computador com o git instalado (clone) ou o atualiza só por avanço (fast-forward), sem hooks e sem mexer em credenciais. */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export type ResultadoDoClone = { acao: 'clonado' | 'atualizado'; pasta: string; ramo: string };
type Opcoes = { protocolo?: 'https' | 'file'; limiteMs?: number };

/** `dono/repositorio` como o GitHub escreve: sem barra extra, sem `..` e sem caracteres que mudem o endereço. */
export const repositorioValido = (chave: string) => /^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}\/[A-Za-z0-9_.-]{1,100}$/.test(chave) && !chave.includes('..');

/** Não herda do processo nada que pareça credencial: o git usa só a configuração e o gerenciador de credenciais da própria pessoa. */
const ambienteDoGit = (): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !/token|secret|password|passwd|api[_-]?key|credential/i.test(k) && !k.startsWith('GIT_')) env[k] = v;
  return { ...env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' };
};

/** Opções fixas: hooks desligados, nenhum protocolo além do HTTPS (o `file` só nos testes), links simbólicos e conversão de fim de linha desligados. */
const seguras = (protocolo: 'https' | 'file') => ['-c', `core.hooksPath=${process.platform === 'win32' ? 'NUL' : '/dev/null'}`, '-c', 'core.fsmonitor=false', '-c', 'core.symlinks=false', '-c', 'core.autocrlf=false', '-c', 'protocol.allow=never', '-c', `protocol.${protocolo}.allow=always`, '-c', 'transfer.fsckObjects=true', '-c', 'submodule.recurse=false'];

function git(args: string[], cwd: string | undefined, limiteMs: number): Promise<{ codigo: number; saida: string }> {
  return new Promise((resolve, reject) => {
    const filho = spawn('git', args, { cwd, env: ambienteDoGit(), windowsHide: true, shell: false });
    let saida = ''; const acumular = (b: Buffer) => { if (saida.length < 20_000) saida += b.toString('utf8'); };
    filho.stdout.on('data', acumular); filho.stderr.on('data', acumular);
    const relogio = setTimeout(() => { filho.kill(); reject(new Error('GIT_TIMEOUT: o git demorou demais e foi interrompido.')); }, limiteMs);
    filho.on('error', (e: NodeJS.ErrnoException) => { clearTimeout(relogio); reject(new Error(e.code === 'ENOENT' ? 'GIT_UNAVAILABLE: o git não foi encontrado neste computador. Instale o Git para Windows (git-scm.com) e tente de novo, ou vincule uma pasta que você já tem.' : 'GIT_FAILED: não foi possível iniciar o git.')); });
    filho.on('close', (codigo) => { clearTimeout(relogio); resolve({ codigo: codigo ?? 1, saida: saida.trim() }); });
  });
}

const motivo = (saida: string) => {
  if (/Authentication failed|could not read Username|terminal prompts disabled|Permission denied|403|404|not found|Repository not found/i.test(saida)) return 'GIT_AUTH: o git deste computador não conseguiu acessar o repositório. Se ele é privado, entre no GitHub pelo Git Credential Manager (um `git clone` manual uma vez) e tente de novo.';
  return 'GIT_FAILED: o git recusou a operação. ' + saida.split('\n').slice(-2).join(' ').slice(0, 200);
};

/** Clona (pasta nova) ou atualiza (pasta que o Prumo já clonou antes). `url` vem do backend, montada de um `dono/repositorio` validado. */
export async function clonarOuAtualizarRepositorio(url: string, destino: string, opcoes: Opcoes = {}): Promise<ResultadoDoClone> {
  const protocolo = opcoes.protocolo ?? 'https'; const limite = opcoes.limiteMs ?? 600_000;
  if (protocolo === 'https' && !/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\.git$/.test(url)) throw new Error('GIT_URL_INVALID: só repositórios do github.com são aceitos.');
  const existe = fs.existsSync(destino);
  if (existe) {
    if (!fs.existsSync(path.join(destino, '.git')) || fs.lstatSync(destino).isSymbolicLink()) throw new Error('CLONE_DESTINATION_BUSY: a pasta de destino já existe e não é um repositório trazido pelo Prumo.');
    const origem = await git([...seguras(protocolo), 'remote', 'get-url', 'origin'], destino, 30_000);
    if (origem.codigo !== 0 || origem.saida !== url) throw new Error('CLONE_REMOTE_MISMATCH: a pasta aponta para outro repositório.');
    const f = await git([...seguras(protocolo), 'fetch', '--depth', '50', '--no-tags', 'origin'], destino, limite); if (f.codigo !== 0) throw new Error(motivo(f.saida));
    const m = await git([...seguras(protocolo), 'merge', '--ff-only', 'FETCH_HEAD'], destino, 60_000); if (m.codigo !== 0) throw new Error('CLONE_CANNOT_FAST_FORWARD: há mudanças locais que impedem atualizar sem conflito. Salve-as num commit, ou descarte, e tente de novo.');
  } else {
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    const c = await git([...seguras(protocolo), 'clone', '--depth', '50', '--single-branch', '--no-tags', '--', url, destino], undefined, limite);
    if (c.codigo !== 0) { fs.rmSync(destino, { recursive: true, force: true }); throw new Error(motivo(c.saida)); }
  }
  const ramo = (await git(['rev-parse', '--abbrev-ref', 'HEAD'], destino, 30_000)).saida || 'HEAD';
  return { acao: existe ? 'atualizado' : 'clonado', pasta: destino, ramo };
}
