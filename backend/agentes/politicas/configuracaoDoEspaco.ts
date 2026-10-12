/** Lê as especializações e políticas da IA neste projeto (ou o padrão). */
import { lerConfiguracaoDosAgentes } from '../banco/lerConfiguracaoDosAgentes.js';
import { Configuracao, idsEsp } from '../tipos/politicas.js';

/** Sem configuração salva vale o padrão: todas as especializações habilitadas e as políticas padrão (comportamento anterior à 2.9). */
export function configuracaoDoEspaco(espacoId: string, b?: string): Configuracao {
  const i = lerConfiguracaoDosAgentes(b).itens.find(x => x.espacoId === espacoId);
  return i ? { especializacoes: i.especializacoes.filter(e => idsEsp.includes(e as never)), politicas: i.politicas, padrao: false } : { especializacoes: [...idsEsp], politicas: {}, padrao: true };
}
