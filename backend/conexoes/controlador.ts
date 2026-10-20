/** Controlador da tela conexoes: concentra canais de entrada, organizados por área funcional. */
import { dialog } from "electron";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { aplicarConexao, prepararConexao } from "./ia/conectarIa.js";
import { projetoVinculado, removerVinculoServico } from "../projetos/servicoProjetos.js";
import { testarIntegracao } from "./servicoIaDiagnostico.js";
import { catalogoOperacoes } from "./escrita/catalogoOperacoes.js";
import { permissoesDoEspaco, habilitarEscrita } from "./escrita/permissoes.js";
import { textoNoIdioma } from "../aplicativo/bandeja/conteudoDaBandeja.js";
import { confirmarNoWindows } from "../aplicativo/janela/controleDaJanela.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { nomeServico } from "../aplicativo/tipos/aplicativo.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { executarOperacao } from "./escrita/executarOperacao.js";
import { prepararOperacao } from "./escrita/executarOperacao.js";
import { servicosDoAplicativo } from "./regras/nucleoServicos.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { resolverAnexo } from "../tickets/servicoPropostas.js";
import { listarOperacoes } from "./banco/operacoes.js";
import { situacaoDasConexoesDeIa } from "./servicoIaDiagnostico.js";

// controladorConexoes — operações relacionadas
// Alterar configuração de outro programa exige uma caixa de confirmação nativa, que a página não consegue simular.
export const conexaoAplicar: TratadorDoCanal<'conexao:aplicar'> = async (a, janela) => {
  const p = await projetoVinculado(a.root);
  const plano = prepararConexao(p, a.client);
  const r = await dialog.showMessageBox(janela!, { type: 'warning', title: 'Confirmar conexão', buttons: ['Cancelar', 'Adicionar configuração'], defaultId: 0, cancelId: 0, noLink: true,
    message: `Adicionar o servidor MCP "${plano.name}" ao ${a.client}?`,
    detail: `Destino: ${plano.destination}\n\nComando:\n${plano.command}\n\nConfigurações existentes com o mesmo nome não são sobrescritas. Isto não comprova uma sessão ativa.` });
  if (r.response !== 1) return { configured: false, reason: 'Cancelado; nenhuma alteração.' };
  return aplicarConexao(plano, plano.confirmation);
};

export const conexaoTestar: TratadorDoCanal<'conexao:testar'> = a => testarIntegracao(a.root,a.client);

export const escritaEstado: TratadorDoCanal<'escrita:estado'> = a => ({ servicos: permissoesDoEspaco(a.espacoId), operacoes: catalogoOperacoes.map(o => ({ id: o.id, servico: o.servico, rotulo: o.rotulo, efeito: o.efeito })) });

export const escritaHabilitar: TratadorDoCanal<'escrita:habilitar'> = async (a, j) => {
  const i = idiomaAtual();
  if (a.habilitada && !(await confirmarNoWindows(j, textoNoIdioma('habTitulo', i), textoNoIdioma('habMsg', i, { s: nomeServico[a.servico] }), textoNoIdioma('habDet', i), textoNoIdioma('habBtn', i)))) return { canceled: true };
  return { canceled: false, ...habilitarEscrita(a.espacoId, a.servico, a.habilitada, usuarioDoWindows()) };
};

export const operacoesExecutar: TratadorDoCanal<'operacoes:executar'> = async (a, j) => {
  const i = idiomaAtual(); const parametros = { ...a.parametros } as Record<string, unknown>; delete parametros.arquivo; let aux; // o caminho nunca vem da página
  if (a.anexo && (a.operacao === 'jira.anexar' || a.operacao === 'qase.anexar')) {
    let escolhido: string | null = null;
    if (a.anexo.tipo === 'arquivo') { const r = await dialog.showOpenDialog(j!, { title: textoNoIdioma('arquivoTitulo', i), properties: ['openFile'] }); if (r.canceled || !r.filePaths[0]) return { canceled: true }; escolhido = r.filePaths[0]; }
    const res = resolverAnexo(a.espacoId, a.anexo, escolhido); parametros.arquivo = res.arquivo; aux = res.aux;
  }
  const prev = prepararOperacao(a.espacoId, a.operacao, parametros); const e = obterEspaco(a.espacoId);
  if (!(await confirmarNoWindows(j, textoNoIdioma('opTitulo', i), textoNoIdioma('opMsg', i, { s: nomeServico[prev.servico], r: prev.rotulo }), textoNoIdioma('opDet', i, { x: prev.resumo + '\n\n' + prev.efeito, p: e.nome }), textoNoIdioma('opBtn', i)))) return { canceled: true };
  return { canceled: false, ...(await executarOperacao(servicosDoAplicativo, a.espacoId, a.operacao, parametros, { confirmado: true, aux })) };
};

export const operacoesListar: TratadorDoCanal<'operacoes:listar'> = a => listarOperacoes(a.espacoId, a.limite ?? 100);

export const projetoConexoes: TratadorDoCanal<'projeto:conexoes'> = a => situacaoDasConexoesDeIa(a.root);

// controladorServicos — operações relacionadas
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
