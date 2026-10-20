/** Lista das operações de escrita no GitHub que o Prumo conhece. */
import { abrirPullRequestNoGithub } from './fluxoRepositorio.js';
import { criarBranchNoGithub } from './fluxoRepositorio.js';
import { criarIssueNoGithub } from './criarIssueNoGithub.js';
import { gravarTesteNoGithub } from './fluxoRepositorio.js';
import { DefOperacao } from '../tipos/operacao.js';

export const operacoesGithub = [criarBranchNoGithub, gravarTesteNoGithub, abrirPullRequestNoGithub, criarIssueNoGithub] as unknown as DefOperacao<unknown>[];
