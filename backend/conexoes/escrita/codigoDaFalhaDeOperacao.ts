/** Extrai o código de erro de uma falha de operação externa. */
import { ErroServico } from '../integracoes/ErroServico.js';

export const codigoDaFalhaDeOperacao = (e: unknown) => e instanceof ErroServico ? e.codigo : (/^([A-Z][A-Z_]{2,60})\b/.exec((e as Error)?.message ?? '')?.[1] ?? 'OPERATION_FAILED');
