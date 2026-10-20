/** Lista todas as operações de escrita conhecidas (Jira, Qase e GitHub). */
import { operacoesGithub } from '../github/operacoesGithub.js';
import { DefOperacao } from '../tipos/operacao.js';
import { operacoesQase } from '../../testes/integracoes/operacoesQase.js';
import { operacoesJira } from '../../tickets/integracoes/operacoesJira.js';

/**
 * Camada única das escritas externas. Nenhuma escrita acontece fora dela:
 *  1. a operação precisa existir no catálogo fechado e seus parâmetros passam por esquema estrito;
 *  2. a escrita precisa estar habilitada para (projeto, serviço): conectar para leitura nunca dá permissão de escrita;
 *  3. manual exige confirmação humana (feita pelo processo principal, nunca pela página); agendada só com política vigente;
 *  4. a chave de idempotência é derivada dos parâmetros: repetir a mesma operação nunca duplica; após resposta perdida
 *     o serviço é consultado (reconciliação) antes de reenviar; o efeito é relido para confirmar;
 *  5. tudo fica no livro-razão local (operacoes-externas.json), sem corpo remoto nem segredo.
 */
export const catalogoOperacoes: DefOperacao<unknown>[] = [...operacoesJira, ...operacoesQase, ...operacoesGithub];
