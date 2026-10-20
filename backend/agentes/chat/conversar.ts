/** Atende uma pergunta do chat: entende intenções, escolhe o agente, responde localmente e, se autorizado, consulta Claude ou Codex. */
import { lerPerfil } from '../banco/lerPerfil.js';
import { nomeParaChamar } from './nomeParaChamar.js';
import { pesosAprendidos } from '../banco/pesosAprendidos.js';
import { aplicarEstilo } from './aplicarEstilo.js';
import { escolherAgente } from './escolherAgente.js';
import { intencaoDeAprender } from './intencaoDeAprender.js';
import { intencaoDePerfil } from './intencaoDePerfil.js';

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

import { AgenteChat, agentesChat } from '../tipos/persona.js';
import { tentarOuPadrao } from './tentarOuPadrao.js';
import { regrasDosAgentes } from '../../administracao/regras/agentesDaPlataforma.js';
import { Conhecimento } from '../tipos/conhecimento.js';
import { conhecimentosRelevantes } from '../banco/conhecimentosRelevantes.js';
import { semAcentos } from '../../compartilhado/texto/semAcentos.js';
import { listarConhecimentos } from '../banco/listarConhecimentos.js';
import { Meta } from '../tipos/chat.js';

function intencaoDeSaber(pergunta: string, espacoId: string | null, forcado: string | null | undefined, base?: string): Meta | null {
  const t = semAcentos(pergunta); if (!/o que (voce|vc) (sabe|aprendeu|conhece|lembra)|seus conhecimentos|o que (eu )?te ensinei|o que voce anotou/.test(t)) return null;
  const alvo = forcado ?? escolherAgente(t.replace(/o que (voce|vc) (sabe|aprendeu|conhece|lembra)( sobre)?/, '')).agente.id; const agente = alvo === 'orquestrador' ? null : alvo;
  const itens = tentarOuPadrao(() => listarConhecimentos({ espacoId, agente, estados: ['APROVADO', 'RASCUNHO'] }, base), [] as Conhecimento[]);
  const aprov = itens.filter((c) => c.estado === 'APROVADO'), rasc = itens.filter((c) => c.estado === 'RASCUNHO'); const meus = aprov.filter((c) => c.origem !== 'PRUMO');
  return { agente: alvo, fontes: [{ rotulo: 'Agentes', aba: 'agentes' }], linhas: [
    `Sei ${aprov.length} coisa(s) aprovada(s)${agente ? ' nesta especialidade' : ''}: ${aprov.length - meus.length} do conhecimento inicial do Prumo e ${meus.length} que você me ensinou${rasc.length ? `; ${rasc.length} rascunho(s) esperando sua decisão` : ''}.`,
    ...(meus.length ? [`Do que você me ensinou: ${meus.slice(0, 4).map((c) => c.titulo).join('; ')}.`] : []),
    'Tudo isso está no Cérebro de cada agente e no arquivo conhecimento.db.'] };
}


function juntarConhecimentos(o: Opcoes, agente: AgenteChat, pergunta: string, historico: NonNullable<Opcoes['historico']>, continuou: boolean, local: Coleta): void {
  // Seguimento ("e mais?"): busca pela pergunta anterior e mostra o que ainda não foi dito (do 2º item em diante).
  const anterior = continuou ? historico.at(-1)?.pergunta ?? '' : '';
  const rel = tentarOuPadrao(() => anterior ? conhecimentosRelevantes(o.espacoId, agente.id === 'orquestrador' ? null : agente.id, anterior, 4, o.base).slice(1, 3) : conhecimentosRelevantes(o.espacoId, agente.id === 'orquestrador' ? null : agente.id, pergunta, 2, o.base), [] as Conhecimento[]);
  if (rel.length) {
    const sabidas = rel.map((c) => `${c.origem === 'PRUMO' ? 'Do que eu sei' : 'Do que você me ensinou'} — ${semAcentos(c.texto).startsWith(semAcentos(c.titulo)) ? '' : c.titulo + ': '}${c.texto.length > 420 ? c.texto.slice(0, 420) + '…' : c.texto}`);
    if (local.generico || local.vazio) local.linhas = sabidas; else local.linhas.push(...sabidas);
    if (!local.fontes.some((f) => f.aba === 'agentes')) local.fontes.push({ rotulo: 'Cérebro', aba: 'agentes' }); local.fatos.push(`conhecimentos=${rel.length}`);
  }
  if (continuou && !rel.length) local.linhas.push('Sobre isso não tenho mais nada registrado. Posso chamar outro agente, ou você me ensina com "lembra que…".');
}


