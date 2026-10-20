/** Aplica uma mudança a um contexto e grava a nova versão, recusando históricos adulterados ou cheios. */
import path from 'node:path';
import { ErroQa } from '../../compartilhado/erros.js';
import { Projeto } from '../../compartilhado/tipos/projeto.js';
import { carregarContexto } from './consultarContextos.js';
import { gravarArquivoDeContexto } from './arquivosDeContexto.js';
import { obterContexto } from '../regras/consultasDeContextos.js';
import { Arquivo, Entrada, limites } from '../tipos/contexto.js';

export const mudarContexto = (p: Projeto, id: string, f: (a: Arquivo) => Entrada, base?: string) => {
  const { dir, arq, integro } = carregarContexto(p, id, base); if (!integro) throw new ErroQa('CONTEXT_TAMPERED', 'O histórico deste contexto foi alterado fora do Prumo; recuse-o ou exclua-o.');
  if (arq.historico.length >= limites.historico) throw new ErroQa('CONTEXT_LIMIT', 'Histórico do contexto atingiu o limite.');
  const e = f(arq); arq.historico.push(e); gravarArquivoDeContexto(path.join(dir, id + '.json'), arq); return obterContexto(p, id, base);
};
