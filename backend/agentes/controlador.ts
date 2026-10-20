/** Controlador da tela agentes: concentra canais de entrada, organizados por área funcional. */
import { configuracaoDoEspaco, salvarConfiguracao } from "./servicoPoliticas.js";
import { matrizDePoliticas } from "./servicoPoliticas.js";
import { especializacoes } from "./tipos/persona.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";
import { listarPropostas } from "../tickets/banco/tickets.js";
import { listarOrquestracoes } from "./banco/orquestracao.js";
import { listarAgentesPessoais, importarPreviasAntigas, excluirAgentePessoal, salvarAgentePessoal } from "./regras/agentesPessoais.js";
import { contaDaSessao } from "../login/regras/sessao.js";
import { rastrearPergunta } from "./chat/conversar.js";
import { textoNoIdioma } from "../aplicativo/bandeja/conteudoDaBandeja.js";
import { confirmarNoWindows } from "../aplicativo/janela/controleDaJanela.js";
import { usuarioDoWindows } from "../aplicativo/janela/usuarioDoWindows.js";
import { idiomaAtual } from "../configuracoes/servico.js";
import { textoRemoto } from "../conexoes/integracoes/configuracaoDosServicos.js";
import { servicosDoAplicativo } from "../conexoes/regras/nucleoServicos.js";
import { salvarContextoDaPasta, aprovarContextoDaPasta, obterContextoDaPasta, desatualizarContextoDaPasta, excluirContextoDaPasta, permitirContextosNoMcp, conflitoDeContextoDaPasta } from "./regras/cicloDosContextos.js";
import { obterEspaco } from "../projetos/banco/projetos.js";
import { agentesDoChat } from "./chat/roteamento.js";
import { executavelDaIa, executarCliDeIa } from "./chat/consultarIaExterna.js";
import { localizarClienteDeIa } from "../conexoes/ia/conectarIa.js";
import { lerPreferencias } from "../configuracoes/servico.js";
import { regrasDosAgentes } from "../administracao/servico.js";
import { aprenderTermos, decidirConhecimento, esquecerTermo, vocabularioDoAgente } from "./banco/atendimentos.js";
import { avaliarAtendimento, registrarAtendimento, listarAtendimentos } from "./banco/atendimentos.js";
import { conversar } from "./chat/conversar.js";
import { dialog, shell } from "electron";
import { apagarConhecimento, registrarConhecimento, listarConhecimentos } from "./banco/conhecimento.js";
import { estadoConhecimento } from "./banco/conhecimento.js";
import { caminhoConhecimento } from "./banco/comBancoDeConhecimento.js";
import { lerPerfil, salvarPerfil } from "./banco/perfil.js";
import { listarContextosDaPasta } from "./regras/consultasDeContextos.js";
import { autorizarDelegacaoDeIa } from "./servicoPoliticas.js";
import { registrarTrechosDeSkill, decidirTrechoDeSkill, listarTrechosDeSkill } from "./banco/skills.js";
import { importarPastaDeSkill } from "./banco/importarPastaDeSkill.js";
import { validarEspecializacao } from "./regras/regrasDasSkills.js";

// controladorAgentes — operações relacionadas
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

// controladorAssistente — operações relacionadas
export const assistenteAgentes: TratadorDoCanal<'assistente:agentes'> = a => { const ia = lerPreferencias().ia; return { agentes: agentesDoChat(a.espacoId), assistente: { nome: ia.nome, estilo: ia.estilo }, provedores: (['claude', 'codex'] as const).map(p => { const l = localizarClienteDeIa(p); return { id: p, encontrado: !!l, atalho: !!l?.shim, disponivel: regrasDosAgentes().iaExterna && !!executavelDaIa(p), autorizado: ia.delegacao[p], desligadaPelaAdministracao: !regrasDosAgentes().iaExterna }; }) }; };

// Avaliar uma resposta. Corrigir o agente ensina só os termos da pergunta ao agente certo (a pergunta não é gravada).
export const assistenteAvaliar: TratadorDoCanal<'assistente:avaliar'> = a => { const r = avaliarAtendimento(a.id, a.avaliacao); const termos = a.avaliacao === 'NAO_UTIL' && a.agenteCorreto && a.pergunta ? aprenderTermos(a.agenteCorreto, a.pergunta).termos : []; return { ...r, termos }; };

