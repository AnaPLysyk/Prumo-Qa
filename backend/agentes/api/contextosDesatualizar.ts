/** Canal contextos:desatualizar: Marcar um contexto como desatualizado (sem validade atual). */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { desatualizarContextoDaPasta } from '../regras/operacoesDoContextoDaPasta.js';
import { obterContextoDaPasta } from '../regras/operacoesDoContextoDaPasta.js';

export const contextosDesatualizar: TratadorDoCanal<'contextos:desatualizar'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Marcar como desatualizado', `Marcar "${c.titulo}" como desatualizado?`, 'Um contexto desatualizado deixa de valer, não pode mais ser editado nem aprovado e deixa de ser tratado como regra atual. O histórico é preservado.', 'Marcar desatualizado'))) return { canceled: true };
  return { canceled: false, contexto: await desatualizarContextoDaPasta(a.root, a.id, usuarioDoWindows()) };
};
