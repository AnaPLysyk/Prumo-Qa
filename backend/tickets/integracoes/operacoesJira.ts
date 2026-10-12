/** Lista das operações de escrita no Jira que o Prumo conhece. */
import { DefOperacao } from '../../conexoes/tipos/operacao.js';
import { anexarArquivo } from './anexarArquivo.js';
import { comentarTicket } from './comentarTicket.js';
import { criarTicket } from './criarTicket.js';
import { editarTicket } from './editarTicket.js';
import { transicionarTicket } from './transicionarTicket.js';
import { vincularTickets } from './vincularTickets.js';

export const operacoesJira = [criarTicket, comentarTicket, anexarArquivo, editarTicket, transicionarTicket, vincularTickets] as unknown as DefOperacao<unknown>[];
