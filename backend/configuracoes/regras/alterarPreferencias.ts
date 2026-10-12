/** Altera as preferências pedidas pela tela (tema, idioma, som, avisos...) sem mexer na autorização de IA. */
import { gravarPreferencias } from '../banco/gravarPreferencias.js';
import { lerPreferencias } from '../banco/lerPreferencias.js';
import { alteracaoSchema } from '../tipos/configuracoes.js';

export function alterarPreferencias(alteracao: unknown, base?: string) {
  const a = alteracaoSchema.parse(alteracao); const atual = lerPreferencias(base);
  return gravarPreferencias({ ...atual, ...a, ia: { ...atual.ia, ...(a.ia ?? {}), delegacao: atual.ia.delegacao } }, base);
}
