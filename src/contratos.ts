import { z } from 'zod';
import { filtroSchema } from './painel.js';

/**
 * Fonte única dos contratos técnicos: o que a janela (IPC) e os agentes de IA (MCP) podem pedir ao Prumo.
 * - Os esquemas IPC abaixo são os MESMOS usados por src/desktop/main.ts para validar cada chamada.
 * - O catálogo descreve cada operação para a Ajuda › Integrações técnicas; testes comparam o catálogo com
 *   main.ts, preload.cjs e o servidor MCP real, então documentação e código não divergem em silêncio.
 * É puro Node (sem Electron). Não existe API HTTP: só IPC local e MCP por stdio.
 */
const raiz = z.string().min(1).max(1000);
const soRaiz = z.object({ root: raiz }).strict();
const vazio = z.object({}).strict();
export const esquemasIpc = {
  'app:info': vazio,
  'projetos:listar': vazio,
  'projetos:escolher': vazio,
  'projetos:demo': vazio,
  'projetos:desvincular': soRaiz,
  'projeto:visao': soRaiz,
  'projeto:logs': z.object({ root: raiz, filter: filtroSchema.optional() }).strict(),
  'projeto:historico': z.object({ root: raiz, filter: filtroSchema.optional() }).strict(),
  'projeto:evidencias': z.object({ root: raiz, jobId: z.string().uuid().optional() }).strict(),
  'projeto:conexoes': soRaiz,
  'conexao:aplicar': z.object({ root: raiz, client: z.literal('codex') }).strict(),
  'logs:exportar': soRaiz,
  'ajuda:documentos': vazio,
  'ajuda:versoes': vazio,
  'ajuda:integracoes': vazio,
  'atualizacao:verificar': vazio,
  'atualizacao:abrir': vazio,
  'dados:resumo': vazio,
  'dados:excluir': z.discriminatedUnion('escopo', [
    z.object({ escopo: z.literal('historico'), root: raiz }).strict(),
    z.object({ escopo: z.literal('evidencias'), root: raiz }).strict(),
    z.object({ escopo: z.literal('diagnostico') }).strict()]),
  'diagnostico:listar': vazio
} as const;
export type CanalIpc = keyof typeof esquemasIpc;

export type Operacao = {
  tipo: 'IPC' | 'MCP'; nome: string; campos: string[]; finalidade: string; origem: string; destino: string; entrada: string; saida: string;
  permissoes: string; efeito: string; arquivos: string; erros: string[]; protecoes: string[]; registro: string;
};
/** Nomes dos argumentos aceitos, derivados do esquema real. */
export function camposDe(schema: z.ZodTypeAny): string[] {
  if (schema instanceof z.ZodDiscriminatedUnion) return [...new Set([...(schema.options as z.ZodObject<z.ZodRawShape>[])].flatMap(o => Object.keys(o.shape)))].sort();
  return Object.keys((schema as z.ZodObject<z.ZodRawShape>).shape).sort();
}