export const assistenteConversar: TratadorDoCanal<'assistente:conversar'> = async a => {
  const ia = lerPreferencias().ia;
  const r = await conversar({ espacoId: a.espacoId, pergunta: a.pergunta, agente: a.agente ?? null, provedor: a.provedor ?? 'local', primeira: a.primeira, historico: a.historico, contexto: a.contexto ?? null, estilo: ia.estilo, nome: ia.nome, autorizados: ia.delegacao, executavel: executavelDaIa, executor: executarCliDeIa });
  // A conversa não é gravada; fica só o atendimento (agente, modo e fontes, sem pergunta nem resposta).
  let atendimentoId: number | null = null; try { atendimentoId = registrarAtendimento({ espacoId: a.espacoId, agente: r.agente.id, modo: r.modo, fontes: r.fontes.map(f => f.rotulo) }); } catch { atendimentoId = null; r.aviso = [r.aviso, 'Não foi possível registrar o atendimento; a avaliação desta resposta está indisponível.'].filter(Boolean).join(' '); }
  return { ...r, assistente: ia.nome, atendimentoId };
};

// As conversas com texto gravadas até a 2.9 são de antes do login, sem dono: ficam no disco e não aparecem para ninguém.
export const conversasListar: TratadorDoCanal<'conversas:listar'> = a => { let atend: ReturnType<typeof listarAtendimentos> = []; try { atend = listarAtendimentos(a.espacoId, a.agente, 40); } catch { atend = []; }
  return [...atend.map(x => ({ id: 'atendimento-' + x.id, em: x.em, agente: x.agente, pergunta: '', linhas: [] as string[], fontes: x.fontes.map(f => ({ rotulo: f, aba: '' })), modo: x.modo, estilo: 'amigavel', semTexto: true, avaliacao: x.avaliacao }))]
    .sort((x, y) => y.em.localeCompare(x.em)).slice(0, 40); };

// controladorConhecimento — operações relacionadas
export const conhecimentoApagar: TratadorDoCanal<'conhecimento:apagar'> = async (a, janela) => { const r = await dialog.showMessageBox(janela!, { type: 'warning', buttons: ['Cancelar', 'Apagar'], defaultId: 0, cancelId: 0, title: 'Apagar conhecimento', message: 'Apagar este conhecimento do banco deste computador?', detail: 'Os agentes deixam de usá-lo. O conhecimento inicial do Prumo não pode ser apagado, só descartado.' }); return r.response === 1 ? apagarConhecimento(a.id) : { apagado: false, canceled: true }; };

export const conhecimentoCriar: TratadorDoCanal<'conhecimento:criar'> = a => registrarConhecimento({ espacoId: a.espacoId, agente: a.agente, tipo: a.tipo, titulo: a.titulo, texto: a.texto, origem: 'PESSOA' });

export const conhecimentoDecidir: TratadorDoCanal<'conhecimento:decidir'> = a => decidirConhecimento(a.id, a.estado);

export const conhecimentoEsquecer: TratadorDoCanal<'conhecimento:esquecer'> = a => esquecerTermo(a.agente, a.termo);

export const conhecimentoEstado: TratadorDoCanal<'conhecimento:estado'> = a => estadoConhecimento(a.espacoId);

export const conhecimentoListar: TratadorDoCanal<'conhecimento:listar'> = a => listarConhecimentos({ espacoId: a.espacoId, agente: a.agente ?? null, estados: a.estados, busca: a.busca, somenteDoAgente: a.somenteDoAgente });

export const conhecimentoMostrar: TratadorDoCanal<'conhecimento:mostrar'> = () => { const alvo = caminhoConhecimento(); lerPerfil(); shell.showItemInFolder(alvo); return { arquivo: alvo }; };

export const conhecimentoVocabulario: TratadorDoCanal<'conhecimento:vocabulario'> = a => vocabularioDoAgente(a.agente);

// controladorContextos — operações relacionadas
export const contextosAprovar: TratadorDoCanal<'contextos:aprovar'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Aprovar contexto', `Aprovar "${c.titulo}" (versão ${c.versao})?`, `Você confirma que este conteúdo é uma regra válida, na origem informada: ${c.origem.referencia || '(sem origem)'}.\nA aprovação vale só para este texto exato; qualquer edição volta o contexto a rascunho. Aprovador registrado: ${usuarioDoWindows()}.`, 'Aprovar'))) return { canceled: true };
  return { canceled: false, contexto: await aprovarContextoDaPasta(a.root, a.id, usuarioDoWindows()) };
};

export const contextosConflito: TratadorDoCanal<'contextos:conflito'> = async a => conflitoDeContextoDaPasta(a.root, a.id, usuarioDoWindows(), a.outroId);

export const contextosDesatualizar: TratadorDoCanal<'contextos:desatualizar'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Marcar como desatualizado', `Marcar "${c.titulo}" como desatualizado?`, 'Um contexto desatualizado deixa de valer, não pode mais ser editado nem aprovado e deixa de ser tratado como regra atual. O histórico é preservado.', 'Marcar desatualizado'))) return { canceled: true };
  return { canceled: false, contexto: await desatualizarContextoDaPasta(a.root, a.id, usuarioDoWindows()) };
};

