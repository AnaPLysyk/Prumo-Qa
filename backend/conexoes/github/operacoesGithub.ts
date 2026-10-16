/** Lista das operações de escrita no GitHub que o Prumo conhece. */
import { abrirPullRequestNoGithub } from './abrirPullRequestNoGithub.js';
import { criarBranchNoGithub } from './criarBranchNoGithub.js';
import { criarIssueNoGithub } from './criarIssueNoGithub.js';
import { gravarTesteNoGithub } from './gravarTesteNoGithub.js';
import { DefOperacao } from '../tipos/operacao.js';

export const operacoesGithub = [criarBranchNoGithub, gravarTesteNoGithub, abrirPullRequestNoGithub, criarIssueNoGithub] as unknown as DefOperacao<unknown>[];
