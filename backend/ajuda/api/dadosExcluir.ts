/** Canal dados:excluir: Excluir histórico operacional, evidências de um projeto ou diagnósticos do aplicativo. */
import { dialog } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { textoExclusao } from '../../aplicativo/tipos/aplicativo.js';
import { excluirTodosContextos } from '../../agentes/banco/excluirTodosContextos.js';
import { excluirEvidencias } from '../../testes/banco/excluirEvidencias.js';
import { excluirAtividades } from '../../logs/banco/excluirAtividades.js';
import { excluirDiagnostico } from '../../logs/banco/excluirDiagnostico.js';
import { projetoVinculado } from '../../projetos/regras/projetoVinculado.js';

export const dadosExcluir: TratadorDoCanal<'dados:excluir'> = async (a, janela) => {
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Confirmar exclusão', buttons: ['Cancelar', 'Excluir'], defaultId: 0, cancelId: 0, noLink: true,
    message: textoExclusao[a.escopo], detail: 'Esta ação não pode ser desfeita. Código-fonte e demais arquivos do projeto não são tocados e o vínculo do projeto é mantido.' });
  if (r.response !== 1) return { canceled: true, deleted: 0, failed: [] };
  if (a.escopo === 'diagnostico') return { canceled: false, ...excluirDiagnostico() };
  const p = await projetoVinculado(a.root);
  return { canceled: false, ...(a.escopo === 'historico' ? excluirAtividades(p) : a.escopo === 'contextos' ? excluirTodosContextos(p) : await excluirEvidencias(p)) };
};