type Descricao = Omit<Operacao, 'tipo' | 'nome' | 'campos'>;
const consulta = 'Consulta local; não altera o projeto.';
const vinculado = 'Projeto previamente vinculado (vinculos.json).';
const ipcErros = ['INVALID_ARGUMENTS', 'IPC_SENDER_REJECTED'];
const ipcProtecoes = ['Remetente deve ser a página do aplicativo', 'Argumentos validados por esquema estrito', 'Resposta {ok,data|error} sem stack trace', 'Erros mascarados'];
const ipc: Record<CanalIpc, Descricao> = {
  'app:info': { finalidade: 'Informar versão, pasta de dados e se o app está empacotado.', origem: 'Interface > cabeçalho', destino: 'main.ts > atividades.diretorioDados', entrada: 'Nenhuma', saida: 'version, dataDir, platform, packaged', permissoes: 'Nenhuma', efeito: consulta, arquivos: 'Nenhum', erros: ipcErros, protecoes: ipcProtecoes, registro: 'Diagnóstico IPC (somente erros)' },
  'projetos:listar': { finalidade: 'Listar projetos vinculados com a situação do contrato.', origem: 'Interface > Projetos', destino: 'painel.ts > vinculos.ts > projeto.ts', entrada: 'Nenhuma', saida: 'Lista de situações (INTEGRADO, SEM_MANIFESTO, MANIFESTO_INVALIDO, PASTA_AUSENTE)', permissoes: 'Nenhuma', efeito: consulta, arquivos: 'vinculos.json; qa.project.json de cada projeto vinculado', erros: [...ipcErros, 'LINKS_INVALID'], protecoes: [...ipcProtecoes, 'Contrato validado pelo mesmo carregarProjeto do MCP/CLI'], registro: 'Diagnóstico IPC (somente erros)' },
  'projetos:escolher': { finalidade: 'Abrir o seletor nativo de pasta e vincular o projeto se o contrato for válido.', origem: 'Interface > Projetos > Vincular pasta', destino: 'main.ts (diálogo nativo) > vinculos.ts', entrada: 'Nenhuma: a pasta vem do diálogo nativo, nunca da página', saida: 'canceled, linked, situation', permissoes: 'Escolha explícita da pessoa no diálogo', efeito: 'Grava vinculos.json somente se o contrato for válido; nunca escreve na pasta do projeto.', arquivos: 'qa.project.json do projeto escolhido; vinculos.json', erros: ipcErros, protecoes: [...ipcProtecoes, 'A página não informa caminhos'], registro: 'Diagnóstico IPC' },
  'projetos:demo': { finalidade: 'Copiar o projeto de demonstração para uma pasta gravável e vinculá-lo.', origem: 'Interface > Projetos > Adicionar projeto de demonstração', destino: 'main.ts > vinculos.copiarDemonstracao', entrada: 'Nenhuma', saida: 'linked, situation', permissoes: 'Ação explícita da pessoa', efeito: 'Copia a demonstração (sem .prumo) para %LOCALAPPDATA%\\PrumoQA\\demonstracao, sem sobrescrever; grava vinculos.json.', arquivos: 'resources/demo; vinculos.json', erros: ipcErros, protecoes: ipcProtecoes, registro: 'Diagnóstico IPC' },
  'projetos:desvincular': { finalidade: 'Remover o vínculo de um projeto da lista.', origem: 'Interface > Projetos > Desvincular', destino: 'painel.ts > vinculos.removerVinculo', entrada: 'Raiz do projeto', saida: 'removed', permissoes: vinculado, efeito: 'Altera só vinculos.json. Histórico, evidências e arquivos do projeto permanecem.', arquivos: 'vinculos.json', erros: ipcErros, protecoes: ipcProtecoes, registro: 'Diagnóstico IPC' },
  'projeto:visao': { finalidade: 'Métricas do projeto calculadas do histórico real.', origem: 'Interface > Métricas e cabeçalho', destino: 'painel.ts > atividades.consultarAtividades/calcularMetricas', entrada: 'Projeto selecionado', saida: 'project, metrics, directory, lastMcpClient', permissoes: vinculado, efeito: consulta, arquivos: 'qa.project.json; arquivos .jsonl do histórico do projeto', erros: [...ipcErros, 'PROJECT_NOT_LINKED'], protecoes: [...ipcProtecoes, 'Só raízes vinculadas', 'Não registra evento de qualidade'], registro: 'Diagnóstico IPC (somente erros; consulta frequente)' },
  'projeto:logs': { finalidade: 'Eventos de início e término das operações, com filtros.', origem: 'Interface > Logs', destino: 'painel.ts > atividades.ts', entrada: 'Projeto selecionado + filtros (ferramenta, estado, período, limite)', saida: 'Eventos de atividade, problemas e indicador de histórico completo', permissoes: vinculado, efeito: consulta, arquivos: 'Arquivos .jsonl do histórico do projeto', erros: [...ipcErros, 'PROJECT_NOT_LINKED'], protecoes: [...ipcProtecoes, 'Registros inválidos são excluídos e sinalizados', 'Não gera evento de qualidade (sem recursão)'], registro: 'Diagnóstico IPC (somente erros; consulta frequente)' },
  'projeto:historico': { finalidade: 'Operações consolidadas com achados e recomendações padronizadas.', origem: 'Interface > Histórico', destino: 'painel.ts > atividades.ts', entrada: 'Projeto selecionado + filtros', saida: 'Operações com estado final, achados e referência de evidência', permissoes: vinculado, efeito: consulta, arquivos: 'Arquivos .jsonl do histórico do projeto', erros: [...ipcErros, 'PROJECT_NOT_LINKED'], protecoes: [...ipcProtecoes, 'Recomendação não é alteração aplicada'], registro: 'Diagnóstico IPC (somente erros; consulta frequente)' },
  'projeto:evidencias': { finalidade: 'Resultados e logs de execuções reais, preservando PASS, FAIL, BLOCKED e NOT_RUN.', origem: 'Interface > Evidências', destino: 'painel.ts > evidencias.consultarEvidencias', entrada: 'Projeto selecionado + jobId opcional (UUID)', saida: 'Evidências com cenários, saída mascarada e caminho', permissoes: vinculado, efeito: consulta, arquivos: '<projeto>/.prumo/evidencias/*.json', erros: [...ipcErros, 'PROJECT_NOT_LINKED', 'EVIDENCE_TAMPERED', 'PROJECT_MISMATCH'], protecoes: [...ipcProtecoes, 'Integridade por hash', 'Saída mascarada e limitada'], registro: 'Diagnóstico IPC' },
  'projeto:conexoes': { finalidade: 'Propor a configuração MCP para Codex e Claude Code.', origem: 'Interface > Conexões', destino: 'painel.ts > conexoes.prepararConexao', entrada: 'Projeto selecionado', saida: 'Comando, destino e configuração proposta por cliente', permissoes: vinculado, efeito: 'Nenhuma alteração: só propõe.', arquivos: 'Procura codex/claude no PATH; não lê a configuração dos clientes', erros: [...ipcErros, 'PROJECT_NOT_LINKED'], protecoes: ipcProtecoes, registro: 'Diagnóstico IPC' },
  'conexao:aplicar': { finalidade: 'Adicionar o servidor MCP à configuração do Codex.', origem: 'Interface > Conexões > Adicionar ao Codex', destino: 'main.ts (confirmação nativa) > conexoes.aplicarConexao', entrada: 'Projeto selecionado + cliente (somente codex)', saida: 'configured, reason', permissoes: vinculado + ' Confirmação nativa que a página não consegue simular.', efeito: 'Executa "codex mcp add" sem shell, sem sobrescrever configuração existente.', arquivos: 'Configuração do Codex (via CLI do próprio cliente)', erros: [...ipcErros, 'CONNECTION_INSPECTION_FAILED', 'CONNECTION_WRITE_FAILED'], protecoes: [...ipcProtecoes, 'Diálogo nativo com destino e comando', 'Não sobrescreve'], registro: 'Diagnóstico IPC' },
  'logs:exportar': { finalidade: 'Exportar o histórico bruto do projeto para um arquivo escolhido pela pessoa.', origem: 'Interface > Logs > Exportar', destino: 'main.ts (diálogos nativos) > painel.exportarLogs', entrada: 'Projeto selecionado', saida: 'exported, path', permissoes: vinculado + ' Destino escolhido no diálogo.', efeito: 'Grava um JSON no destino escolhido. Nenhum upload.', arquivos: 'Histórico do projeto; arquivo de destino', erros: [...ipcErros, 'PROJECT_NOT_LINKED'], protecoes: [...ipcProtecoes, 'Aviso sobre metadados antes de gravar', 'Somente campos do esquema'], registro: 'Diagnóstico IPC' },
  'ajuda:documentos': { finalidade: 'Documentos da Central de ajuda.', origem: 'Interface > Ajuda', destino: 'painel.ajuda', entrada: 'Nenhuma', saida: 'Documentos em texto', permissoes: 'Nenhuma', efeito: consulta, arquivos: 'app/ajuda/*.md (empacotados)', erros: ipcErros, protecoes: [...ipcProtecoes, 'Lista fixa de arquivos'], registro: 'Diagnóstico IPC (somente erros)' },
  'ajuda:versoes': { finalidade: 'Histórico de versões e versão instalada.', origem: 'Interface > Ajuda > Versões', destino: 'main.ts > versoes.ts', entrada: 'Nenhuma', saida: 'Versões com funcionalidades, correções, segurança e limitações', permissoes: 'Nenhuma', efeito: consulta, arquivos: 'app/versoes.json (empacotado)', erros: ipcErros, protecoes: [...ipcProtecoes, 'Fonte validada por esquema'], registro: 'Diagnóstico IPC (somente erros)' },
  'ajuda:integracoes': { finalidade: 'Catálogo técnico das operações IPC e das ferramentas MCP.', origem: 'Interface > Ajuda > Integrações técnicas', destino: 'main.ts > contratos.catalogo', entrada: 'Nenhuma', saida: 'Lista de operações', permissoes: 'Nenhuma', efeito: consulta, arquivos: 'Nenhum', erros: ipcErros, protecoes: ipcProtecoes, registro: 'Diagnóstico IPC (somente erros)' },
  'atualizacao:verificar': { finalidade: 'Consultar a release oficial mais recente (somente quando a pessoa clica).', origem: 'Interface > Ajuda > Atualizações', destino: 'main.ts > atualizacao.verificarAtualizacao', entrada: 'Nenhuma: nada do usuário é enviado', saida: 'status, versão instalada, versão mais recente, notas e página oficial', permissoes: 'Ação explícita da pessoa', efeito: 'Uma requisição HTTPS GET ao GitHub; não baixa nem instala nada.', arquivos: 'Nenhum', erros: [...ipcErros, 'INDISPONIVEL', 'RESPOSTA_INVALIDA'], protecoes: [...ipcProtecoes, 'Destino fixo (api.github.com)', 'Timeout', 'Sem corpo, sem cookies, sem redirecionamento', 'Resposta validada'], registro: 'Diagnóstico IPC' },
  'atualizacao:abrir': { finalidade: 'Abrir no navegador a página oficial da release encontrada.', origem: 'Interface > Ajuda > Atualizações > Abrir página oficial', destino: 'main.ts > shell.openExternal', entrada: 'Nenhuma: a URL é a validada pelo processo principal', saida: 'opened', permissoes: 'Confirmação nativa', efeito: 'Abre o navegador padrão na página da release; não baixa nem executa instalador.', arquivos: 'Nenhum', erros: [...ipcErros, 'NO_VERIFIED_RELEASE'], protecoes: [...ipcProtecoes, 'URL reconstruída a partir de tag validada', 'Somente github.com/AnaPLysyk/Prumo-Qa'], registro: 'Diagnóstico IPC' },
  'dados:resumo': { finalidade: 'Mostrar onde ficam os dados locais e quanto espaço ocupam.', origem: 'Interface > Ajuda > Privacidade e dados', destino: 'main.ts > dados.resumirDados', entrada: 'Nenhuma', saida: 'Pasta, projetos vinculados, bytes por categoria, política de retenção', permissoes: 'Nenhuma', efeito: consulta, arquivos: '%LOCALAPPDATA%\\PrumoQA (somente tamanhos)', erros: ipcErros, protecoes: [...ipcProtecoes, 'Não segue links simbólicos'], registro: 'Diagnóstico IPC' },
  'dados:excluir': { finalidade: 'Excluir histórico operacional, evidências de um projeto ou diagnósticos do aplicativo.', origem: 'Interface > Ajuda > Privacidade e dados', destino: 'main.ts (confirmação nativa) > atividades/evidencias/diagnostico', entrada: 'escopo (historico, evidencias ou diagnostico) + projeto quando aplicável', saida: 'deleted, failed', permissoes: vinculado + ' Confirmação nativa destrutiva.', efeito: 'Apaga somente arquivos do escopo, validados por nome, tipo e caminho canônico. Nunca apaga código-fonte; não é exposto ao MCP.', arquivos: 'Histórico do projeto; <projeto>/.prumo/evidencias; diagnóstico do app', erros: [...ipcErros, 'PROJECT_NOT_LINKED', 'HISTORY_SYMLINK'], protecoes: [...ipcProtecoes, 'Confirmação nativa', 'Recusa links e arquivos fora do padrão', 'Falhas parciais informadas, nunca ocultadas'], registro: 'Diagnóstico IPC' },
  'diagnostico:listar': { finalidade: 'Listar o diagnóstico técnico das chamadas da interface.', origem: 'Interface > Logs > Diagnóstico da interface', destino: 'main.ts > diagnostico.lerDiagnostico', entrada: 'Nenhuma', saida: 'Eventos (canal, estado, duração, código)', permissoes: 'Nenhuma', efeito: consulta, arquivos: '%LOCALAPPDATA%\\PrumoQA\\diagnostico', erros: ipcErros, protecoes: [...ipcProtecoes, 'Somente metadados, sem argumentos'], registro: 'Não se registra (evita recursão)' }
};
/** Canais de consulta frequente: só erros vão ao diagnóstico, para não encher o arquivo nem gerar recursão. */
export const canaisFrequentes: ReadonlySet<string> = new Set(['app:info', 'projetos:listar', 'projeto:visao', 'projeto:logs', 'projeto:historico', 'diagnostico:listar', 'ajuda:documentos', 'ajuda:versoes', 'ajuda:integracoes', 'dados:resumo']);

