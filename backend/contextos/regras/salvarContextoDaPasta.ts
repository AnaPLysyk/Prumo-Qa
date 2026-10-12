/** Salva um contexto: cria, edita (nova versão em rascunho) ou substitui por outro. */
import { criarContexto } from './criarContexto.js';
import { editarContexto } from './editarContexto.js';
import { substituirContexto } from './substituirContexto.js';
import { abrirProjetoVinculado } from '../../projetos/regras/abrirProjetoVinculado.js';

export const salvarContextoDaPasta = async (raiz: string, a: { id?: string; substituir?: boolean; dados: unknown }, por: string) => {
  const p = await abrirProjetoVinculado(raiz);
  if (!a.id) return criarContexto(p, a.dados, por);
  return a.substituir ? substituirContexto(p, a.id, a.dados, por) : editarContexto(p, a.id, a.dados, por);
};
