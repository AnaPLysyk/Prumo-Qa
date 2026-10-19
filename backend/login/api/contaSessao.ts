/** Canal conta:sessao: identidade e provedores já configurados no processo principal. */
import { sessaoParaJanela } from '../regras/sessao.js';
import { usarAutenticacaoRemota } from '../integracoes/configuracaoDaAutenticacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaSessao: TratadorDoCanal<'conta:sessao'> = async () => {
  const sessao = sessaoParaJanela();
  // O login central não usa os OAuth Apps locais; não confundir as duas identidades.
  if (usarAutenticacaoRemota()) return sessao;
  const { configuracaoDoProvedor } = await import('../regras/configuracaoDoLogin.js');
  return {
    ...sessao,
    entradaGithub: !!configuracaoDoProvedor('github'),
    entradaGoogle: !!configuracaoDoProvedor('google')
  };
};
