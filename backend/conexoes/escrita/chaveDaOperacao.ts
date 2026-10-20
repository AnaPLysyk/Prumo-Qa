/** Gera a chave que impede repetir a mesma operação externa. */
import { createHash } from 'node:crypto';

/** Ordena as propriedades para obter a mesma chave com objetos equivalentes. */
function textoCanonico(valor: unknown): string {
  if (Array.isArray(valor)) {
    return '[' + valor.map(textoCanonico).join(',') + ']';
  }
  if (valor && typeof valor === 'object') {
    const campos = Object.keys(valor).sort();
    const propriedades = campos.map(
      campo => JSON.stringify(campo) + ':' + textoCanonico((valor as Record<string, unknown>)[campo])
    );
    return '{' + propriedades.join(',') + '}';
  }
  return JSON.stringify(valor);
}

export const chaveDaOperacao = (espacoId: string, operacao: string, parametros: unknown): string =>
  createHash('sha256')
    .update(`${espacoId}|${operacao}|${textoCanonico(parametros)}`)
    .digest('hex');
