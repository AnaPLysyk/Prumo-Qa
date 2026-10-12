/** Confere de novo o vínculo do projeto com o serviço (aceitando mudança de chave do recurso) e devolve o projeto atualizado. */
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { Servico } from '../../projetos/tipos/espacos.js';
import { ContextoDosServicos } from '../tipos/contaDeServico.js';
import { verificarVinculoDoServico } from './verificarVinculoDoServico.js';

export async function validarVinculoDoServico(c: ContextoDosServicos, espacoId: string, servico: Servico) {
  await verificarVinculoDoServico(c, espacoId, servico, true);
  return obterEspaco(espacoId, c.base);
}
