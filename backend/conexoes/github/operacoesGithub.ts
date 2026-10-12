/** Lista das operações de escrita no GitHub que o Prumo conhece. */
import { abrirPullRequestNoGithub } from './abrirPullRequestNoGithub.js';
import { criarBranchNoGithub } from './criarBranchNoGithub.js';
import { gravarTesteNoGithub } from './gravarTesteNoGithub.js';
import { DefOperacao } from '../tipos/operacao.js';

export const operacoesGithub = [criarBranchNoGithub, gravarTesteNoGithub, abrirPullRequestNoGithub] as unknown as DefOperacao<unknown>[];