export async function conversar(o: Opcoes): Promise<Resposta> {
  const pergunta = o.pergunta.trim(); const estilo = o.estilo ?? 'amigavel'; const nome = (o.nome || 'Prumo').slice(0, 40); const historico = (o.historico ?? []).slice(-6);
  const perfil = tentarOuPadrao(() => lerPerfil(o.base), null); const pessoa = nomeParaChamar(perfil, o.base);
  const montar = (agente: AgenteChat, c: Coleta, modo: Resposta['modo'], extra: Partial<Resposta> & { rota?: Resposta['rota'] } = {}): Resposta => montarResposta(agente, c, modo, estilo, pessoa, extra);

  // 1) Conversas sobre a própria relação (como chamar, papel, ensinar, o que sabe): respondidas localmente, sempre.
  const meta = intencaoDePerfil(pergunta, historico, perfil, o.base) ?? intencaoDeAprender(pergunta, o.espacoId, o.agente, o.base) ?? intencaoDeSaber(pergunta, o.espacoId, o.agente, o.base);
  if (meta) {
    const a = agentesChat.find((x) => x.id === (meta.agente ?? 'orquestrador'))!; const novo = tentarOuPadrao(() => lerPerfil(o.base), perfil);
    return montar(a, { linhas: aplicarEstilo(meta.linhas, estilo === 'direto' ? 'amigavel' : estilo, nome, a, false, []), fontes: meta.fontes ?? [], fatos: [] }, 'LOCAL', { proximos: meta.proximos ?? [], acoes: meta.acoes ?? [], pendente: meta.pendente ?? null, pessoa: novo?.comoChamar ?? null });
  }

  // 2) Roteamento (com memória da sessão e vocabulário aprendido) e resposta local com dados reais.
  const aprendidos = tentarOuPadrao(() => pesosAprendidos(pergunta, o.base), {});
  // Administração: agentes desligados não respondem, a orquestração pode ser desligada e a IA externa também.
  const plataforma = regrasDosAgentes(o.base);
  const teste = o.contexto?.tipo === 'teste' ? responderSobreTeste(o.contexto, o.espacoId, o.base) : null;
  const r = teste ? { agente: teste.agente!, rota: [], continuou: false } : escolherAgente(pergunta, o.agente, { historico, aprendidos, desligados: plataforma.desligados });
  // 3) Orquestração: sem agente escolhido pela pessoa e com dois ou mais especialistas fortes, cada um responde uma etapa.
  const plano = !teste && !o.agente && !r.continuou && plataforma.orquestracao ? planejarOrquestracao(r.rota) : null;
  let orquestracao: Orquestracao | undefined; let avisoOrquestracao: string | undefined;
  let agente = r.agente; let local: Coleta;
  if (plano) {
    const feito = await orquestrar(plano.map((id) => agentesChat.find((a) => a.id === id)!), r.rota, pergunta, o.espacoId, o.base);
    agente = agentesChat.find((a) => a.id === 'orquestrador')!; local = feito.coleta; orquestracao = feito.registro;
    try { registrarOrquestracao(orquestracao, o.base); } catch { avisoOrquestracao = 'Não foi possível registrar a orquestração no Painel de atividades; a resposta foi preservada.'; }
  } else local = teste ?? await responderComDadosLocais(agente, pergunta, o.espacoId, o.base);
  juntarConhecimentos(o, agente, pergunta, historico, r.continuou, local);
  const proximos = proximosPassosSugeridos(agente.id, local.fatos, perfil?.papel ?? null, pergunta);
  const externaDesligada = (o.provedor ?? 'local') !== 'local' && !plataforma.iaExterna;
  const aviso = [avisoOrquestracao, externaDesligada ? 'A Administração desligou o uso de Claude Code e Codex nesta instalação; a resposta usou só os dados deste computador.' : null].filter(Boolean).join(' ');
  const comum = { rota: r.rota, continuou: r.continuou, proximos, ...(orquestracao ? { orquestracao } : {}), ...(aviso ? { aviso } : {}) };
  const provedor = externaDesligada ? 'local' : o.provedor ?? 'local'; const chave = pergunta + '|' + historico.length;
  const vestido = () => aplicarEstilo(local.linhas, estilo, nome, agente, !!o.primeira, local.fatos, pessoa, chave);
  if (provedor === 'local') return montar(agente, { ...local, linhas: vestido() }, 'LOCAL', comum);

  return consultarIaExterna({ o, agente, pergunta, local, estilo, nome, perfil, historico, comum, provedor, montar, vestido });
}
