/** Transforma um comando escrito como texto no contrato (ex.: "npm run test") no formato estruturado, recusando operadores de shell. */
import { ErroQa } from '../erros.js';
import { Comando, comandoObjeto } from './contratos.js';

export function normalizarComando(valor: string | Comando): Comando {
  if (typeof valor !== 'string') return valor;
  // Compatibilidade explícita do rascunho v2: gramática pequena, nenhuma avaliação de shell.
  if (/[;&|<>`$%\r\n]/.test(valor)) throw new ErroQa('COMMAND_FORBIDDEN', 'Operadores de shell não são permitidos.');
  const partes = valor.match(/"[^"]*"|'[^']*'|[^\s"']+/g) ?? [];
  if (partes.join(' ') !== valor.trim().replace(/\s+/g, ' ')) throw new ErroQa('COMMAND_FORBIDDEN', 'Aspas inválidas.');
  const [executavel, ...args] = partes.map(v => v.replace(/^("|')(.*)\1$/, '$2'));
  return comandoObjeto.parse({ executable: executavel, args });
}
