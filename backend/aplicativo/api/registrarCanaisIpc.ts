/** Registra os canais IPC do aplicativo e mantém contrato e autorização por canal. */
import { ideCriarprojeto, ideRepositorio, idePublicacao, idePublicar, ideComandoexecutar, ideComandosaida, ideComandoparar } from '../../projetos/controladorCodigo.js';
import { agendaAutorizar, agendaEstado, agendaExcluir, agendaExecutar, agendaListar, agendaPermissoes, agendaPolitica, agendaRevogar, agendaRevogarPolitica, agendaSalvar, workerEstado, workerEventos, workerPausa } from "../../agendamentos/controlador.js";
import { agentesEstado, agentesSalvar, agentesPessoais, agentesPessoalconsultar, agentesPreferenciassalvar, agentesPessoalsalvar, agentesPessoalexcluir, agentesPessoaisimportar, agentesOrquestracoes, agentesRastrear, servicosImportar, assistenteAgentes, assistenteAvaliar, assistenteConversar, conversasListar, conhecimentoApagar, conhecimentoCriar, conhecimentoDecidir, conhecimentoEsquecer, conhecimentoEstado, conhecimentoListar, conhecimentoMostrar, conhecimentoVocabulario, skillsCriar, skillsDecidir, skillsImportar, skillsListar, iaDelegacao, perfilObter, perfilSalvar, contextosAprovar, contextosConflito, contextosDesatualizar, contextosExcluir, contextosListar, contextosMcp, contextosObter, contextosSalvar } from "../../agentes/controlador.js";
import { administracaoCodigo, administracaoMapa, plataformaAgentes, plataformaSalvar, chamadosConfiguracao, chamadosChave, chamadosListar, chamadosDetalhe, chamadosAnexo, chamadosResponder, chamadosEstado, usuariosAtivar, usuariosListar, usuariosCriar, usuariosAlterar, usuariosSenha, usuariosDesbloquear, usuariosExcluir, papeisListar, papeisSalvar, papeisExcluir, acessoConfiguracao, acessoGithub, acessoGoogle, acessoSalvar } from "../../administracao/controlador.js";
import { contaSair, contaCadastrar, contaRecuperar, contaCodigo, contaConfirmarentrada, contaReenviarentrada, contaDuasetapas, contaSenha, contaPerfil, contaImagemlink, contaGoogleestado, contaGoogleiniciar, contaGithubestado, contaGithubiniciar } from "../../login/controlador.js";
import { contaEntrar, contaSessao } from "../../login/controladorSessao.js";
import { suporteAnexar, suporteEnviar, suporteMeus, suporteMeu, suporteAbrir, suporteChamado, suporteConsultar, suporteExportar, suportePreparar } from "../../suporte/controlador.js";
import { ajudaDocumentos, ajudaIntegracoes, ajudaVersoes, dadosExcluir, dadosResumo, siteAbrir } from "../../ajuda/controlador.js";
import { appInfo } from "../controlador.js";
import { registrarCanal } from "./registrarCanal.js";
import { atualizacaoAbrir, atualizacaoInstalar, atualizacaoVerificar, preferenciasVisualizada } from "../../atualizacoes/controlador.js";
import { interfaceExportar } from "../../compartilhado/controlador.js";
import { conexaoAplicar, conexaoTestar, escritaEstado, escritaHabilitar, operacoesExecutar, operacoesListar, projetoConexoes, servicosAceite, servicosAdicionar, servicosQaseprevia, servicosQasepreviaconta, servicosQaseimportar, servicosQasecancelar, servicosQaseconectar, servicosJiradescobrir, servicosConferir, servicosConsultar, servicosDesvincular, servicosAlternar, servicosListar, servicosGithubiniciar, servicosGithubestado, servicosAbrirCadastro, servicosAutorizar, servicosAutorizacaoestado, servicosAutorizacaoescolher, servicosAutorizacaodisponivel, servicosRecursos, servicosRemover, servicosTrocartoken, servicosValidar, servicosVincular } from "../../conexoes/controlador.js";
import { preferenciasObter, preferenciasSalvar } from "../../configuracoes/controlador.js";
import { projetoEvidencias, execucoesListar, vinculosMapa, jiraPrevia, jiraPublicar, runsApagar, runsBugs, runsCriar, runsEditar, runsExecutar, runsListar, runsPolitica, runsPreparar, runsPublicar, runsResultado, runsAndamento, runsEvidencias, runsEvidenciar, runsRevogar, testesArquivo, testesGravar, testesPipelines, testesCatalogo, repositorioImportar, repositorioListar, repositorioCaso, repositorioSuite } from "../../testes/controlador.js";
import { projetoHistorico, diagnosticoListar, logsExportar, projetoLogs } from "../../logs/controlador.js";
import { assistenteAbertura } from "../../inicio/controlador.js";
import { vozEstado, vozPreparar, vozTranscrever } from "../../voz/controlador.js";
import { execucoesMetricas } from "../../metricas/controlador.js";
import { projetosRecursos, projetosVincular, projetosImportar, espacosAssociar, espacosAutomacoes, espacosCriar, espacosEditar, espacosManual, espacosListar, espacosObter, espacosPasta, espacosTrazer, projetosDemo, projetosDesvincular, projetosEscolher, projetosListar, projetoVisao } from "../../projetos/controlador.js";
import { propostasCriar, propostasDescartar, propostasVincular, propostasEditar, propostasListar, propostasPublicar, propostasRevisar } from "../../tickets/controlador.js";

