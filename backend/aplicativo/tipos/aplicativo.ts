/** Caminhos e constantes do processo principal: pasta da página, origem permitida, versão instalada e textos de exclusão. */
import { app } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { raizDoAplicativo } from '../../compartilhado/raizDoAplicativo.js';

export const rendererDir = path.join(raizDoAplicativo, 'app', 'renderer');

export const origemPermitida = pathToFileURL(path.join(rendererDir, 'index.html')).href;

export const versao = app.getVersion();

export const arquivoVersoes = path.join(raizDoAplicativo, 'app', 'versoes.json');

export type Resposta = { ok: true; data: unknown } | { ok: false; error: string };

// Exclusão: escopo explícito, confirmação nativa destrutiva e módulos donos de cada formato. Não existe equivalente em MCP.
export const textoExclusao = { historico: 'Excluir o histórico operacional (logs, histórico e métricas) deste projeto?', evidencias: 'Excluir as evidências de execução deste projeto (pasta .prumo\\evidencias)?', contextos: 'Excluir TODOS os contextos (requisitos, regras e decisões) deste projeto?', diagnostico: 'Excluir o diagnóstico técnico da interface?' } as const;

/**
 * 2.10.1: aviso automático de versão nova (padrão ligado; desliga em Ajuda › Atualizações). Ao abrir e a cada 6 horas,
 * inclusive só na bandeja. Mesmo destino fixo da consulta manual; nenhum dado da pessoa é enviado.
 * Fora do pacote só consulta o servidor de teste: desenvolvimento e testes nunca saem para a rede.
 */
export const SEIS_HORAS = 6 * 60 * 60 * 1000;

// ---- 2.9: operações externas, propostas, runs Qase, vínculos e agentes. Toda escrita remota passa por operacoesExternas.ts e por confirmação NATIVA. ----
export const nomeServico = { jira: 'Jira', qase: 'Qase', github: 'GitHub' } as const;

export type Aviso = { n: number; tipo: string; titulo: string; detalhe: string; rotinaId?: string; destino?: string; tocarSom?: boolean; at: string };

export const iniciouOculto = process.argv.includes('--oculto');
