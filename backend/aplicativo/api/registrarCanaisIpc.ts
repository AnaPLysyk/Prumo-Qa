/** Liga os canais IPC aos controladores por funcionalidade e mantém validação e autorização por canal. */
import { agendaAutorizar, agendaEstado, agendaExcluir, agendaExecutar, agendaListar, agendaPermissoes, agendaPolitica, agendaRevogar, agendaRevogarPolitica, agendaSalvar } from "../../agendamentos/controladorAgenda.js";
import { workerEstado, workerEventos, workerPausa } from "../../agendamentos/controladorWorker.js";
import { agentesEstado, agentesSalvar, agentesPessoais, agentesPessoalsalvar, agentesPessoalexcluir, agentesPessoaisimportar, agentesOrquestracoes, agentesRastrear, servicosImportar } from "../../agentes/controladorAgentes.js";
import { assistenteAgentes, assistenteAvaliar, assistenteConversar, conversasListar } from "../../agentes/controladorAssistente.js";
import { conhecimentoApagar, conhecimentoCriar, conhecimentoDecidir, conhecimentoEsquecer, conhecimentoEstado, conhecimentoListar, conhecimentoMostrar, conhecimentoVocabulario } from "../../agentes/controladorConhecimento.js";
import { administracaoCodigo, administracaoMapa, plataformaAgentes, plataformaSalvar } from "../../administracao/controlador.js";
import { contaEntrar, contaSessao } from "../../login/controladorSessao.js";
import { contaSair, contaCadastrar, contaRecuperar, contaCodigo, contaConfirmarentrada, contaReenviarentrada, contaDuasetapas, contaSenha, contaPerfil, contaGoogleestado, contaGoogleiniciar, contaGithubestado, contaGithubiniciar } from "../../login/controlador.js";
import { suporteAnexar, suporteEnviar, suporteMeus, suporteMeu, suporteAbrir, suporteChamado, suporteConsultar, suporteExportar, suportePreparar } from "../../suporte/controlador.js";
import { chamadosConfiguracao, chamadosChave, chamadosListar, chamadosDetalhe, chamadosAnexo, chamadosResponder, chamadosEstado } from "../../administracao/controladorChamados.js";
import { usuariosAtivar, usuariosListar, usuariosCriar, usuariosAlterar, usuariosSenha, usuariosDesbloquear, usuariosExcluir } from "../../administracao/controladorUsuarios.js";
import { papeisListar, papeisSalvar, papeisExcluir } from "../../administracao/controladorPapeis.js";
import { acessoConfiguracao, acessoGithub, acessoGoogle, acessoSalvar } from "../../administracao/controladorAcesso.js";
import { skillsCriar, skillsDecidir, skillsImportar, skillsListar } from "../../agentes/controladorSkills.js";
import { iaDelegacao, perfilObter, perfilSalvar } from "../../agentes/controladorPerfil.js";
import { ajudaDocumentos, ajudaIntegracoes, ajudaVersoes, dadosExcluir, dadosResumo, siteAbrir } from "../../ajuda/controlador.js";
import { appInfo } from "../controlador.js";
import { registrarCanal } from "./registrarCanal.js";
import { atualizacaoAbrir, atualizacaoInstalar, atualizacaoVerificar, preferenciasVisualizada } from "../../atualizacoes/controlador.js";
import { interfaceExportar } from "../../compartilhado/controlador.js";
import { conexaoAplicar, conexaoTestar, escritaEstado, escritaHabilitar, operacoesExecutar, operacoesListar, projetoConexoes } from "../../conexoes/controladorConexoes.js";
import { servicosAceite, servicosAdicionar, servicosQaseprevia, servicosQasepreviaconta, servicosQaseimportar, servicosQasecancelar, servicosConferir, servicosConsultar, servicosDesvincular, servicosListar, servicosRecursos, servicosRemover, servicosValidar, servicosVincular } from "../../conexoes/controladorServicos.js";
import { preferenciasObter, preferenciasSalvar } from "../../configuracoes/controlador.js";
import { contextosAprovar, contextosConflito, contextosDesatualizar, contextosExcluir, contextosListar, contextosMcp, contextosObter, contextosSalvar } from "../../agentes/controladorContextos.js";
import { projetoEvidencias, execucoesListar, vinculosMapa } from "../../testes/controlador.js";
import { jiraPrevia, jiraPublicar } from "../../testes/controladorJira.js";
import { projetoHistorico, diagnosticoListar, logsExportar, projetoLogs } from "../../logs/controlador.js";
import { assistenteAbertura } from "../../inicio/controlador.js";
import { execucoesMetricas } from "../../metricas/controlador.js";
import { espacosAssociar, espacosAutomacoes, espacosCriar, espacosEditar, espacosListar, espacosObter, espacosPasta, espacosTrazer, projetosDemo, projetosDesvincular, projetosEscolher, projetosListar, projetoVisao } from "../../projetos/controlador.js";
import { runsBugs, runsCriar, runsExecutar, runsListar, runsPolitica, runsPreparar, runsPublicar, runsResultado, runsRevogar } from "../../testes/controladorExecucoes.js";
import { testesArquivo, testesGravar, testesPipelines, testesCatalogo } from "../../testes/controladorArquivos.js";
import { repositorioListar, repositorioCaso, repositorioSuite } from "../../testes/controladorRepositorio.js";
import { propostasCriar, propostasDescartar, propostasVincular, propostasEditar, propostasListar, propostasPublicar, propostasRevisar } from "../../tickets/controlador.js";

