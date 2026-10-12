'use strict';
/** Mostra o estado e as permissões de escrita externa por conexão. */
// ---------------- Conexões: escrita externa ----------------
const conexoesBase = abas.conexoes;
abas.conexoes = async (el) => {
  await conexoesBase(el); const e = estado.espaco; if (!e) return; const perm = await escritaDoProjeto(e);
  el.append(h('h2', {}, 'Escrita externa neste projeto'), h('p', { class: 'suave' }, 'Escrita desligada por padrão. Cada operação pede confirmação.'),
    h('div', { id: 'escrita-servicos' }, ['jira', 'qase', 'github'].map(sv => h('div', { class: 'nota', 'data-escrita': sv }, h('strong', {}, nomeServ[sv]), ' ', perm[sv] ? selo('VALIDO') : null, ' ', perm[sv] ? 'escrita habilitada' : 'somente leitura', ' ', botao(perm[sv] ? 'Desabilitar escrita' : 'Habilitar escrita…', async () => { const r = await chamar(() => api.escritaHabilitar(e.id, sv, !perm[sv])); if (r && !r.canceled) mostrar('conexoes'); }, 'escrita-' + sv)))));
  const ops = await chamar(() => api.operacoes(e.id, 15)); if (ops?.length) el.append(h('h2', {}, 'Operações externas recentes'), h('ul', { id: 'conexoes-operacoes' }, ops.map(o => h('li', {}, seloOp(o.estado), ' ', o.resumo, ' · ', hora(o.atualizadoEm)))));
};

