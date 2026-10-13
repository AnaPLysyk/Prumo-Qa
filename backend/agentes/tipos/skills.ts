/** Formato do banco de Skills: trechos de instrução por especialização, com origem, licença, estado e limites. */

/**
 * Banco de Skills (skills.db), separado do conhecimento.db. Cada Skill é guardada em TRECHOS (um parágrafo ou seção),
 * para que o prompt leve só o que combina com a pergunta, em vez do arquivo inteiro.
 * - PRUMO: trechos das Skills que acompanham o aplicativo (pasta skills/), sincronizados a cada versão.
 * - PESSOA: escritos pela equipe na tela; nascem APROVADO (é a decisão dela).
 * - IMPORTADO: vindos de uma pasta de Skill aberta (ex.: repositório clonado), com fonte e licença; nascem RASCUNHO.
 * - IA: sugeridos por IA; nascem RASCUNHO.
 * Só APROVADO vai para o prompt. Texto é instrução para a IA, então passa pela máscara de segredos e por aprovação humana.
 */
export const estadosTrecho = ['RASCUNHO', 'APROVADO', 'DESCARTADO'] as const;

export type EstadoTrecho = (typeof estadosTrecho)[number];

export const origensTrecho = ['PRUMO', 'PESSOA', 'IMPORTADO', 'IA'] as const;

export type OrigemTrecho = (typeof origensTrecho)[number];

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
