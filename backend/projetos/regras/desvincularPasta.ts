/** Desvincula uma pasta de projeto (nada é apagado nela). */
import { diretorioDados } from '../../compartilhado/banco/diretorioDados.js';
import { gravarPastasVinculadas } from '../banco/gravarPastasVinculadas.js';
import { lerPastasVinculadas } from '../banco/lerPastasVinculadas.js';
import { caminhoComparavel } from './caminhoComparavel.js';

/** Remove apenas o vínculo; histórico, evidências e arquivos do projeto permanecem. */
function removerVinculo(raiz: string, base?: string) {
  const atuais = lerPastasVinculadas(base); const alvo = caminhoComparavel(raiz); const restantes = atuais.filter(v => caminhoComparavel(v.root) !== alvo);
  if (restantes.length !== atuais.length) gravarPastasVinculadas(restantes, base);
  return { removed: restantes.length !== atuais.length };
}



export const desvincularPasta = (raiz: string) => removerVinculo(raiz, diretorioDados());
