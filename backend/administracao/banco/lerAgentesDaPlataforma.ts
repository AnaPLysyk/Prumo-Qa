/** Lê a configuração geral dos agentes da plataforma (agentes-plataforma.json); sem arquivo vale o padrão. */
import { AgentesDaPlataforma, agentesDaPlataformaPadrao, agentesDaPlataformaSchema } from '../tipos/agentesDaPlataforma.js';
import { lerLocal } from '../../compartilhado/banco/lerLocal.js';

export const lerAgentesDaPlataforma = (b?: string): AgentesDaPlataforma => lerLocal<AgentesDaPlataforma>('agentes-plataforma.json', agentesDaPlataformaSchema, structuredClone(agentesDaPlataformaPadrao), b);
