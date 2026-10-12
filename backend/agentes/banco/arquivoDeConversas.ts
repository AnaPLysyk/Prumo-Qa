/** Arquivo de conversas de um projeto (ou geral). */
import path from 'node:path';
import { pastaDasConversas } from './pastaDasConversas.js';

export const arquivoDeConversas = (espacoId: string | null, base?: string) => path.join(pastaDasConversas(base), (espacoId && /^[0-9a-f-]{36}$/.test(espacoId) ? espacoId : 'geral') + '.jsonl');