import { ideArvore, ideArquivo, ideGravar, ideBuscar, ideGitEstado, ideGitDiff } from "../../projetos/controlador.js";

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
  registrarCanal('voz:estado', vozEstado);
  registrarCanal('voz:preparar', vozPreparar);
  registrarCanal('voz:transcrever', vozTranscrever);
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
  registrarCanal('projetos:recursos', projetosRecursos);
  registrarCanal('projetos:vincular', projetosVincular);
  registrarCanal('projetos:importar', projetosImportar);
  registrarCanal('espacos:criar', espacosCriar);
  registrarCanal('espacos:obter', espacosObter);
  registrarCanal('espacos:editar', espacosEditar);
  registrarCanal('espacos:manual', espacosManual);
  registrarCanal('espacos:pasta', espacosPasta);
  registrarCanal('espacos:trazer', espacosTrazer);
  registrarCanal('espacos:automacoes', espacosAutomacoes);
  registrarCanal('espacos:associar', espacosAssociar);
  // Conexões com serviços externos
  registrarCanal('servicos:listar', servicosListar);
  registrarCanal('servicos:adicionar', servicosAdicionar);
  registrarCanal('servicos:githubiniciar', servicosGithubiniciar);
  registrarCanal('servicos:githubestado', servicosGithubestado);
  registrarCanal('servicos:abrircadastro', servicosAbrirCadastro);
  registrarCanal('servicos:autorizar', servicosAutorizar);
  registrarCanal('servicos:autorizacaodisponivel', servicosAutorizacaodisponivel);
  registrarCanal('servicos:autorizacaoestado', servicosAutorizacaoestado);
  registrarCanal('servicos:autorizacaoescolher', servicosAutorizacaoescolher);
  registrarCanal('servicos:qaseprevia', servicosQaseprevia);
  registrarCanal('servicos:qasepreviaconta', servicosQasepreviaconta);
  registrarCanal('servicos:qaseimportar', servicosQaseimportar);
  registrarCanal('servicos:qasecancelar', servicosQasecancelar);
  registrarCanal('servicos:qaseconectar', servicosQaseconectar);
  registrarCanal('servicos:jiradescobrir', servicosJiradescobrir);
  registrarCanal('servicos:validar', servicosValidar);
  registrarCanal('servicos:remover', servicosRemover);
  registrarCanal('servicos:trocartoken', servicosTrocartoken);
  registrarCanal('servicos:recursos', servicosRecursos);
  registrarCanal('servicos:vincular', servicosVincular);
  registrarCanal('servicos:desvincular', servicosDesvincular);
  registrarCanal('servicos:alternar', servicosAlternar);
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
  registrarCanal('repositorio:importar', repositorioImportar);
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
  registrarCanal('runs:editar', runsEditar);
  registrarCanal('runs:apagar', runsApagar);
  registrarCanal('runs:criar', runsCriar);
  registrarCanal('runs:executar', runsExecutar);
  registrarCanal('runs:resultado', runsResultado);
  registrarCanal('runs:andamento', runsAndamento);
  registrarCanal('runs:evidencias', runsEvidencias);
  registrarCanal('runs:evidenciar', runsEvidenciar);
  registrarCanal('runs:publicar', runsPublicar);
  registrarCanal('runs:bugs', runsBugs);
  registrarCanal('runs:politica', runsPolitica);
  registrarCanal('runs:revogar', runsRevogar);
  // Vínculos e arquivos de automação
  registrarCanal('vinculos:mapa', vinculosMapa);
  registrarCanal('ide:criarprojeto', ideCriarprojeto);
  registrarCanal('ide:repositorio', ideRepositorio);
  registrarCanal('ide:publicacao', idePublicacao);
  registrarCanal('ide:publicar', idePublicar);
  registrarCanal('ide:comandoexecutar', ideComandoexecutar);
  registrarCanal('ide:comandosaida', ideComandosaida);
  registrarCanal('ide:comandoparar', ideComandoparar);
  registrarCanal('ide:arvore', ideArvore);
  registrarCanal('ide:arquivo', ideArquivo);
  registrarCanal('ide:gravar', ideGravar);
  registrarCanal('ide:buscar', ideBuscar);
  registrarCanal('ide:gitestado', ideGitEstado);
  registrarCanal('ide:gitdiff', ideGitDiff);
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
registrarCanal('agentes:pessoalconsultar', agentesPessoalconsultar);
registrarCanal('agentes:preferenciassalvar', agentesPreferenciassalvar);
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
  registrarCanal('conta:imagemlink', contaImagemlink);
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
