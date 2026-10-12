/** Monta o caminho da API do repositório GitHub vinculado. */
import { codificarParaUrl } from '../../compartilhado/texto/codificarParaUrl.js';
import { Recurso } from '../../projetos/tipos/espacos.js';

export const caminhoDoRepositorio = (rec: Recurso) => `/repos/${rec.chave.split('/').map(codificarParaUrl).join('/')}`;
