/** Canal contextos:aprovar: Aprovar explicitamente o conteúdo atual de um contexto. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { aprovarContextoDaPasta } from '../regras/aprovarContextoDaPasta.js';
import { obterContextoDaPasta } from '../regras/obterContextoDaPasta.js';

export const contextosAprovar: TratadorDoCanal<'contextos:aprovar'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Aprovar contexto', `Aprovar "${c.titulo}" (versão ${c.versao})?`, `Você confirma que este conteúdo é uma regra válida, na origem informada: ${c.origem.referencia || '(sem origem)'}.\nA aprovação vale só para este texto exato; qualquer edição volta o contexto a rascunho. Aprovador registrado: ${usuarioDoWindows()}.`, 'Aprovar'))) return { canceled: true };
  return { canceled: false, contexto: await aprovarContextoDaPasta(a.root, a.id, usuarioDoWindows()) };
};
