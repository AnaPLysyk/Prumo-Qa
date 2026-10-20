/** Canal conexao:aplicar: Adicionar o servidor MCP à configuração do Codex. */
import { dialog } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { aplicarConexao } from '../ia/aplicarConexao.js';
import { prepararConexao } from '../ia/prepararConexao.js';
import { projetoVinculado } from '../../projetos/regras/projetoVinculado.js';

// Alterar configuração de outro programa exige uma caixa de confirmação nativa, que a página não consegue simular.
export const conexaoAplicar: TratadorDoCanal<'conexao:aplicar'> = async (a, janela) => {
  const p = await projetoVinculado(a.root);
  const plano = prepararConexao(p, a.client);
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Confirmar conexão', buttons: ['Cancelar', 'Adicionar configuração'], defaultId: 0, cancelId: 0, noLink: true,
    message: `Adicionar o servidor MCP "${plano.name}" ao ${a.client}?`,
    detail: `Destino: ${plano.destination}\n\nComando:\n${plano.command}\n\nConfigurações existentes com o mesmo nome não são sobrescritas. Isto não comprova uma sessão ativa.` });
  if (r.response !== 1) return { configured: false, reason: 'Cancelado; nenhuma alteração.' };
  return aplicarConexao(plano, plano.confirmation);
};
