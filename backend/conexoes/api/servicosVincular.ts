/** Canal servicos:vincular: Vincula um recurso do serviço (ex.: projeto Jira) a este projeto do Prumo, depois da confirmação. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

export const servicosVincular: TratadorDoCanal<'servicos:vincular'> = async(a,j)=>{obterEspaco(a.espacoId);if(!await confirmarNoWindows(j,'Confirmar vínculo',`Vincular ${a.recurso.nome}?`,`${a.recurso.instancia}\nID: ${a.recurso.id}\nConta: ${a.recurso.contaId}\nSomente este projeto Prumo. O recurso será revalidado. Nenhuma relação com outro serviço é deduzida.`,'Vincular'))return {canceled:true};return servicosDoAplicativo.vincular(a.espacoId,a.conexaoId,a.recurso);};
