/** Diz se um arquivo pode ser gravado pelo Prumo: só arquivos de teste, fora de .github, sem ".." nem caminho absoluto. */
import { sensivel } from '../../compartilhado/seguranca/sensivel.js';
import { arquivoTeste, extensoes, padraoTeste } from '../tipos/escritaGithub.js';

export function caminhoDeTesteValido(c: string) {
  if (c.length < 3 || c.length > 300 || c.startsWith('/') || /^[a-z]:/i.test(c) || c.split('/').some(p => p === '..' || p === '.' || p === '') || /[\x00-\x1f\\:*?"<>|]/.test(c)) return false;
  if (/^\.github\//i.test(c) || /(^|\/)\.git(\/|$)/i.test(c) || sensivel(c)) return false;
  return extensoes.test(c) && (padraoTeste.test(c) || arquivoTeste.test(c));
}
