/** Controla concessões de escrita por projeto e confere as rotas autorizadas. */
import { lerPermissoesDeEscrita } from '../banco/operacoes.js';
import { gravarLocal } from '../../compartilhado/banco/persistenciaLocal.js';
import { Servico } from '../../projetos/contratos.js';
import { obterEspaco } from '../../projetos/banco/projetos.js';
import { permSchema } from '../tipos/operacoesExternas.js';
import { rotas } from '../tipos/rotasDeEscrita.js';

/** A escrita começa desativada, inclusive para contas com credenciais válidas. */
export function escritaHabilitada(espacoId: string, servico: Servico, base?: string) {
  return lerPermissoesDeEscrita(base).itens.some(
    item => item.espacoId === espacoId && item.servico === servico
  );
}

/** Confirma a existência do projeto e registra quem concedeu ou revogou a escrita. */
export function habilitarEscrita(
  espacoId: string,
  servico: Servico,
  habilitada: boolean,
  por: string,
  base?: string,
  agora = new Date()
) {
  obterEspaco(espacoId, base);
  const permissoes = lerPermissoesDeEscrita(base);
  permissoes.itens = permissoes.itens.filter(
    item => !(item.espacoId === espacoId && item.servico === servico)
  );
  if (habilitada) {
    permissoes.itens.push({ espacoId, servico, em: agora.toISOString(), por });
  }
  gravarLocal('permissoes-servicos.json', permSchema.parse(permissoes), base);
  return { espacoId, servico, habilitada };
}

/** Mostra todas as concessões de serviço do projeto em um único lugar. */
export const permissoesDoEspaco = (espacoId: string, base?: string) =>
  (['jira', 'qase', 'github'] as const).map(servico => ({
    servico,
    escrita: escritaHabilitada(espacoId, servico, base)
  }));

/** Bloqueia traversal, separadores codificados e métodos fora do catálogo fechado. */
export function rotaEscritaPermitida(servico: Servico, metodo: string, caminho: string): boolean {
  if (/%2e|%2f|%5c|\.\.|[\x00-\x1f\\]/i.test(caminho)) return false;
  return rotas[servico].some(rota => rota.metodo === metodo && rota.caminho.test(caminho));
}
