/** Canal servicos:desvincular: Remove o vínculo do projeto com um serviço depois da confirmação; nada é apagado no serviço. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';
import { removerVinculoServico } from '../../projetos/regras/historicoDeVinculos.js';

export const servicosDesvincular: TratadorDoCanal<'servicos:desvincular'> = async(a,j)=>{obterEspaco(a.espacoId);if(!await confirmarNoWindows(j,'Remover vínculo',`Remover o vínculo ${a.servico}?`,'Relações anteriores e histórico serão preservados. Nenhum dado externo será excluído.','Remover'))return {canceled:true};return removerVinculoServico(a.espacoId,a.servico);};
