/** Controlador da funcionalidade projetos: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { associarEspaco, desassociarEspaco } from "./servicoProjetos.js";
import { localizarK6 } from "../agendamentos/servicoK6.js";
import { contextoCompleto } from "../agentes/mcp/consultasDoProjeto.js";
import { carregarProjeto } from "../compartilhado/projeto/carregarProjeto.js";
import { obterEspaco } from "./banco/projetos.js";
import { criarEspaco } from "./servicoProjetos.js";
import { editarEspaco, configurarManualDoEspaco } from "./servicoProjetos.js";
import { listarEspacos } from "./banco/projetos.js";
import { donoDoRecurso } from "./unicidadeDosVinculos.js";
import { dialog, app } from "electron";
import { confirmarNoWindows } from "../aplicativo/janela/controleDaJanela.js";
import { vincularPastaDoDisco } from "./servicoProjetos.js";
import path from "node:path";
import { diretorioDados } from "../compartilhado/banco/diretorioDados.js";
import { clonarOuAtualizarRepositorio, repositorioValido } from "./servicoRepositorioGit.js";
import { raizDoAplicativo } from "../compartilhado/raizDoAplicativo.js";
import { adicionarVinculo } from "./servicoProjetos.js";
import { servicosDoAplicativo } from "../conexoes/regras/nucleoServicos.js";
import { copiarDemonstracao } from "./servicoRepositorioGit.js";
import { desvincularPasta } from "./servicoProjetos.js";
import { gravarContratoProposto } from "./servicoProjetos.js";
import { proporContrato } from "./servicoProjetos.js";
import { resumirContratoProposto } from "./servicoProjetos.js";
import { situacaoProjeto } from "./servicoProjetos.js";
import { listarPastasVinculadas } from "./servicoProjetos.js";
import { visaoGeralDoProjeto } from "./servicoProjetos.js";

import { arvoreDoRepositorio, lerArquivoDoRepositorio, gravarArquivoDoRepositorio, buscarNoRepositorio } from "./ideRepositorio.js";
import { estadoDoGit, diferencaDoGit } from "./ideGit.js";

function pastaParaIde(espacoId: string) { const e = obterEspaco(espacoId); if (!e.pastaLocal) throw new Error('IDE_SEM_REPOSITORIO'); return { e, pasta: e.pastaLocal }; }
export const ideArvore: TratadorDoCanal<'ide:arvore'> = a => arvoreDoRepositorio(pastaParaIde(a.espacoId).pasta);
export const ideArquivo: TratadorDoCanal<'ide:arquivo'> = a => lerArquivoDoRepositorio(pastaParaIde(a.espacoId).pasta, a.arquivo);
export const ideBuscar: TratadorDoCanal<'ide:buscar'> = a => buscarNoRepositorio(pastaParaIde(a.espacoId).pasta, a.consulta, a.diferenciarCaixa, a.regex);
export const ideGitEstado: TratadorDoCanal<'ide:gitestado'> = a => estadoDoGit(pastaParaIde(a.espacoId).pasta);
export const ideGitDiff: TratadorDoCanal<'ide:gitdiff'> = a => diferencaDoGit(pastaParaIde(a.espacoId).pasta, a.arquivo);
export const ideGravar: TratadorDoCanal<'ide:gravar'> = async (a, j) => {
  const { e, pasta } = pastaParaIde(a.espacoId);
  const detalhe = 'Pasta: ' + pasta + '\nArquivo: ' + a.arquivo + '\nNada será executado, publicado ou enviado ao GitHub.';
  if (!await confirmarNoWindows(j, 'Salvar código local', 'Gravar alterações no projeto ' + e.nome + '?', detalhe, 'Salvar arquivo')) return { canceled: true };
  return gravarArquivoDoRepositorio(pasta, a.arquivo, a.conteudo, a.hashBase);
};

export const espacosAssociar: TratadorDoCanal<'espacos:associar'> = async (a, j) => {
  if (!a.remover) return associarEspaco(a.id, a.dados);
  if (!(await confirmarNoWindows(j, 'Remover vínculo', 'Remover o vínculo declarado entre estes itens?', `${a.dados.de.tipo} ${a.dados.de.id} ↔ ${a.dados.para.tipo} ${a.dados.para.id}`, 'Remover'))) return { canceled: true };
  return desassociarEspaco(a.id, a.dados);
};

export const espacosAutomacoes: TratadorDoCanal<'espacos:automacoes'> = async a=>{const e=obterEspaco(a.id);const k6=(await localizarK6())!==null;if(!e.pastaLocal)return {pastaLocal:null,estado:'SEM_PASTA',frameworks:[],capacidades:[],k6Disponivel:k6};const p=await carregarProjeto(e.pastaLocal);const c=await contextoCompleto(p);return {pastaLocal:p.raiz,estado:'INTEGRADO',frameworks:c.frameworks,capacidades:Object.keys(p.manifesto.commands),readOnly:p.manifesto.execution.readOnly,k6Disponivel:k6};};

export const espacosCriar: TratadorDoCanal<'espacos:criar'> = a=>criarEspaco(a);

/** Cada recurso diz se já está em algum projeto do Prumo (e qual), para a tela não oferecer o que não pode ser vinculado de novo. */
export const projetosRecursos: TratadorDoCanal<'projetos:recursos'> = async a => {
  const lista = await servicosDoAplicativo.listar(a.conexaoId, a.pagina);
  const servico = servicosDoAplicativo.contas().find(c => c.id === a.conexaoId)?.servico;
  const espacos = listarEspacos();
  return { ...lista, recursos: lista.recursos.map(r => { const dono = servico ? donoDoRecurso(espacos, servico, r) : null; return { ...r, usadoPor: dono ? { id: dono.id, nome: dono.nome } : null }; }) };
};
export const projetosVincular: TratadorDoCanal<'projetos:vincular'> = async(a,j) => {
  const e=obterEspaco(a.espacoId);
  if(!await confirmarNoWindows(j,'Vincular serviço ao projeto',`Vincular ${a.recurso.nome} a ${e.nome}?`,
    `Recurso: ${a.recurso.chave}\nOrigem: ${a.recurso.instancia}\nO recurso será revalidado e só este projeto receberá o vínculo. Nenhum dado externo será modificado.`,'Vincular')) return {canceled:true};
  return servicosDoAplicativo.vincular(a.espacoId,a.conexaoId,a.recurso);
};

