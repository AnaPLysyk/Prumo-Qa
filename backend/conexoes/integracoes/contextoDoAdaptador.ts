/** Dá às operações de escrita só o necessário (ler, enviar e limpar), sem nunca entregar a credencial; erros viram ErroServico. */
import { ContextoServico, PartesDoAdaptador } from '../tipos/adaptador.js';
import { cabecalhosDoServico } from './configuracaoDosServicos.js';
import { ErroServico } from './ErroServico.js';
import { lerComCredencial } from './requisicoes.js';
import { limparRespostaDoServico } from '../integracoesFormatos.js';

export function contextoDoAdaptador(a: PartesDoAdaptador): ContextoServico {
  const c = a.c;
  return {
    servico: c.servico, instancia: c.instancia,
    ler: p => lerComCredencial(a, p),
    enviar: async (metodo, caminho, corpo, tipoConteudo, extraHeaders) => {
      if (!c.token) throw new ErroServico('CREDENTIAL_UNAVAILABLE');
      try { return await a.escrita({ servico: c.servico, instancia: c.instancia, caminho, headers: { ...cabecalhosDoServico(c), ...(extraHeaders ?? {}) }, corpo, metodo, tipoConteudo }); }
      catch (e) { if (e instanceof ErroServico) throw e; throw new ErroServico('SERVICE_UNAVAILABLE'); }
    },
    limpar: v => limparRespostaDoServico(c, v)
  };
}
