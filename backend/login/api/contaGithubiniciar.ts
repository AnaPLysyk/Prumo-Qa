/** Canal conta:githubiniciar: Abrir o navegador para entrar ou se cadastrar pelo GitHub. */
import { dependenciasDoGithub } from '../regras/configuracaoDoLogin.js';
import { iniciarEntradaGithub } from '../regras/entradaPeloGithub.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaGithubiniciar: TratadorDoCanal<'conta:githubiniciar'> = a => iniciarEntradaGithub(dependenciasDoGithub(), a.ativar ? 'ativar' : 'entrar');
