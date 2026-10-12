/** Busca uma operação de escrita pelo id (ex.: jira.comentar). */
import { catalogoOperacoes } from './catalogoOperacoes.js';

export const operacaoPorId = (id: string) => catalogoOperacoes.find(o => o.id === id);
