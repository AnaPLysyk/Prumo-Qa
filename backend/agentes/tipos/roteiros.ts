/** Os roteiros (prompts MCP) do Prumo e suas regras comuns. */
import { valorOuPadrao } from '../mcp/valorOuPadrao.js';

/**
 * Prompts do Prumo: roteiros reutilizáveis que o cliente MCP mostra como comandos (por exemplo /prumo:investigar-falha)
 * e que o CLI imprime com `prumo prompts <nome>`. Prompt não executa nada: só organiza o pedido e aponta as ferramentas.
 * As permissões continuam no servidor (políticas por capacidade); a pessoa continua decidindo o que publicar e aprovar.
 */
type Argumento = { nome: string; descricao: string; obrigatorio: boolean };

type DefPrompt = { nome: string; titulo: string; descricao: string; agente: string; argumentos: Argumento[]; passos: (a: Record<string, string | undefined>) => string[] };

export const sempre = [
  'Comece por `listar_politicas` e `contexto_projeto` (que traz contextos e aprendizados aprovados, se a pessoa permitiu).',
  'Separe fato (com fonte), hipótese e lacuna. Sem evidência, o estado é NOT_RUN; nunca declare PASS sem execução real.',
  'Tudo o que você criar é rascunho (`propor_caso`, `propor_bug`, `propor_aprendizado`): publicar e aprovar é decisão da pessoa, na janela do Prumo.'
];

