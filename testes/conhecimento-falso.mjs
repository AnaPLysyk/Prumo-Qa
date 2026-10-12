// Substitui a persistência por memória: nenhum teste abre SQLite ou dados da pessoa.
import { randomUUID } from 'node:crypto';
import * as real from '../dist/conhecimento.js?sem-persistencia';

const perfis = new Map();
const itens = [];
const vocabulario = [];
const atendimentos = [];
export const falhasConhecimento = { registrar: null };
const lerPerfil = (base) => perfis.get(base) ?? { comoChamar: null, papel: null, atualizadoEm: null };
const listarConhecimentos = (f) => itens.filter(c => (!c.espacoId || c.espacoId === f.espacoId) && (!f.agente || c.agente === f.agente || (!f.somenteDoAgente && !c.agente)) && (!f.estados?.length || f.estados.includes(c.estado)) && (!f.busca || real.norm(c.titulo + ' ' + c.texto).includes(real.norm(f.busca)))).slice(0, f.limite ?? 200);
const registrarConhecimento = (n) => {
  if (falhasConhecimento.registrar) throw new Error(falhasConhecimento.registrar);
  const igual = itens.find(c => c.estado !== 'DESCARTADO' && c.espacoId === n.espacoId && c.agente === n.agente && c.texto === n.texto);
  if (igual) return { item: igual, duplicado: true };
  const item = { ...n, id: randomUUID(), estado: n.origem === 'PESSOA' ? 'APROVADO' : 'RASCUNHO', criadoEm: new Date().toISOString(), decididoEm: null, cliente: n.cliente ?? null };
  itens.push(item); return { item, duplicado: false };
};
export const memoria = {
  ...real, lerPerfil, listarConhecimentos, registrarConhecimento,
  salvarPerfil: (a, base) => { const p = { ...lerPerfil(base), ...a, atualizadoEm: new Date().toISOString() }; if (a.comoChamar) p.comoChamar = real.normalizarNome(a.comoChamar); perfis.set(base, p); return p; },
  decidirConhecimento: (id, estado) => { const c = itens.find(x => x.id === id); if (!c) throw new Error('KNOWLEDGE_NOT_FOUND'); c.estado = estado; return c; },
  apagarConhecimento: (id) => { const i = itens.findIndex(x => x.id === id); if (i < 0) throw new Error('KNOWLEDGE_NOT_FOUND'); itens.splice(i, 1); return { apagado: true }; },
  relevantes: (espacoId, agente, pergunta, limite = 2) => listarConhecimentos({ espacoId, agente, estados: ['APROVADO'] }).filter(c => real.termos(pergunta).some(t => real.norm(c.titulo + ' ' + c.texto).includes(t))).slice(0, limite),
  aprenderTermos: (agente, frase) => { const termos = real.termos(frase); for (const termo of termos) { const v = vocabulario.find(x => x.agente === agente && x.termo === termo); if (v) v.peso++; else vocabulario.push({ agente, termo, peso: 1 }); } return { termos }; },
  pesosAprendidos: frase => { const r = {}; for (const v of vocabulario.filter(x => real.termos(frase).includes(x.termo))) r[v.agente] = (r[v.agente] ?? 0) + v.peso; return r; },
  vocabularioDoAgente: agente => vocabulario.filter(x => x.agente === agente),
  esquecerTermo: (agente, termo) => { const i = vocabulario.findIndex(x => x.agente === agente && x.termo === termo); if (i >= 0) vocabulario.splice(i, 1); return { apagado: i >= 0 }; },
  registrarAtendimento: a => { atendimentos.push({ ...a, id: atendimentos.length + 1, em: new Date().toISOString(), avaliacao: null }); return atendimentos.length; },
  avaliarAtendimento: (id, avaliacao) => { const a = atendimentos.find(x => x.id === id); if (!a) throw new Error('ATTENDANCE_NOT_FOUND'); a.avaliacao = avaliacao; return { avaliado: true }; },
  listarAtendimentos: (espacoId, agente, limite = 40) => atendimentos.filter(x => x.espacoId === espacoId && (!agente || x.agente === agente)).slice(-limite).reverse(),
  estadoConhecimento: (espacoId, base) => ({ arquivo: '(memória do runner)', bytes: 0, esquema: 1, tabelas: ['perfil','agentes','conhecimentos','vocabulario','atendimentos'], vistas: [], perfil: lerPerfil(base), porAgente: Object.fromEntries(['orquestrador','qa-geral','requisitos','playwright','api-rest','acessibilidade','investigacao-bugs','regressao','monitoramento'].map(agente => [agente, { aprovados: listarConhecimentos({espacoId, agente, estados:['APROVADO']}).length, rascunhos: listarConhecimentos({espacoId, agente, estados:['RASCUNHO']}).length, atendimentos: atendimentos.filter(x => x.espacoId === espacoId && x.agente === agente).length, uteis: 0, naoUteis: 0 }])), gerais: itens.filter(x => !x.espacoId && !x.agente && x.estado === 'APROVADO').length }),
  conhecimentoParaIA: (espacoId, base) => ({ perfil: lerPerfil(base), itens: listarConhecimentos({ espacoId, estados: ['APROVADO'] }) })
};

