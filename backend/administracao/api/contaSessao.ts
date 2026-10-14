/** Canal conta:sessao: Saber se o login está ligado, quem está na sessão e o que cada tela permite. */
import { sessaoParaJanela } from '../regras/sessao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaSessao: TratadorDoCanal<'conta:sessao'> = () => sessaoParaJanela();
