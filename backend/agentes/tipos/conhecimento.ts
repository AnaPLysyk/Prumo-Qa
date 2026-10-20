/** Contratos do conhecimento e das Skills — arquivos relacionados agrupados para manutenção. */
import { Experiencia, Papel, agentesChat } from "./persona.js";

// ── conhecimento ──
/**
 * Banco de conhecimento dos agentes: um arquivo SQLite por conta (`conhecimento.db` na pasta de dados
 * da conta), legível em qualquer gerenciador SQLite (por exemplo o Beekeeper Studio). Usa o SQLite embutido no Node/Electron,
 * sem dependência nativa.
 *
 * O que fica aqui é o que os agentes sabem, não o que foi conversado:
 * - perfil: como a pessoa quer ser chamada e o papel dela (QA, dev, PO, analista);
 * - conhecimentos: fatos, glossário, preferências, procedimentos e riscos, por agente (ou de todos) e por projeto (ou gerais),
 *   com estado RASCUNHO/APROVADO/DESCARTADO. Só APROVADO é usado nas respostas. O que a pessoa escreve no Cérebro nasce
 *   APROVADO; o que vem de conversa ou de IA nasce RASCUNHO e depende de uma ação da pessoa;
 * - vocabulario: termos que a pessoa ensinou ao corrigir o agente que respondeu (sem guardar a pergunta);
 * - atendimentos: metadados de cada resposta (agente, modo, fontes, avaliação), sem pergunta nem resposta.
 * Cada agente tem uma view `agente_<id>` com o que ele enxerga. A tabela `agentes` espelha a personalidade definida no código.
 * Textos passam pela mesma máscara de segredos do restante do Prumo. Conteúdo é dado, nunca instrução.
 */
export const tiposConhecimento = ['fato', 'glossario', 'preferencia', 'procedimento', 'risco'] as const;

export type TipoConhecimento = (typeof tiposConhecimento)[number];

export const estadosConhecimento = ['RASCUNHO', 'APROVADO', 'DESCARTADO'] as const;

export type EstadoConhecimento = (typeof estadosConhecimento)[number];

export type OrigemConhecimento = 'PRUMO' | 'PESSOA' | 'CONVERSA' | 'IA';

export type Conhecimento = { id: string; agente: string | null; espacoId: string | null; tipo: TipoConhecimento; titulo: string; texto: string; origem: OrigemConhecimento; estado: EstadoConhecimento; criadoEm: string; decididoEm: string | null; cliente: string | null };

/** O que o Prumo sabe da pessoa: como chamar, papel, experiência e foco. `compartilharComIa` autoriza enviar experiência, foco e papel de acesso à IA externa (Claude Code/Codex). */
export type Perfil = { comoChamar: string | null; papel: Papel | null; experiencia: Experiencia | null; foco: string | null; compartilharComIa: boolean; atualizadoEm: string | null };

export const limitesConhecimento = { titulo: 120, texto: 2000, itens: 5000, iaPorHora: 20, vocabulario: 3000, atendimentos: 5000, porConsulta: 200 } as const;

export const VERSAO_ESQUEMA = 1;

export const idsAgentes = new Set(agentesChat.map((a) => a.id));

