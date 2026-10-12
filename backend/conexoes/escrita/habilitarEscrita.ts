/** Liga ou desliga a escrita de um serviço no projeto, registrando quem fez. */
import { gravarLocal } from '../../compartilhado/banco/gravarLocal.js';
import { lerPermissoesDeEscrita } from '../banco/lerPermissoesDeEscrita.js';
import { permSchema } from '../tipos/operacoesExternas.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { Servico } from '../../projetos/tipos/espacos.js';

export function habilitarEscrita(espacoId: string, servico: Servico, habilitada: boolean, por: string, b?: string, agora = new Date()) {
  obterEspaco(espacoId, b); const r = lerPermissoesDeEscrita(b); r.itens = r.itens.filter(i => !(i.espacoId === espacoId && i.servico === servico));
  if (habilitada) r.itens.push({ espacoId, servico, em: agora.toISOString(), por }); gravarLocal('permissoes-servicos.json', permSchema.parse(r), b); return { espacoId, servico, habilitada };
}
