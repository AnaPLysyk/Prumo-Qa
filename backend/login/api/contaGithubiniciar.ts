/** Canal conta:githubiniciar: Abrir o navegador para entrar ou se cadastrar pelo GitHub. */
import { dependenciasDoGithub } from '../regras/configuracaoDoLogin.js';
import { iniciarEntrada } from '../regras/entradaPorProvedor.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaGithubiniciar: TratadorDoCanal<'conta:githubiniciar'> = a => iniciarEntrada('github', dependenciasDoGithub(), a.ativar ? 'ativar' : 'entrar');
