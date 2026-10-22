/** chat: fluxo consolidado por responsabilidade, com operações identificadas por nome. */
import { AgenteChat, Experiencia, Papel } from "./persona.js";
import { Fonte } from "../../inicio/servico.js";
import { TipoTeste } from "../../testes/tipos/catalogoDeTestes.js";
import { Perfil } from "./conhecimento.js";

// --- orquestracao ---
/** Formato da orquestração observável: quais agentes participaram, em que ordem, quanto tempo cada etapa levou e o que consultou. */

/** Uma etapa: um agente respondendo com os dados locais. SEM_DADOS = rodou e não achou nada; FALHOU = a consulta deu erro. */
type EstadoEtapa = 'CONCLUIDA' | 'SEM_DADOS' | 'FALHOU';

export type EtapaDaOrquestracao = { ordem: number; agente: string; inicio: string; fim: string; duracaoMs: number; estado: EstadoEtapa; fontes: string[]; fatos: string[]; linhas: number; erro?: string };

/**
 * Registro de uma orquestração (sem a pergunta e sem a resposta, como os atendimentos): o orquestrador escolhe as
 * especializações pela pontuação do roteamento, delega uma etapa a cada uma, em ordem, e junta os resultados.
 * As etapas são independentes (nenhuma usa o resultado de outra); isso fica explícito em `dependencias`.
 */
export type Orquestracao = {
  id: string; em: string; espacoId: string | null; responsavel: 'orquestrador'; modo: 'LOCAL';
  motivo: { agente: string; pontos: number }[]; agentes: string[]; dependencias: 'INDEPENDENTES';
  etapas: EtapaDaOrquestracao[]; estado: 'EXECUTANDO' | 'CONCLUIDA' | 'PARCIAL' | 'FALHOU'; duracaoMs: number; emExecucao?: string;
};

/** No máximo 3 especialistas por pergunta, cada um com pelo menos 3 pontos no roteamento (sinal forte da especialidade); 500 registros guardados. */
export const limitesOrquestracao = { agentes: 3, pontosMinimos: 3, registros: 500, porConsulta: 50 } as const;

// --- chat ---
// --- chat ---
const estilos = ['amigavel', 'direto', 'tecnico'] as const;

export type Estilo = (typeof estilos)[number];

const provedores = ['local', 'claude', 'codex', 'copilot', 'gemini'] as const;

export type Provedor = (typeof provedores)[number];

/** Com quem a pessoa fala: o Orchestrator local, uma IA externa ou a mesa (várias IAs autorizadas conversando, com o Orquestrador mediando). */
export type ProvedorDeConversa = Provedor | 'mesa';

/** Resultado estruturado da mesa: quem falou, o que cada IA disse e o resumo do Orquestrador. `linhas` da Resposta repete tudo em texto corrido. */
export type MesaDeIas = { ias: { provedor: Exclude<Provedor, 'local'>; nome: string; linhas: string[] }[]; resumo: string[] };

export type Pendente = 'nome' | 'papel' | null;

/** Um turno da memória da sessão (fica só na janela). */
export type Turno = { pergunta: string; agente: string; pendente?: Pendente; /** Começo da resposta dada, só na memória da janela, para a IA entender "e o segundo?". */ resposta?: string };

/** Contexto de onde a pergunta nasceu (por exemplo, o teste aberto na visão de código). */
export type ContextoChat = { tipo: 'teste'; arquivo: string; linha?: number | null };

export type Proximo = { rotulo: string; pergunta?: string; aba?: string };

export type Acao = { tipo: 'aprovar_conhecimento' | 'descartar_conhecimento'; id: string; rotulo: string };

export type Resposta = { agente: { id: string; nome: string; especializacao: string | null }; linhas: string[]; fontes: Fonte[]; modo: 'LOCAL' | 'CLAUDE' | 'CODEX' | 'COPILOT' | 'GEMINI' | 'MESA';
  mcp?: { estado: 'CONFIRMADO' | 'NAO_CONFIRMADO' | 'SEM_PROJETO' | 'NAO_NECESSARIO'; ferramentas: string[] };
  estilo: Estilo; rota: { agente: string; pontos: number }[]; fatos: string[]; aviso?: string; proximos: Proximo[]; acoes: Acao[]; pendente: Pendente; pessoa: string | null; continuou: boolean; orquestracao?: Orquestracao; mesa?: MesaDeIas };

export const SEGUIMENTO = /^(e |e\?|mais |mais$|detalh|explica|explique|por que|porque|como assim|isso|esse|essa|esses|essas|o primeiro|a primeira|o segundo|a segunda|o ultimo|a ultima|outro|outra|continu|e ontem|e hoje|ok e |e agora)/;

