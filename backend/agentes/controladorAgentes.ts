/** Controlador da funcionalidade agentes: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { configuracaoDoEspaco } from "./servicoPoliticas.js";
import { matrizDePoliticas } from "./politicas/avaliarCapacidades.js";
import { especializacoes } from "./tipos/politicas.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { listarPropostas } from "../tickets/repositorio.js";
import { listarOrquestracoes } from "./repositorioOrquestracao.js";
import { listarAgentesPessoais, importarPreviasAntigas, excluirAgentePessoal, salvarAgentePessoal } from "./regras/agentesPessoais.js";
import { contaDaSessao } from "../login/regras/sessao.js";
import { rastrearPergunta } from "./chat/rastrearPergunta.js";
import { salvarConfiguracao } from "./servicoPoliticas.js";
import { textoNoIdioma } from "../aplicativo/bandeja/conteudoDaBandeja.js";
import { confirmarNoWindows } from "../aplicativo/janela/confirmarNoWindows.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { textoRemoto } from "../conexoes/integracoesFormatos.js";
import { servicosDoAplicativo } from "../conexoes/regras/servicosDoAplicativo.js";
import { salvarContextoDaPasta } from "./regras/salvarContextoDaPasta.js";
import { obterEspaco } from "../projetos/repositorio.js";

export const agentesEstado: TratadorDoCanal<'agentes:estado'> = a => ({ configuracao: configuracaoDoEspaco(a.espacoId), matriz: matrizDePoliticas(a.espacoId), especializacoes: especializacoes, propostasIA: listarPropostas(a.espacoId).filter(p => p.origem === 'IA').length });

export const agentesOrquestracoes: TratadorDoCanal<'agentes:orquestracoes'> = a => listarOrquestracoes(a.espacoId);

export const agentesPessoais: TratadorDoCanal<'agentes:pessoais'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return listarAgentesPessoais(a.espacoId, u.id);
};

export const agentesPessoaisimportar: TratadorDoCanal<'agentes:pessoaisimportar'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return importarPreviasAntigas(a.espacoId, a.previas, u.id);
};

export const agentesPessoalexcluir: TratadorDoCanal<'agentes:pessoalexcluir'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return excluirAgentePessoal(a.id, u.id);
};

export const agentesPessoalsalvar: TratadorDoCanal<'agentes:pessoalsalvar'> = (a) => {
  const u = contaDaSessao(); if (!u) throw new Error('SESSION_REQUIRED: entre com sua conta do Prumo para continuar.');
  return salvarAgentePessoal(a.espacoId, a.agente, u.id);
};

export const agentesRastrear: TratadorDoCanal<'agentes:rastrear'> = a => rastrearPergunta(a.pergunta, a.espacoId, a.agente);

export const agentesSalvar: TratadorDoCanal<'agentes:salvar'> = async (a, j) => {
  const i = idiomaAtual(); const bloq = Object.entries(a.politicas).filter(([, v]) => v === 'BLOQUEADO').map(([k]) => k).join(', ') || '—';
  if (!(await confirmarNoWindows(j, textoNoIdioma('agTitulo', i), textoNoIdioma('agMsg', i), textoNoIdioma('agDet', i, { e: a.especializacoes.join(', ') || '—', b: bloq }), textoNoIdioma('agBtn', i)))) return { canceled: true };
  return { canceled: false, configuracao: salvarConfiguracao(a.espacoId, { especializacoes: a.especializacoes, politicas: a.politicas }, usuarioDoWindows()) };
};

export const servicosImportar: TratadorDoCanal<'servicos:importar'> = async(a,j)=>{const e=obterEspaco(a.espacoId);const consulta=await servicosDoAplicativo.consultar(e.id,'jira','ticket',{},a.ticket);const item=consulta.dados as {fields?:{summary?:unknown;description?:unknown}};const titulo=textoRemoto(item.fields?.summary,200);const texto=textoRemoto(item.fields?.description);
  if(!texto.trim())throw new Error('JIRA_DESCRIPTION_MISSING');
  if(!await confirmarNoWindows(j,'Registrar contexto em rascunho',`Importar a descrição de ${a.ticket}?`,texto+'\n\nSerá RASCUNHO, sem aprovação automática. Se você habilitou contextos ao MCP, o agente poderá ler este rascunho.','Registrar rascunho'))return {canceled:true};
  const contexto=await salvarContextoDaPasta(e.raizContextos,{dados:{tipo:'requisito',titulo,texto,origem:{tipo:'documento',referencia:consulta.origem+'/browse/'+a.ticket}}},usuarioDoWindows());return {contexto};};
