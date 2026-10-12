/** Lista as rotas de escrita permitidas de um serviço, para a Ajuda. */
import { rotas } from '../tipos/rotasDeEscrita.js';
import { Servico } from '../../projetos/tipos/espacos.js';

export const operacoesDeEscritaPorServico = (servico: Servico) => rotas[servico].map(r => `${r.metodo} ${r.caminho.source}`);
