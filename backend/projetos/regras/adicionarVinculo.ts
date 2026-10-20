/** Vincula uma pasta ao Prumo se ela tiver contrato válido; não repete pastas já vinculadas. */
import { gravarPastasVinculadas } from '../banco/pastasVinculadas.js';
import { lerPastasVinculadas } from '../banco/pastasVinculadas.js';
import { caminhoComparavel } from './caminhoComparavel.js';
import { situacaoProjeto } from './situacaoProjeto.js';

/** Só vincula projeto com contrato válido; caso contrário devolve o diagnóstico e não grava nada. */
export async function adicionarVinculo(raiz: string, base?: string) {
  const s = await situacaoProjeto(raiz);
  if (s.state !== 'INTEGRADO') return { linked: false as const, situation: s };
  const atuais = lerPastasVinculadas(base);
  if (!atuais.some(v => caminhoComparavel(v.root) === caminhoComparavel(s.root))) gravarPastasVinculadas([...atuais, { root: s.root, addedAt: new Date().toISOString() }], base);
  return { linked: true as const, situation: s };
}
