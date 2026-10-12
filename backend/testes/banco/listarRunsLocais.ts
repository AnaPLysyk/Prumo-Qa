/** Lista as runs locais de um projeto, da mais nova para a mais antiga. */
import { lerRunsLocais } from './lerRunsLocais.js';

export const listarRunsLocais = (espacoId?: string, b?: string) => lerRunsLocais(b).itens.filter(r => !espacoId || r.espacoId === espacoId).sort((a, c) => c.criadaEm.localeCompare(a.criadaEm));
