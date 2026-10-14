/** Devolve o repositório GitHub vinculado ao projeto, se houver. */
import { Espaco } from '../../projetos/tipos/espacos.js';

export const repositorioDoEspaco = (e: Espaco | undefined) => e?.vinculos.find(v => v.servico === 'github')?.recurso.chave ?? null;
