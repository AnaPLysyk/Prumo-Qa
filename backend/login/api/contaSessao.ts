/** Canal conta:sessao: identidade e provedores já configurados no processo principal. */
import { contaDaSessao, encerrarSessao, sessaoParaJanela } from '../regras/sessao.js';
import { validarSessaoRemota } from '../integracoes/autenticacaoRemota.js';
import { usarAutenticacaoRemota } from '../integracoes/configuracaoDaAutenticacao.js';
import { TratadorDoCanal } from '../../aplicativo/api/TratadorDoCanal.js';

export const contaSessao: TratadorDoCanal<'conta:sessao'> = async () => {
  // A consulta pública de estado é usada pelo relógio da janela: detectar revogação
  // no servidor mesmo sem outro pedido IPC. Sem conta local, não envia chamadas de rede.
  if (usarAutenticacaoRemota() && contaDaSessao()) {
    try { await validarSessaoRemota(); }
    catch { encerrarSessao(); }
  }
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
