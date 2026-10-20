/** Diz se a escrita num serviço está ligada para o projeto (nasce desligada). */
import { lerPermissoesDeEscrita } from '../repositorioOperacoes.js';
import { Servico } from '../../projetos/contratos.js';

export const escritaHabilitada = (espacoId: string, servico: Servico, b?: string) => lerPermissoesDeEscrita(b).itens.some(i => i.espacoId === espacoId && i.servico === servico);
