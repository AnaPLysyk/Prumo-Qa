/** Formato de um framework detectado e de um achado de teste, com as fontes oficiais do Playwright. */

/**
 * Conhecimento especializado de engenharia de testes: detecção do framework por evidências reais e análise estática
 * determinística de arquivos de teste. Não há modelo de IA aqui: a IA hospedeira usa estes achados e a Skill do framework.
 * Só lê o que o inventário autorizado do projeto já trouxe; nunca altera testes nem executa código do projeto.
 */
export type Fonte = { path: string; content: string };

export type Framework = { id: 'playwright' | 'api-rest'; nome: string; estado: 'CONFIRMADO' | 'PROVAVEL' | 'INCERTO'; evidencias: string[]; skill: string; observacao?: string };

export const doc = 'https://playwright.dev/docs';

export const conhecimento = {
  playwright: { id: 'playwright', nome: 'Playwright (TypeScript/JavaScript)', skill: 'skills/playwright/SKILL.md', fontes: [`${doc}/best-practices`, `${doc}/locators`, `${doc}/test-assertions`, `${doc}/test-retries`, `${doc}/actionability`, `${doc}/writing-tests`, `${doc}/api-testing`] },
  'api-rest': { id: 'api-rest', nome: 'Fundamentos de testes de API REST', skill: 'skills/api-rest/SKILL.md', fontes: [`${doc}/api-testing`] }
} as const;

export const config = /(^|[\\/])playwright\.config\.(ts|js|mjs|cjs)$/;

export type AchadoTeste = { regra: string; severidade: 'high' | 'medium' | 'low'; arquivo: string; linha: number; trecho: string; orientacao: string; fonte: string };
