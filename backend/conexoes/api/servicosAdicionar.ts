/** Canal servicos:adicionar: Adiciona uma conta de serviço depois da confirmação nativa; a credencial fica protegida pelo Windows. */
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';
import { confirmarNoWindows } from '../../aplicativo/janela/confirmarNoWindows.js';
import { servicosDoAplicativo } from '../regras/servicosDoAplicativo.js';

export const servicosAdicionar: TratadorDoCanal<'servicos:adicionar'> = async(a,j)=>{if(!await confirmarNoWindows(j,'Adicionar conexão de leitura',`Configurar ${a.servico}?`,'A credencial será protegida no perfil Windows. As consultas são explícitas; o renderer e os agentes não recebem a credencial armazenada. A escrita no serviço fica desligada até você habilitá-la por projeto em Conexões, e cada envio mostra a prévia e pede confirmação.','Configurar'))return {canceled:true};return servicosDoAplicativo.adicionar(a);};
