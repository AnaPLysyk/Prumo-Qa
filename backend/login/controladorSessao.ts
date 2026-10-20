/** Controlador da funcionalidade login: atende canais IPC e delega ao serviço responsável, sem alterar validação nem permissões. */
import { contaDaSessao, encerrarSessao, sessaoParaJanela } from "./regras/sessao.js";
import { validarSessaoRemota } from "./integracoes/autenticacaoRemota.js";
import { usarAutenticacaoRemota } from "./integracoes/configuracaoDaAutenticacao.js";
import { TratadorDoCanal } from "../aplicativo/api/TratadorDoCanal.js";

import { entrarNaConta } from './regras/contas.js';
import { entrarRemotamente, sairRemotamente } from './integracoes/autenticacaoRemota.js';
import { entrarComIdentidadeRemota } from './regras/entrarComIdentidadeRemota.js';

export const contaEntrar: TratadorDoCanal<'conta:entrar'> = async a => {
  if(usarAutenticacaoRemota()){
    const identidade=await entrarRemotamente(a.login,a.senha);
    try{return entrarComIdentidadeRemota(identidade);}
    catch(erro){
      // Login remoto pode funcionar mesmo quando o vínculo local é recusado
      // (ex.: e-mail da conta antiga). Não deixar cookie válido sem sessão local.
      await sairRemotamente();
      throw erro;
    }
  }
  return entrarNaConta(a);
};

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
  const { configuracaoDoProvedor } = await import('./regras/configuracaoDoLogin.js');
  return {
    ...sessao,
    entradaGithub: !!configuracaoDoProvedor('github'),
    entradaGoogle: !!configuracaoDoProvedor('google')
  };
};
