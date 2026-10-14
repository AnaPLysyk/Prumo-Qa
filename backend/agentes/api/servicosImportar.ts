/** Canal servicos:importar: Importa a descrição de um ticket do Jira como contexto em rascunho, depois da confirmação. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { usuarioDoWindows } from '../../aplicativo/janela/usuarioDoWindows.js';
import { textoRemoto } from '../../conexoes/integracoes/textoRemoto.js';
import { servicosDoAplicativo } from '../../conexoes/regras/servicosDoAplicativo.js';
import { salvarContextoDaPasta } from '../regras/salvarContextoDaPasta.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

export const servicosImportar: TratadorDoCanal<'servicos:importar'> = async(a,j)=>{const e=obterEspaco(a.espacoId);const consulta=await servicosDoAplicativo.consultar(e.id,'jira','ticket',{},a.ticket);const item=consulta.dados as {fields?:{summary?:unknown;description?:unknown}};const titulo=textoRemoto(item.fields?.summary,200);const texto=textoRemoto(item.fields?.description);
  if(!texto.trim())throw new Error('JIRA_DESCRIPTION_MISSING');
  if(!await confirmarNoWindows(j,'Registrar contexto em rascunho',`Importar a descrição de ${a.ticket}?`,texto+'\n\nSerá RASCUNHO, sem aprovação automática. Se você habilitou contextos ao MCP, o agente poderá ler este rascunho.','Registrar rascunho'))return {canceled:true};
  const contexto=await salvarContextoDaPasta(e.raizContextos,{dados:{tipo:'requisito',titulo,texto,origem:{tipo:'documento',referencia:consulta.origem+'/browse/'+a.ticket}}},usuarioDoWindows());return {contexto};};
