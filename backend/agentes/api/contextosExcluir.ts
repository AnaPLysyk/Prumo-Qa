/** Canal contextos:excluir: Excluir definitivamente um contexto. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { excluirContextoDaPasta } from '../regras/operacoesDoContextoDaPasta.js';
import { obterContextoDaPasta } from '../regras/operacoesDoContextoDaPasta.js';

export const contextosExcluir: TratadorDoCanal<'contextos:excluir'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Excluir contexto', `Excluir definitivamente "${c.titulo}"?`, 'O contexto e o seu histórico serão apagados; só ficam o identificador, a data e o hash de que ele existiu. O código e os demais arquivos do projeto não são tocados.', 'Excluir'))) return { canceled: true, deleted: false };
  return { canceled: false, ...(await excluirContextoDaPasta(a.root, a.id)) };
};