// Guia do sistema: como fazer cada coisa no próprio aplicativo (descrição das telas existentes, sem dados inventados).
export const guia: [string[], string, Fonte][] = [
  [['vincular', 'adicionar projeto', 'novo projeto', 'criar projeto'], 'Para trabalhar num projeto, abra Projetos e use "Vincular pasta…" (pasta com qa.project.json) ou crie um projeto Prumo e associe a pasta do repositório.', { rotulo: 'Projetos', aba: 'projetos' }],
  [['conectar', 'codex', 'claude', 'mcp'], 'Codex e Claude Code se conectam pelo servidor MCP do Prumo: em Conexões você vê o comando proposto e o diagnóstico. Nada é alterado sem confirmação.', { rotulo: 'Conexões', aba: 'conexoes' }],
  [['tema', 'idioma', 'cor', 'escuro', 'claro', 'configur'], 'Tema, idioma e cor ficam em Ajustes (engrenagem no canto superior direito). Lá também está a configuração do assistente: nome, estilo, voz, como te chamo e o seu papel.', { rotulo: 'Início', aba: 'inicio' }],
  [['agenda', 'agendar', 'rotina'], 'Rotinas são criadas em Agendamentos: escolha tipo, frequência e fuso. O worker executa mesmo com a janela fechada.', { rotulo: 'Agendamentos', aba: 'agenda' }],
  [['evidencia', 'evidencias'], 'Evidências mostram resultado, logs redigidos e integridade de cada execução real.', { rotulo: 'Evidências', aba: 'evidencias' }],
  [['jira', 'ticket'], 'Tickets são consultados ao vivo no Jira, em modo leitura; comentar exige escrita habilitada e confirmação.', { rotulo: 'Tickets', aba: 'tickets' }],
  [['exportar', 'relatorio', 'pdf'], 'Logs, Histórico e Métricas têm exportação no canto superior direito; Métricas exporta JSON, CSV e impressão em PDF.', { rotulo: 'Métricas', aba: 'metricas' }],
  [['agente', 'agentes', 'especializa'], 'Em Agentes você vê as especializações, ajusta permissões e abre o Cérebro de cada uma para ver, ensinar, aprovar ou descartar o que ela sabe.', { rotulo: 'Agentes', aba: 'agentes' }],
  [['conhecimento', 'cerebro', 'ensinar', 'beekeeper', 'banco'], 'O que cada agente sabe fica no banco conhecimento.db, só neste computador. Ensine, aprove ou descarte pelo Cérebro (Agentes); o arquivo também abre no Beekeeper Studio para consulta.', { rotulo: 'Agentes', aba: 'agentes' }]
];

export const GUIA_MANUAL = 'Teste manual: em Testes › Runs, prepare a execução da feature, registre o resultado de cada caso (PASS, FAIL, BLOCKED) com a evidência e, se quiser, publique no Qase com confirmação. O que se repete em toda rodada é candidato a automação.';

export const agentePorTipo: Record<TipoTeste, string> = { funcional: 'playwright', smoke: 'playwright', regressao: 'playwright', integracao: 'api-rest', acessibilidade: 'acessibilidade', desempenho: 'regressao', unitario: 'qa-geral', indefinido: 'qa-geral' };

export type Coleta = { linhas: string[]; fontes: Fonte[]; fatos: string[]; generico?: boolean; vazio?: boolean; agente?: AgenteChat };

// Perfil, aprendizado e memória.
export const PAPEIS: [RegExp, Papel][] = [[/\b(qa|tester|testador[a]?|analista de testes?|analista de qualidade|quality assurance)\b/, 'qa'], [/\b(dev|desenvolvedor[a]?|programador[a]?|engenheir[oa] de software|developer)\b/, 'dev'],
  [/\b(po|product owner|dono do produto|produto|product manager|pm)\b/, 'po'], [/\b(analista|analista de negocio|analista de requisitos|analista de sistemas|ba)\b/, 'analista']];

export type Meta = { linhas: string[]; pendente?: Pendente; acoes?: Acao[]; agente?: string; fontes?: Fonte[]; proximos?: Proximo[] };

// Delegação opcional aos CLIs autorizados. Gemini recebe o MCP por configuração temporária, sem mudar a conta do cliente.
export type Executor = (comando: string, args: string[], opcoes: { timeoutMs: number; cwd?: string; gemini?: boolean; mcpGemini?: { command: string; args: string[]; env: Record<string, string> } }) => Promise<{ codigo: number | null; saida: string; erro: string; /** O processo nem chegou a rodar (executável ausente, sem permissão ou buffer estourado); sem isso, código nulo significa tempo esgotado. */ falhaAoExecutar?: boolean }>;

export type PerfilParaIa = { comoChamar: string | null; papel: Papel | null; experiencia?: Experiencia | null; foco?: string | null; compartilharComIa?: boolean };

export type ExtrasPrompt = { vinculos?: string[]; perfil?: PerfilParaIa | null; conta?: { nome: string; acesso: string } | null; historico?: Turno[]; conhecimentos?: { titulo: string; texto: string }[]; base?: string; skill?: string; /** Rodada de crítica da mesa: resposta curta e sem pedido de aprendizado. */ critica?: boolean };

export type Opcoes = { espacoId: string | null; pergunta: string; agente?: string | null; estilo?: Estilo; nome?: string; provedor?: ProvedorDeConversa; primeira?: boolean;
  historico?: Turno[]; contexto?: ContextoChat | null;
  executavel?: (p: Exclude<Provedor, 'local'>) => string | null; executor?: Executor; autorizados?: Partial<Record<Exclude<Provedor, 'local'>, boolean>>; base?: string };

// --- ContextoDelegacao ---
export type ContextoDelegacao = {
  o: Opcoes;
  agente: AgenteChat;
  pergunta: string;
  local: Coleta;
  estilo: Estilo;
  nome: string;
  perfil: Perfil | null;
  historico: Turno[];
  comum: Pick<Resposta, 'rota' | 'continuou' | 'proximos'>;
  provedor: Exclude<Provedor, 'local'>;
  montar: (agente: AgenteChat, coleta: Coleta, modo: Resposta['modo'], extra?: Partial<Resposta> & { rota?: Resposta['rota'] }) => Resposta;
  vestido: () => string[];
};
