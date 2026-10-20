/** Lista as propostas de um projeto, da mais nova para a mais antiga. */
import { lerPropostas } from './armazenamentoDePropostas.js';

export const listarPropostas = (espacoId?: string, b?: string) => lerPropostas(b).itens.filter(p => !espacoId || p.espacoId === espacoId).sort((a, c) => c.criadaEm.localeCompare(a.criadaEm));
