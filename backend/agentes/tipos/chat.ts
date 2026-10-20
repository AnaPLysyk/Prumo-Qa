/** Formato da conversa do chat (turnos, estilos, provedores, resposta) e o guia de respostas do orquestrador. */
import { AgenteChat, Experiencia, Papel } from './persona.js';
import { Fonte } from '../../inicio/tipos/assistenteLocal.js';
import { TipoTeste } from '../../testes/tipos/catalogoDeTestes.js';
import { Orquestracao } from './orquestracao.js';

const estilos = ['amigavel', 'direto', 'tecnico'] as const;

export type Estilo = (typeof estilos)[number];

const provedores = ['local', 'claude', 'codex'] as const;

export type Provedor = (typeof provedores)[number];

export type Pendente = 'nome' | 'papel' | null;

/** Um turno da memória da sessão (fica só na janela). */
export type Turno = { pergunta: string; agente: string; pendente?: Pendente };

/** Contexto de onde a pergunta nasceu (por exemplo, o teste aberto na visão de código). */
export type ContextoChat = { tipo: 'teste'; arquivo: string; linha?: number | null };

export type Proximo = { rotulo: string; pergunta?: string; aba?: string };

export type Acao = { tipo: 'aprovar_conhecimento' | 'descartar_conhecimento'; id: string; rotulo: string };

export type Resposta = { agente: { id: string; nome: string; especializacao: string | null }; linhas: string[]; fontes: Fonte[]; modo: 'LOCAL' | 'CLAUDE' | 'CODEX';
  estilo: Estilo; rota: { agente: string; pontos: number }[]; fatos: string[]; aviso?: string; proximos: Proximo[]; acoes: Acao[]; pendente: Pendente; pessoa: string | null; continuou: boolean; orquestracao?: Orquestracao };

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

// Delegação opcional ao Claude Code ou Codex (CLI local, com autorização prévia).
export type Executor = (comando: string, args: string[], opcoes: { timeoutMs: number; cwd?: string }) => Promise<{ codigo: number | null; saida: string; erro: string }>;

export type PerfilParaIa = { comoChamar: string | null; papel: Papel | null; experiencia?: Experiencia | null; foco?: string | null; compartilharComIa?: boolean };

export type ExtrasPrompt = { perfil?: PerfilParaIa | null; conta?: { nome: string; acesso: string } | null; historico?: Turno[]; conhecimentos?: { titulo: string; texto: string }[]; base?: string; skill?: string };

export type Opcoes = { espacoId: string | null; pergunta: string; agente?: string | null; estilo?: Estilo; nome?: string; provedor?: Provedor; primeira?: boolean;
  historico?: Turno[]; contexto?: ContextoChat | null;
  executavel?: (p: Exclude<Provedor, 'local'>) => string | null; executor?: Executor; autorizados?: Partial<Record<Exclude<Provedor, 'local'>, boolean>>; base?: string };
