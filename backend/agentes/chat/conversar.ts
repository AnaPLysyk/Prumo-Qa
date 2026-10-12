/** Atende uma pergunta do chat: entende intenções, escolhe o agente, responde localmente e, se autorizado, consulta Claude ou Codex. */
import { conhecimentosRelevantes } from '../banco/conhecimentosRelevantes.js';
import { lerPerfil } from '../banco/lerPerfil.js';
import { pesosAprendidos } from '../banco/pesosAprendidos.js';
import { registrarConhecimento } from '../banco/registrarConhecimento.js';
import { aplicarEstilo } from './aplicarEstilo.js';
import { argumentosDoProvedorDeIa } from './argumentosDoProvedorDeIa.js';
import { escolherAgente } from './escolherAgente.js';
import { intencaoDeAprender } from './intencaoDeAprender.js';
import { intencaoDePerfil } from './intencaoDePerfil.js';
import { intencaoDeSaber } from './intencaoDeSaber.js';
import { montarPrompt } from './montarPrompt.js';
import { proximosPassosSugeridos } from './proximosPassosSugeridos.js';
import { responderComDadosLocais } from './responderComDadosLocais.js';
import { responderSobreTeste } from './responderSobreTeste.js';
import { separarAprendizados } from './separarAprendizados.js';
import { Acao, Coleta, Opcoes, Resposta } from '../tipos/chat.js';
import { Conhecimento } from '../tipos/conhecimento.js';
import { montarResposta } from './montarResposta.js';
import { juntarConhecimentos } from './juntarConhecimentos.js';
import { AgenteChat, agentesChat } from '../tipos/persona.js';
import { tentarOuPadrao } from '../../compartilhado/erros/tentarOuPadrao.js';
import { mascarar } from '../../compartilhado/seguranca/mascarar.js';
import { obterEspaco } from '../../projetos/banco/obterEspaco.js';

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
  const agente = r.agente; const local = teste ?? await responderComDadosLocais(agente, pergunta, o.espacoId, o.base);
  juntarConhecimentos(o, agente, pergunta, historico, r.continuou, local);
  const proximos = proximosPassosSugeridos(agente.id, local.fatos, perfil?.papel ?? null, pergunta);
  const comum = { rota: r.rota, continuou: r.continuou, proximos };
  const provedor = o.provedor ?? 'local'; const chave = pergunta + '|' + historico.length;
  const vestido = () => aplicarEstilo(local.linhas, estilo, nome, agente, !!o.primeira, local.fatos, pessoa, chave);
  if (provedor === 'local') return montar(agente, { ...local, linhas: vestido() }, 'LOCAL', comum);

  // 3) IA externa: só com autorização registrada e executável encontrado; qualquer falha volta para a resposta local.
  const nomeP = provedor === 'claude' ? 'Claude Code' : 'Codex';
  const voltar = (aviso: string) => montar(agente, { ...local, linhas: vestido() }, 'LOCAL', { ...comum, aviso });
  if (!o.autorizados?.[provedor]) return voltar(`Delegação ao ${nomeP} não autorizada; resposta local.`);
  const exe = o.executavel?.(provedor); if (!exe || !o.executor) return voltar(`${nomeP} não encontrado neste computador; resposta local.`);
  let cwd: string | undefined; if (o.espacoId) { try { cwd = obterEspaco(o.espacoId, o.base).pastaLocal ?? undefined; } catch { cwd = undefined; } }
  const conhecimentos = tentarOuPadrao(() => conhecimentosRelevantes(o.espacoId, agente.id === 'orquestrador' ? null : agente.id, pergunta, 5, o.base), [] as Conhecimento[]).map((c) => ({ titulo: c.titulo, texto: c.texto }));
  try {
    const x = await o.executor(exe, argumentosDoProvedorDeIa(provedor, montarPrompt(agente, pergunta, local, estilo, nome, { perfil, historico, conhecimentos })), { timeoutMs: 120000, cwd });
    const { texto: limpo, aprendizados } = separarAprendizados(mascarar(x.saida)); const texto = limpo.trim().slice(0, 6000);
    if (x.codigo !== 0 || !texto) return voltar(`${nomeP} não respondeu (código ${x.codigo ?? 'tempo esgotado'}); resposta local.`);
    const acoes: Acao[] = []; let sugeridos = 0; let naoRegistrados = 0;
    for (const a of aprendizados) { try { const { item, duplicado } = registrarConhecimento({ espacoId: o.espacoId, agente: agente.id === 'orquestrador' ? null : agente.id, tipo: 'fato', titulo: a.slice(0, 80), texto: a, origem: 'IA', cliente: provedor }, o.base);
      if (!duplicado && item.estado === 'RASCUNHO') { sugeridos++; acoes.push({ tipo: 'aprovar_conhecimento', id: item.id, rotulo: 'Aprovar: ' + item.titulo.slice(0, 40) }, { tipo: 'descartar_conhecimento', id: item.id, rotulo: 'Descartar' }); } } catch { naoRegistrados++; } }
    const linhas = texto.split(/\n{2,}/).map((l) => l.trim()).filter(Boolean).slice(0, 12);
    if (sugeridos) linhas.push(`${nomeP} sugeriu ${sugeridos} aprendizado(s); ficam como rascunho até você decidir.`);
    return montar(agente, { ...local, linhas }, provedor === 'claude' ? 'CLAUDE' : 'CODEX', { ...comum, acoes, ...(naoRegistrados ? { aviso: `${naoRegistrados} aprendizado(s) não foram registrados (limite ou armazenamento indisponível). A resposta da IA foi preservada.` } : {}) });
  } catch { return voltar('Falha ao chamar a IA externa; resposta local.'); }
}
