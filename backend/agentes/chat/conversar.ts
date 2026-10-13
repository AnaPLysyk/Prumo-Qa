/** Atende uma pergunta do chat: entende intenções, escolhe o agente, responde localmente e, se autorizado, consulta Claude ou Codex. */
import { lerPerfil } from '../banco/lerPerfil.js';
import { pesosAprendidos } from '../banco/pesosAprendidos.js';
import { aplicarEstilo } from './aplicarEstilo.js';
import { escolherAgente } from './escolherAgente.js';
import { intencaoDeAprender } from './intencaoDeAprender.js';
import { intencaoDePerfil } from './intencaoDePerfil.js';
import { intencaoDeSaber } from './intencaoDeSaber.js';
import { proximosPassosSugeridos } from './proximosPassosSugeridos.js';
import { responderComDadosLocais } from './responderComDadosLocais.js';
import { responderSobreTeste } from './responderSobreTeste.js';
import { orquestrar } from './orquestrar.js';
import { planejarOrquestracao } from './planejarOrquestracao.js';
import { registrarOrquestracao } from '../banco/registrarOrquestracao.js';
import { Orquestracao } from '../tipos/orquestracao.js';
import { Coleta, Opcoes, Resposta } from '../tipos/chat.js';
import { consultarIaExterna } from './consultarIaExterna.js';
import { montarResposta } from './montarResposta.js';
import { juntarConhecimentos } from './juntarConhecimentos.js';
import { AgenteChat, agentesChat } from '../tipos/persona.js';
import { tentarOuPadrao } from '../../compartilhado/erros/tentarOuPadrao.js';

export async function conversar(o: Opcoes): Promise<Resposta> {
  const pergunta = o.pergunta.trim(); const estilo = o.estilo ?? 'amigavel'; const nome = (o.nome || 'Prumo').slice(0, 40); const historico = (o.historico ?? []).slice(-6);
  const perfil = tentarOuPadrao(() => lerPerfil(o.base), null); const pessoa = perfil?.comoChamar ?? null;
  const montar = (agente: AgenteChat, c: Coleta, modo: Resposta['modo'], extra: Partial<Resposta> & { rota?: Resposta['rota'] } = {}): Resposta => montarResposta(agente, c, modo, estilo, pessoa, extra);

  // 1) Conversas sobre a própria relação (como chamar, papel, ensinar, o que sabe): respondidas localmente, sempre.
  const meta = intencaoDePerfil(pergunta, historico, perfil, o.base) ?? intencaoDeAprender(pergunta, o.espacoId, o.agente, o.base) ?? intencaoDeSaber(pergunta, o.espacoId, o.agente, o.base);
  if (meta) {
    const a = agentesChat.find((x) => x.id === (meta.agente ?? 'orquestrador'))!; const novo = tentarOuPadrao(() => lerPerfil(o.base), perfil);
    return montar(a, { linhas: aplicarEstilo(meta.linhas, estilo === 'direto' ? 'amigavel' : estilo, nome, a, false, []), fontes: meta.fontes ?? [], fatos: [] }, 'LOCAL', { proximos: meta.proximos ?? [], acoes: meta.acoes ?? [], pendente: meta.pendente ?? null, pessoa: novo?.comoChamar ?? null });
  }

  // 2) Roteamento (com memória da sessão e vocabulário aprendido) e resposta local com dados reais.
  const aprendidos = tentarOuPadrao(() => pesosAprendidos(pergunta, o.base), {});
  const teste = o.contexto?.tipo === 'teste' ? responderSobreTeste(o.contexto, o.espacoId, o.base) : null;
  const r = teste ? { agente: teste.agente!, rota: [], continuou: false } : escolherAgente(pergunta, o.agente, { historico, aprendidos });
  // 3) Orquestração: sem agente escolhido pela pessoa e com dois ou mais especialistas fortes, cada um responde uma etapa.
  const plano = !teste && !o.agente && !r.continuou ? planejarOrquestracao(r.rota) : null;
  let orquestracao: Orquestracao | undefined; let avisoOrquestracao: string | undefined;
  let agente = r.agente; let local: Coleta;
  if (plano) {
    const feito = await orquestrar(plano.map((id) => agentesChat.find((a) => a.id === id)!), r.rota, pergunta, o.espacoId, o.base);
    agente = agentesChat.find((a) => a.id === 'orquestrador')!; local = feito.coleta; orquestracao = feito.registro;
    try { registrarOrquestracao(orquestracao, o.base); } catch { avisoOrquestracao = 'Não foi possível registrar a orquestração no Painel de atividades; a resposta foi preservada.'; }
  } else local = teste ?? await responderComDadosLocais(agente, pergunta, o.espacoId, o.base);
  juntarConhecimentos(o, agente, pergunta, historico, r.continuou, local);
  const proximos = proximosPassosSugeridos(agente.id, local.fatos, perfil?.papel ?? null, pergunta);
  const comum = { rota: r.rota, continuou: r.continuou, proximos, ...(orquestracao ? { orquestracao } : {}), ...(avisoOrquestracao ? { aviso: avisoOrquestracao } : {}) };
  const provedor = o.provedor ?? 'local'; const chave = pergunta + '|' + historico.length;
  const vestido = () => aplicarEstilo(local.linhas, estilo, nome, agente, !!o.primeira, local.fatos, pessoa, chave);
  if (provedor === 'local') return montar(agente, { ...local, linhas: vestido() }, 'LOCAL', comum);

  return consultarIaExterna({ o, agente, pergunta, local, estilo, nome, perfil, historico, comum, provedor, montar, vestido });
}
