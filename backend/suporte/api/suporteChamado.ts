/** Canal suporte:chamado: Abrir a página oficial de um chamado para ler ou responder pelo GitHub. */
import { dialog, shell } from 'electron';
import { repositorio } from '../../ajuda/tipos/versoes.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const suporteChamado: TratadorDoCanal<'suporte:chamado'> = async (a,janela) => {
  const r=await dialog.showMessageBox(janela!,{type:'question',buttons:['Cancelar','Abrir chamado'],defaultId:0,cancelId:0,message:`Abrir o chamado #${a.numero} no GitHub oficial?`});
  if(r.response!==1)return {opened:false};
  await shell.openExternal(`https://github.com/${repositorio}/issues/${a.numero}`);return {opened:true};
};
