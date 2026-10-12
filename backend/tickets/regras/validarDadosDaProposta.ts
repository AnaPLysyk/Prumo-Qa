/** Confere os dados de uma proposta: caso de teste no formato do Qase ou bug no formato do Jira. */
import { esquemaCaso } from '../../testes/tipos/escritaQase.js';
import { dadosBug } from '../tipos/proposta.js';

export const validarDadosDaProposta = (tipo: 'caso' | 'bug', dados: unknown) => tipo === 'caso' ? esquemaCaso.parse(dados) : dadosBug.parse(dados);
