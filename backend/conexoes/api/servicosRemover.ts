/** Canal servicos:remover: Remove uma conta e sua credencial depois da confirmação nativa. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';

export const servicosRemover: TratadorDoCanal<'servicos:remover'> = async(a,j)=>{if(!await confirmarNoWindows(j,'Remover conexão','Remover esta credencial e desativar a conexão?','Vínculos e histórico permanecem identificados; nenhum recurso externo será apagado.','Remover'))return {canceled:true};return servicosDoAplicativo.removerConta(a.id);};