export const contextosExcluir: TratadorDoCanal<'contextos:excluir'> = async (a, janela) => {
  const c = await obterContextoDaPasta(a.root, a.id);
  if (!(await confirmarNoWindows(janela, 'Excluir contexto', `Excluir definitivamente "${c.titulo}"?`, 'O contexto e o seu histórico serão apagados; só ficam o identificador, a data e o hash de que ele existiu. O código e os demais arquivos do projeto não são tocados.', 'Excluir'))) return { canceled: true, deleted: false };
  return { canceled: false, ...(await excluirContextoDaPasta(a.root, a.id)) };
};

export const contextosListar: TratadorDoCanal<'contextos:listar'> = a => listarContextosDaPasta(a.root, a.filter);

export const contextosMcp: TratadorDoCanal<'contextos:mcp'> = async (a, janela) => {
  if (a.habilitar && !(await confirmarNoWindows(janela, 'Disponibilizar ao agente de IA', 'Disponibilizar os contextos deste projeto ao agente de IA conectado?', 'O texto dos contextos (até 4000 caracteres cada, com segredos mascarados) passará a ser retornado pelas ferramentas MCP e poderá ser processado pelo provedor da IA conectada. Contextos adulterados nunca são enviados. Você pode desabilitar a qualquer momento.', 'Disponibilizar'))) return { canceled: true };
  return { canceled: false, ...(await permitirContextosNoMcp(a.root, a.habilitar)) };
};

export const contextosObter: TratadorDoCanal<'contextos:obter'> = a => obterContextoDaPasta(a.root, a.id);

export const contextosSalvar: TratadorDoCanal<'contextos:salvar'> = a => salvarContextoDaPasta(a.root, { id: a.id, substituir: a.substituir, dados: a.dados }, usuarioDoWindows());

// controladorPerfil — operações relacionadas
export const iaDelegacao: TratadorDoCanal<'ia:delegacao'> = async (a, janela) => {
  if (a.valor && !regrasDosAgentes().iaExterna) throw new Error('EXTERNAL_AI_DISABLED: a Administração desligou o uso de Claude Code e Codex nesta instalação.');
  if (a.valor) { const nome = a.provedor === 'claude' ? 'Claude Code' : 'Codex'; const r = await dialog.showMessageBox(janela!, { type: 'question', buttons: ['Cancelar', 'Autorizar ' + nome], defaultId: 0, cancelId: 0, title: 'Autorizar ' + nome + ' no chat', message: 'Permitir que o chat do Prumo envie perguntas ao ' + nome + ' instalado neste computador?', detail: 'Quando você escolher ' + nome + ' no chat, a pergunta, a skill do agente e os fatos locais usados na resposta são enviados ao CLI, que usa a conta e as regras do próprio ' + nome + '. Você pode revogar a qualquer momento.' }); if (r.response !== 1) return { canceled: true, ia: lerPreferencias().ia }; }
  return { canceled: false, ia: autorizarDelegacaoDeIa(a.provedor, a.valor).ia };
};

export const perfilObter: TratadorDoCanal<'perfil:obter'> = () => lerPerfil();

export const perfilSalvar: TratadorDoCanal<'perfil:salvar'> = a => salvarPerfil({
  ...(a.comoChamar !== undefined ? { comoChamar: a.comoChamar } : {}), ...(a.papel !== undefined ? { papel: a.papel } : {}),
  ...(a.experiencia !== undefined ? { experiencia: a.experiencia } : {}), ...(a.foco !== undefined ? { foco: a.foco } : {}), ...(a.compartilharComIa !== undefined ? { compartilharComIa: a.compartilharComIa } : {}) });

// controladorSkills — operações relacionadas
export const skillsCriar: TratadorDoCanal<'skills:criar'> = a => registrarTrechosDeSkill([{ especializacao: a.especializacao, titulo: a.titulo, texto: a.texto, origem: 'PESSOA' }])[0];

export const skillsDecidir: TratadorDoCanal<'skills:decidir'> = a => decidirTrechoDeSkill(a.id, a.estado);

// A pasta vem do diálogo do sistema, nunca do renderer. Nada é baixado: a pessoa escolhe uma pasta já presente no computador.
export const skillsImportar: TratadorDoCanal<'skills:importar'> = async (a, j) => {
  validarEspecializacao(a.especializacao);
  const opcoes = { title: 'Pasta da Skill (com SKILL.md e licença aberta)', properties: ['openDirectory' as const] };
  const r = j ? await dialog.showOpenDialog(j, opcoes) : await dialog.showOpenDialog(opcoes);
  if (r.canceled || !r.filePaths[0]) return { canceled: true };
  return importarPastaDeSkill(r.filePaths[0], a.especializacao, a.fonte ?? null);
};

export const skillsListar: TratadorDoCanal<'skills:listar'> = a => listarTrechosDeSkill({ especializacao: a.especializacao ?? null, estados: a.estados, busca: a.busca });
