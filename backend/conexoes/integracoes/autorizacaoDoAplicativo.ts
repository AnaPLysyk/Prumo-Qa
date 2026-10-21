/** Liga a autorização pelo navegador ao app real: sessão do Prumo, navegador padrão, serviço do Prumo e cofre do sistema. */
import { shell } from "electron";
import { contaDaSessao } from "../../login/regras/sessao.js";
import { servicosDoAplicativo } from "../regras/nucleoServicos.js";
import { criarAutorizacaoPeloNavegador } from "./autorizacaoPeloNavegador.js";
import { estadoNoServico, iniciarNoServico, retirarDoServico } from "./servicoDeAutorizacao.js";

export const autorizacaoDoAplicativo = criarAutorizacaoPeloNavegador({
  dono: () => { const id = contaDaSessao()?.id; if (!id) throw new Error('SESSION_REQUIRED'); return id; },
  iniciar: iniciarNoServico,
  estado: estadoNoServico,
  retirar: retirarDoServico,
  abrir: url => shell.openExternal(url),
  adicionar: entrada => servicosDoAplicativo.adicionarOAuth(entrada as Parameters<typeof servicosDoAplicativo.adicionarOAuth>[0]),
  repositorios: async contaId => (await servicosDoAplicativo.listar(contaId, { limite: 1 })).recursos.length
});
