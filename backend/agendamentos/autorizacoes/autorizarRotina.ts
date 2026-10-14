/** Pede a autenticação do Windows e cria a autorização prévia para a rotina rodar sozinha (escopo exato, validade e limite de usos). */
import { autorizarEscopo } from './autorizarEscopo.js';
import { obterRotina } from '../banco/obterRotina.js';
import { capacidadeDoK6 } from '../k6/capacidadeDoK6.js';
import { escopoDoK6 } from '../k6/escopoDoK6.js';
import { localizarK6 } from '../k6/localizarK6.js';
import { capacidadesDaRotina } from '../regras/capacidadesDaRotina.js';
import { Solicitador } from '../tipos/autorizacoes.js';
import { ExecutavelK6 } from '../tipos/k6.js';
import { ErroQa } from '../../compartilhado/erros/ErroQa.js';
import { carregarProjeto } from '../../compartilhado/projeto/carregarProjeto.js';
import { escopoDeCapability } from '../../testes/regras/escopoDeCapability.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

/** Pede ao broker nativo o consentimento para cada automação da rotina (escopo exato) e grava as autorizações. */
export async function autorizarRotina(rotinaId: string, opcoes: { dias: number; maxUsos: number }, solicitar: Solicitador, base?: string, exe?: ExecutavelK6 | null) {
  const r = obterRotina(rotinaId, base); const e = obterEspaco(r.espacoId, base);
  if (!['smoke', 'regressao', 'validacao-ticket', 'k6', 'run-qase'].includes(r.tipo)) throw new ErroQa('AUTH_NOT_REQUIRED', 'Este tipo de rotina só lê dados e não precisa de autorização de execução.');
  if (!e.pastaLocal) throw new ErroQa('PROJECT_FOLDER_REQUIRED', 'Vincule uma pasta de automação ao projeto antes de autorizar execuções.');
  const p = await carregarProjeto(e.pastaLocal); const criadas = [];
  if (r.tipo === 'k6') {
    const k = exe ?? (await localizarK6().then(c => (c ? { executable: c } : null))); if (!k || !r.k6) throw new ErroQa('RUNTIME_MISSING', 'k6 não encontrado no PATH.');
    criadas.push(await autorizarEscopo(p, e.id, capacidadeDoK6(r.k6), r.ambiente, await escopoDoK6(p, r.k6, r.ambiente, k), opcoes, base, solicitar));
  } else {
    const caps = capacidadesDaRotina(r, base); if (!caps.length) throw new ErroQa('NO_VERIFIED_LINK', 'Não há automação associada a esta rotina.');
    for (const c of caps) criadas.push(await autorizarEscopo(p, e.id, c, r.ambiente, await escopoDeCapability(p, c), opcoes, base, solicitar));
  }
  return criadas.map(a => ({ id: a.id, capability: a.capability, validaAte: a.validaAte, maxUsos: a.maxUsos }));
}
