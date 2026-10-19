/** Configuração para o CLI do Better Auth gerar/migrar tabelas. Só use com DATABASE_URL de desenvolvimento. */
import {criarAutenticacao} from './autenticacao.mjs';
export const {auth}=criarAutenticacao();
