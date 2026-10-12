/** Classifica o texto de uma falha de teste: automação, ambiente, produto ou inconclusiva, com o motivo. */
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';

/** Classificação inicial de uma falha pelo texto do resultado. É HIPÓTESE: confirmar reproduzindo. */
export function classificarFalha(texto: string): { classe: 'automacao' | 'ambiente' | 'produto' | 'inconclusiva'; rotulo: string; motivo: string } {
  const t = semAcentos(texto);
  if (/locator|selector|seletor|strict mode|element.*not found|elemento.*nao encontrado|fixture|waitfor|getby/.test(t)) return { classe: 'automacao', rotulo: 'provável erro de automação', motivo: 'o texto cita seletor, fixture ou espera' };
  if (/econnrefused|enotfound|etimedout|socket hang|network|rede|dns|certificad|credencia|\b401\b|\b403\b|\b502\b|\b503\b|indisponivel|unavailable|permission denied|eacces|blocked/.test(t)) return { classe: 'ambiente', rotulo: 'provável bloqueio de ambiente', motivo: 'o texto cita rede, credencial ou serviço indisponível' };
  if (/expected|esperado|received|recebido|assert|toequal|tobe|diverg/.test(t)) return { classe: 'produto', rotulo: 'possível defeito do produto', motivo: 'o resultado diverge do esperado; compare com a regra antes de concluir' };
  return { classe: 'inconclusiva', rotulo: 'inconclusiva', motivo: 'o registro não traz detalhe suficiente' };
}