const mcpProtecoes = ['Projeto fixado na configuração do servidor, nunca pela ferramenta', 'Leitura limitada à raiz autorizada', 'Registro de início e término'];
const mcp: { nome: string; campos: string[]; d: Descricao }[] = [
  { nome: 'contexto_projeto', campos: [], d: { finalidade: 'Identificar tipo, tecnologias, testes, comandos e o que falta no contexto autorizado.', origem: 'Agente de IA por MCP (stdio)', destino: 'mcp.ts > projeto.contextoProjeto', entrada: 'Nenhuma', saida: 'Contexto NOT_VERIFIED com fontes, hashes e informações ausentes', permissoes: 'Servidor iniciado pelo cliente para um projeto', efeito: 'Somente leitura.', arquivos: 'Arquivos listados no contexto do qa.project.json', erros: ['ROOT_REQUIRED', 'INVALID_MANIFEST', 'PATH_FORBIDDEN', 'SECRET_FORBIDDEN', 'CONTEXT_LIMIT'], protecoes: [...mcpProtecoes, 'Arquivos tratados como dados, não instruções', 'Segredos mascarados'], registro: 'Histórico de atividades (origem MCP)' } },
  { nome: 'revisar_cobertura', campos: ['candidates', 'contradictions', 'existingTests', 'requirement', 'source', 'sourcePath'], d: { finalidade: 'Análise estrutural de rastreabilidade, oráculos, lacunas e redundâncias candidatas.', origem: 'Agente de IA por MCP (stdio)', destino: 'mcp.ts > qualidade.revisarCobertura', entrada: 'Requisito, origem, testes existentes, cenários candidatos, contradições', saida: 'Revisão sempre NOT_VERIFIED com fatos, hipóteses, lacunas e achados', permissoes: 'Servidor iniciado pelo cliente para um projeto', efeito: 'Somente leitura; não afirma que executou algo.', arquivos: 'Documentação e testes autorizados citados na entrada', erros: ['INVALID_ARGUMENTS'], protecoes: [...mcpProtecoes, 'Esquema estrito', 'Texto livre não vai ao histórico'], registro: 'Histórico de atividades (origem MCP)' } },
  { nome: 'executar_validacao', campos: ['capability', 'solicitarAprovacao'], d: { finalidade: 'Executar uma capacidade declarada no contrato, após autenticação humana.', origem: 'Agente de IA por MCP (stdio)', destino: 'mcp.ts > execucao.executarValidacao > aprovacao.ts', entrada: 'Nome da capacidade e pedido de autenticação', saida: 'Resultado PASS, FAIL, BLOCKED ou NOT_RUN com evidência', permissoes: 'Capacidade do contrato + autenticação humana nativa do Windows', efeito: 'Pode executar processo local autorizado e gravar evidência. Sem aprovação retorna BLOCKED.', arquivos: 'Comando declarado; <projeto>/.prumo/evidencias', erros: ['CAPABILITY_NOT_ALLOWED', 'HUMAN_APPROVAL_REQUIRED', 'POLICY_BLOCKED', 'PRECONDITION_MISSING', 'TIMEOUT', 'OUTPUT_LIMIT', 'RUNTIME_MISSING'], protecoes: [...mcpProtecoes, 'Sem shell nem comandos vindos do prompt', 'Ambiente por lista de permissão', 'Timeout e limite de saída', 'approved:true da IA não existe'], registro: 'Histórico de atividades (origem MCP) e evidência' } },
  { nome: 'consultar_evidencias', campos: ['criterio', 'jobId'], d: { finalidade: 'Consultar resultados, logs e artefatos reais preservando o estado de cada um.', origem: 'Agente de IA por MCP (stdio)', destino: 'mcp.ts > evidencias.consultarEvidencias', entrada: 'jobId e critério opcionais', saida: 'Evidências ou NOT_RUN', permissoes: 'Servidor iniciado pelo cliente para um projeto', efeito: 'Somente leitura.', arquivos: '<projeto>/.prumo/evidencias/*.json', erros: ['INVALID_JOB', 'EVIDENCE_TAMPERED', 'PROJECT_MISMATCH'], protecoes: [...mcpProtecoes, 'Integridade por hash', 'Isolamento por projeto'], registro: 'Histórico de atividades (origem MCP)' } }
];

export function catalogo(): Operacao[] {
  return [
    ...(Object.keys(esquemasIpc) as CanalIpc[]).map(c => ({ tipo: 'IPC' as const, nome: 'prumo:' + c, campos: camposDe(esquemasIpc[c]), ...ipc[c] })),
    ...mcp.map(m => ({ tipo: 'MCP' as const, nome: m.nome, campos: m.campos, ...m.d }))
  ];
}
