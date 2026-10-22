/** IDE do projeto: estado e diferenças do Git em modo somente leitura (nunca prepara, grava, faz commit ou envia). */
import fs from 'node:fs';
import path from 'node:path';
import { mascarar } from '../compartilhado/seguranca/mascarar.js';
import { consultarGitSomenteLeitura } from './servicoRepositorioGit.js';
import { bloqueado, segredo, caminhoSeguroDoRepositorio, conteudoOriginal } from './ideRepositorio.js';

const MAX_ALTERACOES = 2000;
const MAX_DIFF = 200_000;
export type EstadoGit = 'modificado' | 'novo' | 'removido' | 'renomeado' | 'conflito';

const ehRepositorio = (raiz: string) => fs.existsSync(path.join(raiz, '.git'));
const visivel = (arquivo: string) => arquivo.split('/').every(p => p && !bloqueado(p) && !segredo(p));
const CONFLITOS = new Set(['DD', 'AU', 'UD', 'UA', 'DU', 'AA', 'UU']);

function estadoDoCodigo(x: string, y: string): EstadoGit {
  if (CONFLITOS.has(x + y)) return 'conflito';
  if (x === '?' || x === 'A' || y === 'A') return 'novo';
  if (x === 'R' || y === 'R') return 'renomeado';
  if (x === 'D' || y === 'D') return 'removido';
  return 'modificado';
}

/** `git status` do repositório: se a pasta não é um repositório ou o git não existe, responde `disponivel: false`. */
export async function estadoDoGit(raiz: string) {
  const vazio = { disponivel: false, branch: null as string | null, alteracoes: [] as { arquivo: string; estado: EstadoGit; preparado: boolean }[] };
  if (!ehRepositorio(raiz)) return vazio;
  let r;
  try { r = await consultarGitSomenteLeitura(['-c', 'core.quotepath=false', 'status', '--porcelain=v1', '-b', '-z', '-uall'], raiz, 15_000, 400_000); }
  catch { return vazio; }
  if (r.codigo !== 0) return vazio;
  const registros = r.saida.split('\0');
  let branch: string | null = null;
  const alteracoes: typeof vazio.alteracoes = [];
  for (let i = 0; i < registros.length; i++) {
    const reg = registros[i];
    if (!reg) continue;
    if (reg.startsWith('## ')) {
      const t = reg.slice(3);
      branch = t.startsWith('No commits yet on ') ? t.slice(18) : t.startsWith('HEAD (no branch)') ? 'HEAD' : (t.split('...')[0] ?? '').trim() || null;
      continue;
    }
    const x = reg.charAt(0), y = reg.charAt(1), arquivo = reg.slice(3).replaceAll('\\', '/');
    if (x === 'R' || x === 'C') i++; // o registro seguinte é o nome de origem
    if (!visivel(arquivo)) continue;
    if (alteracoes.length >= MAX_ALTERACOES) break;
    alteracoes.push({ arquivo, estado: estadoDoCodigo(x, y), preparado: x !== ' ' && x !== '?' && !CONFLITOS.has(x + y) });
  }
  return { disponivel: true, branch, alteracoes };
}

/** Diferença de um arquivo contra o último commit. Arquivo novo não rastreado vira diff contra vazio. */
export async function diferencaDoGit(raiz: string, arquivo: string) {
  const alvo = caminhoSeguroDoRepositorio(raiz, arquivo); // recusa segredos, atalhos e qualquer caminho fora da raiz
  if (!ehRepositorio(raiz)) throw new Error('IDE_GIT_INDISPONIVEL: a pasta não é um repositório Git.');
  const temHead = (await consultarGitSomenteLeitura(['rev-parse', '--verify', '-q', 'HEAD'], raiz)).codigo === 0;
  const base = ['-c', 'core.quotepath=false', 'diff', '--no-ext-diff', '--no-textconv', '--no-color', ...(temHead ? ['HEAD'] : ['--cached'])];
  const r = await consultarGitSomenteLeitura([...base, '--', arquivo], raiz, 20_000, MAX_DIFF);
  if (r.codigo !== 0) throw new Error('IDE_GIT_FALHOU: o git não conseguiu calcular a diferença deste arquivo.');
  let diff = r.saida, truncado = r.truncado;
  if (!diff && fs.existsSync(alvo)) {
    const nao = await consultarGitSomenteLeitura(['ls-files', '--others', '--exclude-standard', '-z', '--', arquivo], raiz);
    if (nao.codigo === 0 && nao.saida.length) {
      const linhas = conteudoOriginal(alvo).split(/\r?\n/);
      if (linhas[linhas.length - 1] === '') linhas.pop();
      diff = ['diff --git a/' + arquivo + ' b/' + arquivo, 'new file mode 100644', '--- /dev/null', '+++ b/' + arquivo, '@@ -0,0 +1,' + linhas.length + ' @@', ...linhas.map(l => '+' + l)].join('\n');
      if (diff.length > MAX_DIFF) { diff = diff.slice(0, MAX_DIFF); truncado = true; }
    }
  }
  return { diff: mascarar(diff), arquivo, truncado };
}
