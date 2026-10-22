/** Tela e nível que cada canal da janela exige quando o login está ligado; canal novo sem classificação não compila. */
import type { CanalIpc } from '../../aplicativo/api/catalogoDeContratos.js';
import type { IdModulo } from './contas.js';

/**
 * - publico: atende sem sessão (tela de entrada, cadastro, recuperação, versão, tema e o site oficial).
 * - conta: exige sessão, mesmo com troca de senha pendente (sair e trocar a senha).
 * - base: exige sessão; dado transversal que várias telas consultam (lista de projetos, worker, assistente, ajuda).
 * - [tela, nível]: exige o nível na tela do papel da pessoa (VER para consultar, USAR para alterar).
 */
type AcessoDoCanal = 'publico' | 'conta' | 'base' | readonly [IdModulo, 'VER' | 'USAR'];

export const acessoDosCanais: Record<CanalIpc, AcessoDoCanal> = {
  'conta:sessao': 'publico', 'conta:entrar': 'publico', 'conta:cadastrar': 'publico', 'conta:recuperar': 'publico', 'conta:codigo': 'publico', 'conta:confirmarentrada': 'publico', 'conta:reenviarentrada': 'publico', 'conta:githubiniciar': 'publico', 'conta:githubestado': 'publico', 'conta:googleiniciar': 'publico', 'conta:googleestado': 'publico',
  'app:info': 'publico', 'preferencias:obter': 'publico', 'site:abrir': 'publico',
  'conta:sair': 'conta', 'conta:senha': 'conta', 'conta:perfil': 'base', 'conta:imagemlink': 'base', 'conta:duasetapas': 'base',
  'usuarios:ativar': ['administracao', 'USAR'], 'usuarios:listar': ['administracao', 'VER'], 'usuarios:criar': ['administracao', 'USAR'], 'usuarios:alterar': ['administracao', 'USAR'],
  'usuarios:senha': ['administracao', 'USAR'], 'usuarios:desbloquear': ['administracao', 'USAR'], 'usuarios:excluir': ['administracao', 'USAR'],
  'papeis:listar': ['administracao', 'VER'], 'papeis:salvar': ['administracao', 'USAR'], 'papeis:excluir': ['administracao', 'USAR'],
  'acesso:configuracao': ['administracao', 'VER'], 'acesso:salvar': ['administracao', 'USAR'], 'acesso:github': ['administracao', 'USAR'], 'acesso:google': ['administracao', 'USAR'],
  'plataforma:agentes': ['administracao', 'VER'], 'plataforma:salvar': ['administracao', 'USAR'],
  'administracao:mapa': ['administracao', 'VER'], 'administracao:codigo': ['administracao', 'VER'], 'atualizacao:instalar': ['administracao', 'USAR'], 'dados:excluir': ['administracao', 'USAR'],
  'agentes:salvar': ['administracao', 'USAR'], 'skills:decidir': ['administracao', 'USAR'], 'skills:importar': ['administracao', 'USAR'],
  'interface:exportar': 'base', 'espacos:listar': 'base', 'espacos:obter': 'base', 'projetos:listar': 'base', 'projeto:visao': 'base', 'projeto:historico': 'base',
  'projeto:conexoes': 'base', 'servicos:listar': 'base', 'servicos:consultar': 'base', 'servicos:aceite': 'base', 'operacoes:listar': 'base',
  'escrita:estado': 'base', 'agentes:estado': 'base', 'execucoes:listar': 'base', 'execucoes:metricas': 'base', 'worker:estado': 'base', 'worker:eventos': 'base',
  'assistente:conversar': 'base', 'assistente:agentes': 'base', 'assistente:abertura': 'base', 'assistente:avaliar': 'base',
  'perfil:obter': 'base', 'perfil:salvar': 'base', 'preferencias:salvar': 'base', 'preferencias:visualizada': 'base', 'ajuda:documentos': 'base', 'ajuda:versoes': 'base',
  'ajuda:integracoes': 'base', 'dados:resumo': 'base', 'voz:estado': 'base', 'voz:preparar': 'base', 'voz:transcrever': 'base', 'atualizacao:verificar': 'base', 'atualizacao:abrir': 'base',
  'projetos:recursos': ['projetos', 'VER'], 'projetos:importar': ['projetos', 'USAR'], 'projetos:vincular': ['projetos', 'USAR'],
  'projetos:escolher': ['projetos', 'USAR'], 'projetos:demo': ['projetos', 'USAR'], 'projetos:desvincular': ['projetos', 'USAR'], 'espacos:criar': ['projetos', 'USAR'], 'espacos:editar': ['projetos', 'USAR'], 'espacos:manual': ['projetos', 'USAR'],
  'espacos:pasta': ['projetos', 'USAR'], 'espacos:trazer': ['projetos', 'USAR'], 'servicos:desvincular': ['projetos', 'USAR'], 'servicos:alternar': ['projetos', 'USAR'], 'servicos:conferir': ['projetos', 'VER'],
  'contextos:listar': ['agentes', 'VER'], 'agentes:pessoais': ['agentes', 'VER'], 'agentes:pessoalconsultar': ['agentes', 'VER'], 'agentes:preferenciassalvar': ['agentes', 'USAR'], 'agentes:pessoalsalvar': ['agentes', 'USAR'], 'agentes:pessoalexcluir': ['agentes', 'USAR'], 'agentes:pessoaisimportar': ['agentes', 'USAR'], 'contextos:obter': ['agentes', 'VER'], 'contextos:salvar': ['agentes', 'USAR'], 'contextos:aprovar': ['agentes', 'USAR'], 'contextos:desatualizar': ['agentes', 'USAR'],
  'contextos:conflito': ['agentes', 'USAR'], 'contextos:excluir': ['agentes', 'USAR'], 'contextos:mcp': ['agentes', 'USAR'], 'servicos:importar': ['agentes', 'USAR'],
  'repositorio:listar': ['testes', 'VER'], 'repositorio:importar': ['testes', 'USAR'], 'repositorio:caso': ['testes', 'USAR'], 'repositorio:suite': ['testes', 'USAR'],
  'ide:criarprojeto': ['projetos', 'USAR'], 'ide:repositorio': ['projetos', 'USAR'], 'ide:publicacao': ['testes', 'VER'], 'ide:publicar': ['testes', 'USAR'], 'ide:comandoexecutar': ['testes', 'USAR'], 'ide:comandosaida': ['testes', 'USAR'], 'ide:comandoparar': ['testes', 'USAR'],
  'ide:arvore': ['testes', 'VER'], 'ide:arquivo': ['testes', 'VER'], 'ide:gravar': ['testes', 'USAR'], 'ide:buscar': ['testes', 'VER'], 'ide:gitestado': ['testes', 'VER'], 'ide:gitdiff': ['testes', 'VER'],
  'espacos:automacoes': ['testes', 'VER'], 'testes:catalogo': ['testes', 'VER'], 'testes:arquivo': ['testes', 'VER'], 'testes:gravar': ['testes', 'USAR'], 'testes:pipelines': ['testes', 'VER'], 'propostas:listar': ['testes', 'VER'], 'runs:listar': ['testes', 'VER'],
  'propostas:criar': ['testes', 'USAR'], 'propostas:editar': ['testes', 'USAR'], 'propostas:revisar': ['testes', 'USAR'], 'propostas:descartar': ['testes', 'USAR'], 'propostas:vincular': ['testes', 'USAR'], 'propostas:publicar': ['testes', 'USAR'],
  'runs:preparar': ['testes', 'USAR'], 'runs:editar': ['testes', 'USAR'], 'runs:apagar': ['testes', 'USAR'], 'runs:criar': ['testes', 'USAR'], 'runs:executar': ['testes', 'USAR'], 'runs:andamento': ['testes', 'VER'], 'runs:resultado': ['testes', 'USAR'], 'runs:evidencias': ['testes', 'VER'], 'runs:evidenciar': ['testes', 'USAR'], 'runs:publicar': ['testes', 'USAR'], 'runs:bugs': ['testes', 'USAR'],
  'runs:politica': ['testes', 'USAR'], 'runs:revogar': ['testes', 'USAR'], 'operacoes:executar': ['testes', 'USAR'],
  'agenda:listar': ['agenda', 'VER'], 'agenda:permissoes': ['agenda', 'VER'], 'agenda:salvar': ['agenda', 'USAR'], 'agenda:estado': ['agenda', 'USAR'], 'agenda:excluir': ['agenda', 'USAR'], 'agenda:executar': ['agenda', 'USAR'],
  'agenda:autorizar': ['agenda', 'USAR'], 'agenda:revogar': ['agenda', 'USAR'], 'agenda:politica': ['agenda', 'USAR'], 'agenda:revogarpolitica': ['agenda', 'USAR'], 'worker:pausa': ['agenda', 'USAR'],
  'jira:previa': ['testes', 'VER'], 'jira:publicar': ['testes', 'USAR'], 'projeto:evidencias': ['testes', 'VER'],
  'vinculos:mapa': ['testes', 'VER'], 'espacos:associar': ['testes', 'USAR'],
  'projeto:logs': ['logs', 'VER'], 'diagnostico:listar': ['logs', 'VER'], 'logs:exportar': ['logs', 'USAR'],
  'servicos:recursos': ['conexoes', 'VER'], 'servicos:qaseprevia': ['conexoes', 'USAR'], 'servicos:qasepreviaconta': ['conexoes', 'USAR'], 'servicos:qaseimportar': ['conexoes', 'USAR'], 'servicos:qasecancelar': ['conexoes', 'USAR'], 'servicos:qaseconectar': ['conexoes', 'USAR'], 'servicos:jiradescobrir': ['conexoes', 'USAR'], 'servicos:adicionar': ['conexoes', 'USAR'], 'servicos:githubiniciar': ['conexoes', 'USAR'], 'servicos:autorizar': ['conexoes', 'USAR'], 'servicos:autorizacaodisponivel': ['conexoes', 'VER'], 'servicos:autorizacaoestado': ['conexoes', 'USAR'], 'servicos:autorizacaoescolher': ['conexoes', 'USAR'], 'servicos:githubestado': ['conexoes', 'USAR'], 'servicos:abrircadastro': ['conexoes', 'USAR'], 'servicos:validar': ['conexoes', 'USAR'], 'servicos:remover': ['conexoes', 'USAR'], 'servicos:trocartoken': ['conexoes', 'USAR'], 'servicos:vincular': ['conexoes', 'USAR'],
  'escrita:habilitar': ['conexoes', 'USAR'], 'conexao:aplicar': ['conexoes', 'USAR'], 'conexao:testar': ['conexoes', 'USAR'],
  'conversas:listar': ['agentes', 'VER'], 'conhecimento:estado': ['agentes', 'VER'], 'conhecimento:listar': ['agentes', 'VER'], 'conhecimento:vocabulario': ['agentes', 'VER'], 'conhecimento:mostrar': ['agentes', 'VER'],
  'agentes:orquestracoes': ['agentes', 'VER'], 'agentes:rastrear': ['agentes', 'VER'], 'skills:listar': ['agentes', 'VER'],
  'conhecimento:criar': ['agentes', 'USAR'], 'conhecimento:decidir': ['agentes', 'USAR'], 'conhecimento:apagar': ['agentes', 'USAR'], 'conhecimento:esquecer': ['agentes', 'USAR'],
  'skills:criar': ['agentes', 'USAR'], 'ia:delegacao': ['agentes', 'USAR'],
  'suporte:consultar': ['suporte', 'VER'], 'suporte:anexar': ['suporte', 'USAR'], 'suporte:enviar': ['suporte', 'USAR'], 'suporte:meus': ['suporte', 'VER'], 'suporte:meu': ['suporte', 'VER'],
  'chamados:configuracao': ['administracao', 'VER'], 'chamados:chave': ['administracao', 'USAR'], 'chamados:listar': ['administracao', 'VER'], 'chamados:detalhe': ['administracao', 'VER'], 'chamados:anexo': ['administracao', 'VER'], 'chamados:responder': ['administracao', 'USAR'], 'chamados:estado': ['administracao', 'USAR'], 'suporte:chamado': ['suporte', 'VER'], 'suporte:preparar': ['suporte', 'USAR'], 'suporte:abrir': ['suporte', 'USAR'], 'suporte:exportar': ['suporte', 'USAR']
};