export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const nomeValido = /^[\p{L}][\p{L} '.-]{0,29}$/u;

/** Conhecimento inicial do Prumo (origem PRUMO). Redação própria; a pessoa pode descartar qualquer item. */
export const SEMENTE: { id: string; agente: string | null; tipo: TipoConhecimento; titulo: string; texto: string }[] = [
  { id: 'prumo:charter', agente: 'qa-geral', tipo: 'procedimento', titulo: 'Sessão exploratória (charter)', texto: 'Escreva a missão como: explorar <área> com <recursos ou dados> para descobrir <risco ou informação>. Limite a sessão (60 a 90 minutos), anote o que testou, o que encontrou (bugs, dúvidas, riscos) e o que ficou de fora. No fim, converse com alguém: o que aprendemos e qual é a próxima sessão.' },
  { id: 'prumo:sfdipot', agente: 'qa-geral', tipo: 'procedimento', titulo: 'Heurística SFDIPOT para ideias de teste', texto: 'Do Heuristic Test Strategy Model (James Bach): Estrutura (do que o produto é feito), Função (o que faz), Dados (o que processa), Interfaces (com quem conversa), Plataforma (de que depende), Operações (como é usado de verdade) e Tempo (concorrência, prazos, fuso). Passe por cada letra e anote ideias de teste e perguntas.' },
  { id: 'prumo:risco', agente: 'qa-geral', tipo: 'procedimento', titulo: 'Priorização por risco', texto: 'Para cada área, estime a probabilidade de falhar (mudança recente, complexidade, histórico de bugs) e o impacto se falhar (dinheiro, dados, reputação, bloqueio de uso). Teste primeiro o que é alto nos dois; registre o que ficou de fora e por quê, para a decisão ser consciente.' },
  { id: 'prumo:piramide', agente: 'qa-geral', tipo: 'fato', titulo: 'Pirâmide de testes', texto: 'Muitos testes rápidos de unidade, alguns de integração e API e poucos de ponta a ponta. Pirâmide invertida (muito E2E) deixa a suíte lenta e instável; use o E2E nas jornadas críticas.' },
  { id: 'prumo:manual', agente: 'qa-geral', tipo: 'fato', titulo: 'Teste manual também ensina', texto: 'Registre o resultado de cada caso manual (PASS, FAIL, BLOCKED) com a evidência. O que se repete em toda rodada é candidato a automação; o que exige julgamento continua manual ou exploratório.' },
  { id: 'prumo:aceite', agente: 'requisitos', tipo: 'procedimento', titulo: 'Critério de aceite testável', texto: 'Um bom critério diz a condição, a ação e o resultado observável (Dado, Quando, Então). Desconfie de "rápido", "amigável" e "correto": peça número, exemplo ou regra. Cada ambiguidade vira pergunta para quem decide, não suposição.' },
  { id: 'prumo:tecnicas', agente: 'requisitos', tipo: 'fato', titulo: 'Técnicas de projeto de teste', texto: 'Partição de equivalência, valores-limite (os dois lados de cada limite), tabela de decisão (combinações de condições) e transição de estado (inclusive transições inválidas). Escolha pela forma do requisito, não por hábito.' },
  { id: 'prumo:seletores', agente: 'playwright', tipo: 'procedimento', titulo: 'Seletores e esperas estáveis', texto: 'Prefira getByRole, getByLabel e getByText com nome acessível; evite CSS e XPath presos à estrutura. Espere por condição (toBeVisible, toHaveURL), nunca por tempo fixo. Cada teste prepara os próprios dados e não depende da ordem.' },
  { id: 'prumo:mobile', agente: 'playwright', tipo: 'fato', titulo: 'Testes mobile', texto: 'Para web no celular, use projetos com dispositivos do Playwright (viewport, toque, user agent). Para app nativo o Playwright não serve: use Appium, Maestro, Espresso ou XCUITest. O Prumo lê esses testes; executar depende da capability declarada no projeto.' },
  { id: 'prumo:api', agente: 'api-rest', tipo: 'procedimento', titulo: 'Checklist de teste de API', texto: 'Status e corpo conforme o contrato; erros previstos (400, 401, 403, 404, 409, 422); autorização por perfil; idempotência de PUT e DELETE; efeito persistido (releia o recurso); limites de tamanho e paginação; nenhum segredo na resposta.' },
  { id: 'prumo:a11y', agente: 'acessibilidade', tipo: 'procedimento', titulo: 'Verificação rápida de acessibilidade', texto: 'Use só o teclado (Tab, Shift+Tab, Enter, Esc) e confira o foco visível; zoom de 200% sem perder conteúdo; nome acessível em botões e campos; contraste de texto; mensagens de erro anunciadas. Ferramentas automáticas acham só parte das barreiras.' },
  { id: 'prumo:relato', agente: 'investigacao-bugs', tipo: 'procedimento', titulo: 'Relato de bug que se resolve', texto: 'Título com o sintoma e onde ocorre; passos mínimos de reprodução; resultado esperado (com a fonte da regra) e observado; ambiente, dados e versão; evidência (log, captura, vídeo); frequência. Separe fato de hipótese.' },
  { id: 'prumo:classificar', agente: 'investigacao-bugs', tipo: 'fato', titulo: 'Classificar uma falha', texto: 'Erro de automação (seletor, fixture, espera) é diferente de defeito do produto (resultado diverge da regra) e de bloqueio de ambiente (rede, credencial, serviço fora do ar). Classifique como hipótese e confirme reproduzindo.' },
  { id: 'prumo:flaky', agente: 'investigacao-bugs', tipo: 'procedimento', titulo: 'Teste instável (flaky)', texto: 'Não esconda com retentativa: registre a taxa de falha e procure espera por tempo, dependência de ordem, dados compartilhados ou relógio. Isole em quarentena com dono e prazo e conserte a causa.' },
  { id: 'prumo:regressao', agente: 'regressao', tipo: 'procedimento', titulo: 'Escolher o que rodar na regressão', texto: 'Smoke das jornadas críticas a cada mudança; regressão completa antes de liberar; entre os dois, os testes das áreas que mudaram (análise de impacto). Agende o que se repete.' },
  { id: 'prumo:metricas', agente: 'monitoramento', tipo: 'fato', titulo: 'Leitura de métricas', texto: 'Contagens de PASS, FAIL e BLOCKED mostram o que foi executado, não a qualidade do produto. Compare tendências no tempo e trate picos de BLOCKED (ambiente) separados de FAIL (produto ou automação).' },
  { id: 'prumo:banco', agente: 'orquestrador', tipo: 'fato', titulo: 'Banco de conhecimento', texto: 'O que os agentes sabem fica em conhecimento.db, só neste computador. Abra o arquivo no Beekeeper Studio (ou em outro gerenciador SQLite) para consultar; para ensinar, aprovar ou descartar, use o Cérebro de cada agente.' }
];

export type Linha = Record<string, unknown>;

// Conhecimentos.
export type Filtro = { espacoId: string | null; agente?: string | null; estados?: EstadoConhecimento[]; busca?: string; limite?: number; somenteDoAgente?: boolean };

export type NovoConhecimento = { espacoId: string | null; agente: string | null; tipo: TipoConhecimento; titulo: string; texto: string; origem: Exclude<OrigemConhecimento, 'PRUMO'>; cliente?: string | null };

// Relevância (para o chat e para a IA).
export const pare = new Set(['qual', 'quais', 'como', 'onde', 'quando', 'sobre', 'para', 'com', 'que', 'uma', 'uns', 'umas', 'dos', 'das', 'tem', 'tenho', 'este', 'esta', 'esse', 'essa', 'isso', 'isto', 'aqui', 'projeto', 'prumo', 'tudo', 'algum', 'alguma', 'voce', 'mais', 'menos', 'muito', 'pode', 'posso', 'fazer', 'faco', 'quero', 'preciso', 'sobre', 'entre', 'depois', 'antes', 'ainda', 'agora', 'teste', 'testes', 'testar']);

export type Atendimento = { id: number; em: string; agente: string; modo: string; fontes: string[]; avaliacao: string | null };

// ── skills ──
/** Formato do banco de Skills: trechos de instrução por especialização, com origem, licença, estado e limites. */

/**
 * Banco de Skills (skills.db), separado do conhecimento.db. Cada Skill é guardada em trechos (um parágrafo ou seção),
 * para que o prompt leve só o que combina com a pergunta, em vez do arquivo inteiro.
 * - PRUMO: trechos das Skills que acompanham o aplicativo (pasta backend/agentes/skills/), sincronizados a cada versão.
 * - PESSOA: escritos pela equipe na tela; nascem APROVADO (é a decisão dela).
 * - IMPORTADO: vindos de uma pasta de Skill aberta (ex.: repositório clonado), com fonte e licença; nascem RASCUNHO.
 * - IA: sugeridos por IA; nascem RASCUNHO.
 * Só APROVADO vai para o prompt. Texto é instrução para a IA, então passa pela máscara de segredos e por aprovação humana.
 */
export const estadosTrecho = ['RASCUNHO', 'APROVADO', 'DESCARTADO'] as const;

export type EstadoTrecho = (typeof estadosTrecho)[number];

const origensTrecho = ['PRUMO', 'PESSOA', 'IMPORTADO', 'IA'] as const;

type OrigemTrecho = (typeof origensTrecho)[number];

export type TrechoDeSkill = {
  id: string; especializacao: string; titulo: string; texto: string; ordem: number;
  origem: OrigemTrecho; estado: EstadoTrecho; fonte: string | null; licenca: string | null;
  criadoEm: string; decididoEm: string | null;
};

/** Um trecho ainda sem identificador, data nem estado (o estado depende da origem). */
export type NovoTrecho = { especializacao: string; titulo: string; texto: string; ordem?: number; origem: Exclude<OrigemTrecho, 'PRUMO'>; fonte?: string | null; licenca?: string | null };

/** Parte de um arquivo SKILL.md já dividido: título da seção, texto e posição. */
export type ParteDaSkill = { titulo: string; texto: string; ordem: number };

/** Limites: tamanho de cada trecho, total no banco, sugestões de IA por hora e bytes de Skill que cabem num prompt. */
export const limitesSkills = { titulo: 120, texto: 4000, trechos: 5000, iaPorHora: 20, porConsulta: 500, porPrompt: 8000, arquivo: 65536 } as const;

export const VERSAO_ESQUEMA_SKILLS = 1;

export const idTrecho = /^(prumo:[a-z0-9-]{1,40}:[0-9a-f]{12}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