export const promptsPrumo: DefPrompt[] = [
  { nome: 'auditar-codigo', titulo: 'Auditar arquitetura e qualidade do código', descricao: 'Roteiro MCP de auditoria do código por especialidades, com revisão independente e sem alterações automáticas.', agente: 'investigacao-bugs',
    argumentos: [{ nome: 'area', descricao: 'Pasta ou módulo autorizado para revisão (opcional)', obrigatorio: false }],
    passos: (a) => [
      `Área solicitada: ${valorOuPadrao(a.area, 'todo o projeto autorizado')}.`,
      'Reúna Investigação de Bugs, QA Geral e Regressão em etapas separadas: identificação, revisão crítica independente e avaliação do risco de mudança. Os nomes representam papéis de análise; não afirme que subagentes foram executados se o cliente não os invocou.',
      'Verifique, por evidências e referências de arquivos, importações, duplicações reais, código sem uso, segurança, autenticação, responsabilidades de frontend/backend, testes e dependências de build. Não mova arquivos apenas por nome ou tamanho.',
      'Separe scripts de desenvolvimento (build, empacotamento, CI, release) de funcionalidades executadas no aplicativo. Preserve arquivos e contratos usados no build, instaladores e deploy.',
      'Não execute comandos, não edite, não faça commit nem publique pelo prompt MCP. Entregue achados, risco, evidência, proposta mínima e verificações necessárias; classifique o que não foi verificado como NOT_RUN.'
    ] },
  { nome: 'conversar-com-prumo', titulo: 'Conversar com o Prumo', descricao: 'Abre uma conversa de QA com a personalidade do Prumo, ajustada ao seu papel.', agente: 'orquestrador',
    argumentos: [{ nome: 'papel', descricao: 'Seu papel: qa, dev, po ou analista (opcional)', obrigatorio: false }],
    passos: (a) => [`Converse como colega de qualidade. Papel informado: ${valorOuPadrao(a.papel, 'não informado (pergunte, uma vez)')}.`, 'Se não souber como chamar a pessoa (aprendizados.perfil.comoChamar vazio), pergunte uma vez, sem insistir.', 'Ofereça no máximo três próximos passos concretos, ligados aos dados do projeto.'] },
  { nome: 'revisar-estrategia', titulo: 'Revisar a estratégia de teste', descricao: 'Entrevista guiada (uma pergunta por vez) sobre estratégia, ferramentas, arquitetura de teste, IA e CI.', agente: 'qa-geral',
    argumentos: [{ nome: 'foco', descricao: 'Parte do produto ou do plano a revisar (opcional)', obrigatorio: false }],
    passos: (a) => [`Foco: ${valorOuPadrao(a.foco, 'o projeto inteiro')}.`, 'Siga backend/agentes/skills/qa/references/estrategia.md: uma pergunta por vez, sempre com a sua recomendação e o porquê; não pergunte o que já está documentado.', 'Termine com um registro de decisões: resolvido, adiado (com impacto) e aberto.'] },
  { nome: 'analisar-requisito', titulo: 'Analisar um requisito', descricao: 'Torna um requisito testável: critérios, ambiguidades, lacunas, técnicas e casos em rascunho.', agente: 'requisitos',
    argumentos: [{ nome: 'requisito', descricao: 'Texto ou chave do requisito/história', obrigatorio: true }, { nome: 'origem', descricao: 'De onde veio (ticket, documento, contexto)', obrigatorio: false }],
    passos: (a) => [`Requisito: ${valorOuPadrao(a.requisito, '(não informado)')}. Origem: ${valorOuPadrao(a.origem, 'não informada')}.`, 'Use `revisar_cobertura` com o requisito, a origem e os testes existentes; cite id, versão e hash dos contextos usados.', 'Liste ambiguidades como perguntas para quem decide. Escolha técnicas (partição, limites, decisão, estado) pela forma do requisito.', 'Proponha poucos casos com `propor_caso` (requisito e risco preenchidos), sem duplicar os existentes.'] },
  { nome: 'sessao-exploratoria', titulo: 'Planejar uma sessão exploratória', descricao: 'Monta o charter, as ideias de teste (SFDIPOT) e o roteiro de anotações de uma sessão.', agente: 'qa-geral',
    argumentos: [{ nome: 'area', descricao: 'Área ou jornada a explorar', obrigatorio: true }, { nome: 'tempo', descricao: 'Duração da sessão (padrão 60 minutos)', obrigatorio: false }],
    passos: (a) => [`Área: ${valorOuPadrao(a.area, '(não informada)')}. Duração: ${valorOuPadrao(a.tempo, '60 minutos')}.`, 'Escreva o charter: explorar <área> com <recursos> para descobrir <risco>. Use SFDIPOT para listar ideias e priorize por risco.', 'Entregue um roteiro de anotações (testado, encontrado, dúvidas, fora do escopo). Bugs encontrados viram `propor_bug`.'] },
  { nome: 'investigar-falha', titulo: 'Investigar uma falha', descricao: 'Lê a evidência real, separa defeito, erro de automação e ambiente, e propõe o bug em rascunho.', agente: 'investigacao-bugs',
    argumentos: [{ nome: 'jobId', descricao: 'UUID da execução (opcional)', obrigatorio: false }, { nome: 'ticket', descricao: 'Ticket relacionado (opcional)', obrigatorio: false }],
    passos: (a) => [`Execução: ${valorOuPadrao(a.jobId, 'a mais recente')}. Ticket: ${valorOuPadrao(a.ticket, 'não informado')}.`, 'Use `consultar_evidencias` e leia estado, cenários e saída mascarada. BLOCKED é impedimento, não defeito.', 'Classifique como hipótese (automação, ambiente, produto ou inconclusiva) e diga como confirmar reproduzindo.', 'Só com defeito confirmado use `propor_bug` (passos, esperado com fonte, observado, evidência).'] },
  { nome: 'planejar-regressao', titulo: 'Planejar a regressão', descricao: 'Escolhe o que rodar (smoke, impacto, completa) a partir das mudanças e das execuções reais.', agente: 'regressao',
    argumentos: [{ nome: 'mudanca', descricao: 'O que mudou (branch, ticket, área)', obrigatorio: false }],
    passos: (a) => [`Mudança: ${valorOuPadrao(a.mudanca, 'não informada (pergunte)')}.`, 'Use `consultar_evidencias` para o histórico e `contexto_projeto` para as capabilities declaradas.', 'Proponha: smoke das jornadas críticas, testes das áreas afetadas e quando rodar a completa. Executar exige `executar_validacao` com aprovação humana nativa.'] },
  { nome: 'explicar-teste', titulo: 'Explicar um teste', descricao: 'Explica o que um teste automatizado verifica, o oráculo, a fragilidade e o caso do Qase ligado.', agente: 'playwright',
    argumentos: [{ nome: 'arquivo', descricao: 'Caminho relativo do arquivo de teste', obrigatorio: true }, { nome: 'teste', descricao: 'Título do teste (opcional)', obrigatorio: false }],
    passos: (a) => [`Arquivo: ${valorOuPadrao(a.arquivo, '(não informado)')}. Teste: ${valorOuPadrao(a.teste, 'todos do arquivo')}.`, 'Leia o arquivo antes de explicar. Diga o comportamento verificado, o oráculo (assertion), dados e pré-condições.', 'Aponte fragilidades (seletor por estrutura, espera por tempo, dependência de ordem) e o que falta cobrir. Não altere o teste sem pedido.'] }
];