/** Importação sem correspondência automática: cada recurso escolhido ganha o seu próprio espaço. */
export const projetosImportar: TratadorDoCanal<'projetos:importar'> = async (a,j) => {
  if (!await confirmarNoWindows(j,'Importar projeto de serviço',`Criar projeto Prumo para ${a.recurso.nome}?`,
    `Origem: ${a.recurso.instancia}\nRecurso: ${a.recurso.chave}\nNenhuma conexão com outro serviço será criada. Nenhum dado externo será modificado.`,'Importar')) return {canceled:true};
  return servicosDoAplicativo.importarProjeto(a.conexaoId,a.recurso);
};

export const espacosEditar: TratadorDoCanal<'espacos:editar'> = a=>editarEspaco(a.id,a.dados);
export const espacosManual: TratadorDoCanal<'espacos:manual'> = a=>configurarManualDoEspaco(a.id,a.ativo);

export const espacosListar: TratadorDoCanal<'espacos:listar'> = ()=>listarEspacos();

export const espacosObter: TratadorDoCanal<'espacos:obter'> = a=>obterEspaco(a.id);

// Qualquer pasta de código. Sem qa.project.json, o Prumo detecta a stack e propõe o contrato; só grava depois da
// confirmação nativa. A pasta vem do diálogo do sistema, nunca do renderer. Contrato existente nunca é sobrescrito.
export const espacosPasta: TratadorDoCanal<'espacos:pasta'> = async (a, j) => {
  obterEspaco(a.id); const r = await dialog.showOpenDialog(j!, { title: 'Pasta do repositório ou projeto de código', properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return vincularPastaDoDisco(a.id, r.filePaths[0], (t, m, d, b) => confirmarNoWindows(j, t, m, d, b));
};

export const espacosTrazer: TratadorDoCanal<'espacos:trazer'> = async (a, j) => {
  const e = obterEspaco(a.id); const gh = e.vinculos.find((v) => v.servico === 'github');
  if (!gh) throw new Error('GITHUB_NOT_LINKED: vincule um repositório do GitHub ao projeto, em Projetos, antes de trazê-lo.');
  const chave = String(gh.recurso.chave); if (!repositorioValido(chave)) throw new Error('GIT_URL_INVALID: o repositório vinculado tem um nome que o Prumo não aceita.');
  const raizDosClones = path.join(diretorioDados(), 'repositorios', e.id); const destino = path.join(raizDosClones, chave.split('/')[1]!);
  const atualizar = !!e.pastaLocal && path.resolve(e.pastaLocal).toLowerCase() === path.resolve(destino).toLowerCase();
  if (e.pastaLocal && !atualizar && !a.trocar) throw new Error('CLONE_NOT_FROM_PRUMO: a pasta deste projeto não foi trazida pelo Prumo; atualize-a com o seu próprio git.');
  const url = `https://github.com/${chave}.git`;
  const detalhe = `Repositório: ${chave}\nDestino: ${destino}\n${a.trocar && e.pastaLocal ? 'A IDE passará a usar esta cópia; a pasta anterior será preservada: ' + e.pastaLocal + '\n' : ''}${atualizar ? 'Atualiza só por avanço (fast-forward); mudanças suas não são sobrescritas.' : 'Cópia nova com os últimos 50 commits da ramificação principal.'}\nUsa o git instalado neste computador e as credenciais dele; o Prumo não entrega a sua credencial ao git. Hooks e links simbólicos ficam desligados e nada é executado.`;
  if (!await confirmarNoWindows(j, atualizar ? 'Atualizar repositório do GitHub' : 'Trazer repositório do GitHub', `${atualizar ? 'Atualizar' : 'Baixar'} ${chave} em uma pasta deste computador?`, detalhe, atualizar ? 'Atualizar' : 'Baixar')) return { canceled: true };
  const r = await clonarOuAtualizarRepositorio(url, destino);
  if (atualizar) return { canceled: false, acao: r.acao, pasta: r.pasta, ramo: r.ramo };
  const v = await vincularPastaDoDisco(e.id, r.pasta, (t, m, d, b) => confirmarNoWindows(j, t, m, d, b));
  if ('canceled' in v) return { canceled: false, acao: r.acao, pasta: r.pasta, ramo: r.ramo, vinculada: false };
  return { canceled: false, acao: r.acao, pasta: r.pasta, ramo: r.ramo, vinculada: true };
};

export const projetosDemo: TratadorDoCanal<'projetos:demo'> = async () => {
  const origem = app.isPackaged ? path.join(process.resourcesPath, 'demo') : path.join(raizDoAplicativo, 'backend', 'projetos', 'exemplos', 'projeto-demo');
  return adicionarVinculo(copiarDemonstracao(origem));
};

export const projetosDesvincular: TratadorDoCanal<'projetos:desvincular'> = a => desvincularPasta(a.root);

export const projetosEscolher: TratadorDoCanal<'projetos:escolher'> = async (_a, janela) => {
  const r = await dialog.showOpenDialog(janela!, { title: 'Selecionar a pasta do projeto', properties: ['openDirectory'] });
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  // Mesma proposta de contrato do vínculo de projeto Prumo, com aprovação nativa antes de gravar.
  const s = await situacaoProjeto(r.filePaths[0]);
  if (s.state === 'SEM_MANIFESTO') {
    const p = proporContrato(s.root);
    if (!await confirmarNoWindows(janela, 'Criar contrato do projeto', 'Esta pasta ainda não tem qa.project.json. Criar o contrato proposto e vincular?', resumirContratoProposto(p), 'Criar contrato e vincular')) return { canceled: true };
    await gravarContratoProposto(p);
  }
  return { canceled: false, ...(await adicionarVinculo(s.root)) };
};

export const projetosListar: TratadorDoCanal<'projetos:listar'> = () => listarPastasVinculadas();

export const projetoVisao: TratadorDoCanal<'projeto:visao'> = a => visaoGeralDoProjeto(a.root);
