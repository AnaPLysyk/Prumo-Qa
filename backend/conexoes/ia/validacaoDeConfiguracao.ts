/** Comparação e assinatura dos planos de configuração das integrações de IA. */
import path from 'node:path';
import { hash } from '../../compartilhado/seguranca/hash.js';
import { Plano } from '../tipos/integracaoIa.js';

/** Assinatura estável usada para confirmar que a configuração testada não mudou. */
export function assinaturaDaConfiguracao(plano: Plano) {
  return hash(JSON.stringify(plano.configuration));
}

function caminhoNormalizado(caminho: string): string {
  const absoluto = path.resolve(caminho);
  return process.platform === 'win32' ? absoluto.toLowerCase() : absoluto;
}

/** Somente caminhos absolutos podem ser comparados; no Windows ignora diferenças de caixa. */
export function mesmoCaminho(valor: unknown, esperado: string): boolean {
  return typeof valor === 'string' &&
    path.isAbsolute(valor) &&
    caminhoNormalizado(valor) === caminhoNormalizado(esperado);
}
