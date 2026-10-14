/** Extrai o código do erro de uma falha de publicação (ou JIRA_PUBLISH_FAILED). */
import { ErroServico } from '../../conexoes/integracoes/ErroServico.js';

export const codigoDoErroDePublicacao = (e: unknown) => e instanceof ErroServico ? e.codigo : (e as Error)?.message?.match(/^[A-Z_]{3,60}/)?.[0] ?? 'JIRA_PUBLISH_FAILED';
