/** Abre o contrato de uma pasta só se ela estiver na lista de vinculadas; senão recusa. */
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { lerPastasVinculadas } from '../banco/pastasVinculadas.js';
import { caminhoComparavel } from './caminhoComparavel.js';

/** Exige que a raiz tenha sido vinculada: a interface nunca abre pastas arbitrárias. */
export async function projetoVinculado(raiz: string, base?: string): Promise<Projeto> {
  if (typeof raiz !== 'string' || !lerPastasVinculadas(base).some(v => caminhoComparavel(v.root) === caminhoComparavel(raiz))) throw new Error('PROJECT_NOT_LINKED: selecione um projeto vinculado.');
  return carregarProjeto(raiz);
}
