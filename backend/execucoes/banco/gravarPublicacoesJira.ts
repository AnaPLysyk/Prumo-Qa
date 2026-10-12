/** Grava o registro das publicações de comentário no Jira, guardando as 1.000 últimas. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { Registro, registro } from '../tipos/comentarioJira.js';

export const gravarPublicacoesJira = (r: Registro, b?: string) => { if (r.itens.length > 1000) r.itens = r.itens.slice(-1000); gravarLocal('publicacoes-jira.json', registro.parse(r), b); };