export function registrarCanaisIpc(): void {
  // Janela, navegação e dados básicos
  registrarCanal('app:info', appInfo);
  registrarCanal('interface:exportar', interfaceExportar);
  registrarCanal('projetos:listar', projetosListar);
  registrarCanal('projetos:escolher', projetosEscolher);
  registrarCanal('projetos:demo', projetosDemo);
  registrarCanal('projetos:desvincular', projetosDesvincular);
  registrarCanal('projeto:visao', projetoVisao);
  registrarCanal('projeto:logs', projetoLogs);
  registrarCanal('projeto:historico', projetoHistorico);
  registrarCanal('projeto:evidencias', projetoEvidencias);
  registrarCanal('projeto:conexoes', projetoConexoes);
  registrarCanal('suporte:consultar', suporteConsultar);
  registrarCanal('suporte:chamado', suporteChamado);
  registrarCanal('conexao:testar', conexaoTestar);
  registrarCanal('ajuda:documentos', ajudaDocumentos);
  registrarCanal('ajuda:versoes', ajudaVersoes);
  registrarCanal('ajuda:integracoes', ajudaIntegracoes);
  registrarCanal('diagnostico:listar', diagnosticoListar);
  registrarCanal('dados:resumo', dadosResumo);
  registrarCanal('conexao:aplicar', conexaoAplicar);
  registrarCanal('logs:exportar', logsExportar);
  registrarCanal('dados:excluir', dadosExcluir);
  registrarCanal('atualizacao:verificar', atualizacaoVerificar);
  registrarCanal('preferencias:obter', preferenciasObter);
  registrarCanal('preferencias:salvar', preferenciasSalvar);
  registrarCanal('preferencias:visualizada', preferenciasVisualizada);
  registrarCanal('site:abrir', siteAbrir);
  registrarCanal('atualizacao:abrir', atualizacaoAbrir);
  registrarCanal('atualizacao:instalar', atualizacaoInstalar);
  registrarCanal('suporte:preparar', suportePreparar);
  registrarCanal('suporte:abrir', suporteAbrir);
  registrarCanal('suporte:exportar', suporteExportar);
  // Projetos e espaços de trabalho
  registrarCanal('espacos:listar', espacosListar);
  registrarCanal('espacos:criar', espacosCriar);
  registrarCanal('espacos:obter', espacosObter);
  registrarCanal('espacos:editar', espacosEditar);
  registrarCanal('espacos:pasta', espacosPasta);
  registrarCanal('espacos:trazer', espacosTrazer);
  registrarCanal('espacos:automacoes', espacosAutomacoes);
  registrarCanal('espacos:associar', espacosAssociar);
  // Conexões com serviços externos
  registrarCanal('servicos:listar', servicosListar);
  registrarCanal('servicos:adicionar', servicosAdicionar);
  registrarCanal('servicos:qaseprevia', servicosQaseprevia);
  registrarCanal('servicos:qasepreviaconta', servicosQasepreviaconta);
  registrarCanal('servicos:qaseimportar', servicosQaseimportar);
  registrarCanal('servicos:qasecancelar', servicosQasecancelar);
  registrarCanal('servicos:validar', servicosValidar);
  registrarCanal('servicos:remover', servicosRemover);
  registrarCanal('servicos:recursos', servicosRecursos);
  registrarCanal('servicos:vincular', servicosVincular);
  registrarCanal('servicos:desvincular', servicosDesvincular);
  registrarCanal('servicos:conferir', servicosConferir);
  registrarCanal('servicos:consultar', servicosConsultar);
  registrarCanal('servicos:aceite', servicosAceite);
  registrarCanal('servicos:importar', servicosImportar);
  // Contextos liberados para agentes
  registrarCanal('contextos:listar', contextosListar);
  registrarCanal('contextos:obter', contextosObter);
  registrarCanal('contextos:salvar', contextosSalvar);
  registrarCanal('contextos:aprovar', contextosAprovar);
  registrarCanal('contextos:desatualizar', contextosDesatualizar);
  registrarCanal('contextos:conflito', contextosConflito);
  registrarCanal('contextos:excluir', contextosExcluir);
  registrarCanal('contextos:mcp', contextosMcp);
  // Operações externas com aprovação
  registrarCanal('operacoes:listar', operacoesListar);
  registrarCanal('escrita:estado', escritaEstado);
  registrarCanal('escrita:habilitar', escritaHabilitar);
  registrarCanal('operacoes:executar', operacoesExecutar);
  // Casos e suítes locais
  registrarCanal('repositorio:listar', repositorioListar);
  registrarCanal('repositorio:caso', repositorioCaso);
  registrarCanal('repositorio:suite', repositorioSuite);
  // Propostas de casos e defeitos
  registrarCanal('propostas:listar', propostasListar);
  registrarCanal('propostas:criar', propostasCriar);
  registrarCanal('propostas:editar', propostasEditar);
  registrarCanal('propostas:revisar', propostasRevisar);
  registrarCanal('propostas:descartar', propostasDescartar);
  registrarCanal('propostas:vincular', propostasVincular);
  registrarCanal('propostas:publicar', propostasPublicar);
  // Execuções e publicações de testes
  registrarCanal('runs:listar', runsListar);
  registrarCanal('runs:preparar', runsPreparar);
  registrarCanal('runs:criar', runsCriar);
  registrarCanal('runs:executar', runsExecutar);
  registrarCanal('runs:resultado', runsResultado);
  registrarCanal('runs:publicar', runsPublicar);
  registrarCanal('runs:bugs', runsBugs);
  registrarCanal('runs:politica', runsPolitica);
  registrarCanal('runs:revogar', runsRevogar);
  // Vínculos e arquivos de automação
  registrarCanal('vinculos:mapa', vinculosMapa);
  registrarCanal('testes:arquivo', testesArquivo);
  registrarCanal('testes:gravar', testesGravar);
  registrarCanal('testes:pipelines', testesPipelines);
  registrarCanal('testes:catalogo', testesCatalogo);
  // Assistente e conversas
  registrarCanal('assistente:conversar', assistenteConversar);
  registrarCanal('assistente:abertura', assistenteAbertura);
  registrarCanal('assistente:avaliar', assistenteAvaliar);
  registrarCanal('assistente:agentes', assistenteAgentes);
  registrarCanal('conversas:listar', conversasListar);
  // Conhecimento dos agentes
  registrarCanal('conhecimento:estado', conhecimentoEstado);
  registrarCanal('conhecimento:listar', conhecimentoListar);
  registrarCanal('conhecimento:criar', conhecimentoCriar);
  registrarCanal('conhecimento:decidir', conhecimentoDecidir);
  registrarCanal('conhecimento:apagar', conhecimentoApagar);
  registrarCanal('conhecimento:vocabulario', conhecimentoVocabulario);
  registrarCanal('conhecimento:esquecer', conhecimentoEsquecer);
  registrarCanal('conhecimento:mostrar', conhecimentoMostrar);
  registrarCanal('administracao:mapa', administracaoMapa);
  // Entrada, sessão e cadastro
  registrarCanal('conta:sessao', contaSessao);
  registrarCanal('conta:entrar', contaEntrar);
  registrarCanal('conta:sair', contaSair);
  registrarCanal('conta:cadastrar', contaCadastrar);
  registrarCanal('conta:recuperar', contaRecuperar);
  registrarCanal('conta:codigo', contaCodigo);
  registrarCanal('agentes:pessoais', agentesPessoais);
  registrarCanal('agentes:pessoalsalvar', agentesPessoalsalvar);
  registrarCanal('agentes:pessoalexcluir', agentesPessoalexcluir);
  registrarCanal('agentes:pessoaisimportar', agentesPessoaisimportar);
  // Verificação em duas etapas e agentes pessoais
  registrarCanal('conta:confirmarentrada', contaConfirmarentrada);
  registrarCanal('conta:reenviarentrada', contaReenviarentrada);
  registrarCanal('conta:duasetapas', contaDuasetapas);
  // Chamados de suporte
  registrarCanal('suporte:anexar', suporteAnexar);
  registrarCanal('suporte:enviar', suporteEnviar);
  registrarCanal('suporte:meus', suporteMeus);
  registrarCanal('suporte:meu', suporteMeu);
  // Administração dos chamados
  registrarCanal('chamados:configuracao', chamadosConfiguracao);
  registrarCanal('chamados:chave', chamadosChave);
  registrarCanal('chamados:listar', chamadosListar);
  registrarCanal('chamados:detalhe', chamadosDetalhe);
  registrarCanal('chamados:anexo', chamadosAnexo);
  registrarCanal('chamados:responder', chamadosResponder);
  registrarCanal('chamados:estado', chamadosEstado);
  registrarCanal('conta:senha', contaSenha);
  registrarCanal('conta:perfil', contaPerfil);
  // Usuários e papéis
  registrarCanal('usuarios:ativar', usuariosAtivar);
  registrarCanal('usuarios:listar', usuariosListar);
  registrarCanal('usuarios:criar', usuariosCriar);
  registrarCanal('usuarios:alterar', usuariosAlterar);
  registrarCanal('usuarios:senha', usuariosSenha);
  registrarCanal('usuarios:desbloquear', usuariosDesbloquear);
  registrarCanal('usuarios:excluir', usuariosExcluir);
  registrarCanal('papeis:listar', papeisListar);
  registrarCanal('papeis:salvar', papeisSalvar);
  registrarCanal('papeis:excluir', papeisExcluir);
  // Acesso e provedores OAuth
  registrarCanal('acesso:configuracao', acessoConfiguracao);
  registrarCanal('acesso:salvar', acessoSalvar);
  registrarCanal('acesso:github', acessoGithub);
  registrarCanal('acesso:google', acessoGoogle);
  registrarCanal('conta:googleiniciar', contaGoogleiniciar);
  registrarCanal('conta:googleestado', contaGoogleestado);
  registrarCanal('conta:githubiniciar', contaGithubiniciar);
  registrarCanal('conta:githubestado', contaGithubestado);
  // Configurações dos agentes da plataforma
  registrarCanal('plataforma:agentes', plataformaAgentes);
  registrarCanal('plataforma:salvar', plataformaSalvar);
  registrarCanal('administracao:codigo', administracaoCodigo);
  // Orquestração e habilidades
  registrarCanal('agentes:orquestracoes', agentesOrquestracoes);
  registrarCanal('agentes:rastrear', agentesRastrear);
  registrarCanal('skills:listar', skillsListar);
  registrarCanal('skills:criar', skillsCriar);
  registrarCanal('skills:decidir', skillsDecidir);
  registrarCanal('skills:importar', skillsImportar);
  registrarCanal('perfil:obter', perfilObter);
  registrarCanal('perfil:salvar', perfilSalvar);
  registrarCanal('ia:delegacao', iaDelegacao);
  registrarCanal('agentes:estado', agentesEstado);
  registrarCanal('agentes:salvar', agentesSalvar);
  // Worker e execução em segundo plano
  registrarCanal('worker:eventos', workerEventos);
  registrarCanal('worker:estado', workerEstado);
  registrarCanal('worker:pausa', workerPausa);
  // Agendamentos
  registrarCanal('agenda:listar', agendaListar);
  registrarCanal('agenda:salvar', agendaSalvar);
  registrarCanal('agenda:estado', agendaEstado);
  registrarCanal('agenda:excluir', agendaExcluir);
  registrarCanal('agenda:executar', agendaExecutar);
  registrarCanal('agenda:autorizar', agendaAutorizar);
  registrarCanal('agenda:revogar', agendaRevogar);
  registrarCanal('agenda:permissoes', agendaPermissoes);
  registrarCanal('agenda:politica', agendaPolitica);
  registrarCanal('agenda:revogarpolitica', agendaRevogarPolitica);
  // Histórico de execuções e métricas
  registrarCanal('execucoes:listar', execucoesListar);
  registrarCanal('execucoes:metricas', execucoesMetricas);
  // Publicações no Jira
  registrarCanal('jira:previa', jiraPrevia);
  registrarCanal('jira:publicar', jiraPublicar);
}
