/** Importa projetos Qase selecionados depois da confirmação nativa da pessoa. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';
export const servicosQaseimportar: TratadorDoCanal<'servicos:qaseimportar'> = async (a,j) => {
  if (!await confirmarNoWindows(j,'Importar projetos Qase',`Adicionar ${a.codigos.length} projetos ao Prumo?`,
    `Projetos: ${a.codigos.join(', ')}. A credencial será salva no cofre e cada projeto selecionado terá um espaço próprio. A escrita no Qase permanece desligada.`, 'Importar')) return {canceled:true};
  return servicosDoAplicativo.qaseImportar(a.previaId,a.codigos);
};
