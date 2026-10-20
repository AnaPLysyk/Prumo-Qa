/** Controlador da funcionalidade conexoes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { servicosDoAplicativo } from "./regras/servicosDoAplicativo.js";
import { confirmarNoWindows } from "../aplicativo/janela/confirmarNoWindows.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { removerVinculoServico } from "../projetos/servicoProjetos.js";

export const servicosAceite: TratadorDoCanal<'servicos:aceite'> = a=>servicosDoAplicativo.campoAceite(a.espacoId,a.campo);

export const servicosAdicionar: TratadorDoCanal<'servicos:adicionar'> = async(a,j)=>{if(!await confirmarNoWindows(j,'Adicionar conexão de leitura',`Configurar ${a.servico}?`,'A credencial será protegida no perfil Windows. As consultas são explícitas; o renderer e os agentes não recebem a credencial armazenada. A escrita no serviço fica desligada até você habilitá-la por projeto em Conexões, e cada envio mostra a prévia e pede confirmação.','Configurar'))return {canceled:true};return servicosDoAplicativo.adicionar(a);};

export const servicosConferir: TratadorDoCanal<'servicos:conferir'> = a=>servicosDoAplicativo.validarVinculo(a.espacoId,a.servico);

export const servicosConsultar: TratadorDoCanal<'servicos:consultar'> = a=>servicosDoAplicativo.consultar(a.espacoId,a.servico,a.operacao,a.pagina,a.id,a.filtros);

export const servicosDesvincular: TratadorDoCanal<'servicos:desvincular'> = async(a,j)=>{obterEspaco(a.espacoId);if(!await confirmarNoWindows(j,'Remover vínculo',`Remover o vínculo ${a.servico}?`,'Relações anteriores e histórico serão preservados. Nenhum dado externo será excluído.','Remover'))return {canceled:true};return removerVinculoServico(a.espacoId,a.servico);};

export const servicosListar: TratadorDoCanal<'servicos:listar'> = ()=>servicosDoAplicativo.contas();

export const servicosQasecancelar: TratadorDoCanal<'servicos:qasecancelar'> = a => servicosDoAplicativo.qaseCancelar(a.previaId);

export const servicosQaseimportar: TratadorDoCanal<'servicos:qaseimportar'> = async (a,j) => {
  if (!await confirmarNoWindows(j,'Importar projetos Qase',`Adicionar ${a.codigos.length} projetos ao Prumo?`,
    `Projetos: ${a.codigos.join(', ')}. A credencial será salva no cofre e cada projeto selecionado terá um espaço próprio. A escrita no Qase permanece desligada.`, 'Importar')) return {canceled:true};
  return servicosDoAplicativo.qaseImportar(a.previaId,a.codigos);
};

export const servicosQaseprevia: TratadorDoCanal<'servicos:qaseprevia'> = a => servicosDoAplicativo.qasePrever(a.token);

export const servicosQasepreviaconta: TratadorDoCanal<'servicos:qasepreviaconta'> = a => servicosDoAplicativo.qasePreverConta(a.conexaoId);

export const servicosRecursos: TratadorDoCanal<'servicos:recursos'> = a=>servicosDoAplicativo.listar(a.id,a.pagina);

export const servicosRemover: TratadorDoCanal<'servicos:remover'> = async(a,j)=>{if(!await confirmarNoWindows(j,'Remover conexão','Remover esta credencial e desativar a conexão?','Vínculos e histórico permanecem identificados; nenhum recurso externo será apagado.','Remover'))return {canceled:true};return servicosDoAplicativo.removerConta(a.id);};

export const servicosValidar: TratadorDoCanal<'servicos:validar'> = a=>servicosDoAplicativo.validarConta(a.id);

export const servicosVincular: TratadorDoCanal<'servicos:vincular'> = async(a,j)=>{obterEspaco(a.espacoId);if(!await confirmarNoWindows(j,'Confirmar vínculo',`Vincular ${a.recurso.nome}?`,`${a.recurso.instancia}\nID: ${a.recurso.id}\nConta: ${a.recurso.contaId}\nSomente este projeto Prumo. O recurso será revalidado. Nenhuma relação com outro serviço é deduzida.`,'Vincular'))return {canceled:true};return servicosDoAplicativo.vincular(a.espacoId,a.conexaoId,a.recurso);};
