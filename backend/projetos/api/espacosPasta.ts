/** Canal espacos:pasta: Vincular a pasta de um repositório de código ao projeto Prumo, de qualquer stack. */
import { dialog } from 'electron';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { obterEspaco } from '../banco/obterEspaco.js';
import { gravarContratoProposto } from '../regras/gravarContratoProposto.js';
import { proporContrato } from '../regras/proporContrato.js';
import { resumirContratoProposto } from '../regras/resumirContratoProposto.js';
import { situacaoProjeto } from '../regras/situacaoProjeto.js';
import { vincularPastaAoEspaco } from '../regras/vincularPastaAoEspaco.js';

// 2.10.2: qualquer pasta de código. Sem qa.project.json, o Prumo detecta a stack e propõe o contrato; só grava depois da
// confirmação nativa. A pasta vem do diálogo do sistema, nunca do renderer. Contrato existente nunca é sobrescrito.
export const espacosPasta: TratadorDoCanal<'espacos:pasta'> = async(a,j)=>{
  obterEspaco(a.id);const r=await dialog.showOpenDialog(j!,{title:'Pasta do repositório ou projeto de código',properties:['openDirectory']});if(r.canceled||!r.filePaths[0])return {canceled:true};
  const s=await situacaoProjeto(r.filePaths[0]);
  if(s.state==='PASTA_AUSENTE')throw new Error('WORKSPACE_LOCAL_FOLDER_MISSING: a pasta escolhida não existe ou não pode ser lida.');
  if(s.state==='MANIFESTO_INVALIDO')throw new Error(`WORKSPACE_LOCAL_CONTRACT_INVALID: o qa.project.json desta pasta não é válido (${s.message}). Corrija o arquivo, ou apague-o para o Prumo propor um contrato novo, e vincule de novo. Veja Ajuda › Como vincular.`);
  if(s.state==='SEM_MANIFESTO'){
    const p=proporContrato(s.root);
    if(!await confirmarNoWindows(j,'Criar contrato do projeto','Esta pasta ainda não tem qa.project.json. Criar o contrato proposto e vincular?',resumirContratoProposto(p),'Criar contrato e vincular'))return {canceled:true};
    await gravarContratoProposto(p);
  }
  return vincularPastaAoEspaco(a.id,s.root);
};
