'use strict';
/** Reúne controles comuns para consultar e executar operações externas com confirmação. */
const area = (rotulo, ...f) => h('div', { class: 'campo' }, h('span', {}, rotulo), ...f);
const campoTexto = (rotulo, id, attrs = {}) => { const input = h('textarea', { id, rows: attrs.rows || 3, maxlength: attrs.maxlength || 4000 }); if (attrs.value) input.value = attrs.value; return { input, no: h('label', { class: 'campo' }, rotulo, input) }; };
const selecaoSimples = (id, opcoes, atual) => h('select', { id }, opcoes.map(([v, t]) => h('option', { value: v, selected: v === atual }, t)));
const seloOp = (s) => selo(s === 'CONFIRMADA' ? 'VALIDADO' : s === 'ENVIADA' ? 'PENDENTE' : s === 'BLOQUEADA' ? 'BLOCKED' : s === 'FALHA' ? 'ERRO' : s);
const nomeServ = { jira: 'Jira', qase: 'Qase', github: 'GitHub' };

/** Estado da habilitação de escrita por serviço no projeto selecionado. */
async function escritaDoProjeto(e) { const r = await chamar(() => api.escritaEstado(e.id)); const m = {}; for (const s of r?.servicos || []) m[s.servico] = s.escrita; return m; }
const vazio = () => document.createDocumentFragment();
const avisoEscrita = (servico, habilitada) => (habilitada ? vazio() : h('div', { class: 'nota', 'data-escrita-desligada': servico }, 'Escrita no ' + nomeServ[servico] + ' desligada. Habilite em Conexões.'));
/** Executa uma operação externa: a janela só pede; o principal confirma de forma nativa, executa e reconcilia. */
async function executarOperacao(e, operacao, parametros, anexo) {
  const r = await chamar(() => api.operacaoExecutar(e.id, operacao, parametros, anexo)); if (!r || r.canceled) return null;
  if (r.estado === 'CONFIRMADA') avisar(r.reutilizada ? 'Operação já concluída antes; nada foi duplicado.' : 'Operação concluída e confirmada no serviço.');
  else if (r.estado === 'BLOQUEADA') avisar('Operação bloqueada: ' + (r.erro || ''), true);
  else avisar('Operação não confirmada (' + r.estado + (r.erro ? ' · ' + r.erro : '') + '). Pode tentar de novo sem duplicar.', true);
  return r;
}
const linkRemoto = (r) => (r?.remoto ? [(r.remoto.chave || r.remoto.id || ''), r.remoto.url ? ' · ' + r.remoto.url : ''].join('') : '');
function painelResultado(r) { return r ? h('div', { class: 'nota', 'data-resultado-operacao': r.estado }, seloOp(r.estado), ' ', r.resumo, linkRemoto(r) ? h('div', { class: 'suave' }, linkRemoto(r)) : null, r.erro ? h('div', { class: 'suave' }, r.erro) : null) : null; }
const semProjetoServico = (el, servico) => { const e = estado.espaco; if (!e) { el.append(faltaEspaco()); return null; } if (!e.vinculos.some(v => v.servico === servico)) return null; return e; };

