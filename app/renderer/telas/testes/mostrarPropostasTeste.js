'use strict';
/** Acrescenta propostas e suítes à tela de Testes. */
abas.testes = async (el) => {
  await testesBase(el); const e = semProjetoServico(el, 'qase'); if (!e) return; const perm = await escritaDoProjeto(e); const on = !!perm.qase;
  const slot = h('div', { id: 'pr-slot' }); const recarregar = () => mostrar('testes');
  el.append(h('h2', {}, 'Propostas de casos e bugs'), h('p', { class: 'suave' }, 'Rascunhos: nada sai sem a sua revisão.'), avisoEscrita('qase', on),
    botao('Nova proposta de caso', () => slot.replaceChildren(formularioProposta(e, null, () => { slot.replaceChildren(); recarregar(); })), 'pr-nova'), slot);
  const ps = await chamar(() => api.propostas(e.id)); const lista = (ps || []).filter(p => p.estado !== 'DESCARTADA');
  if (!lista.length) el.append(h('div', { class: 'vazio', id: 'pr-vazia' }, 'Nenhuma proposta ainda.')); for (const p of lista) el.append(cartaoProposta(e, p, perm, recarregar));
  const suiteT = campoPlataforma('Título da suite', { id: 'su-titulo', maxlength: 255 }); const edId = campoPlataforma('ID do caso a editar', { id: 'ed-caso', type: 'number' }); const edT = campoPlataforma('Novo título', { id: 'ed-titulo', maxlength: 255 }); const asId = campoPlataforma('ID do caso', { id: 'as-caso', type: 'number' }); const asT = campoPlataforma('Ticket Jira', { id: 'as-ticket', maxlength: 40 }); const saida = h('div', { id: 'ts-saida' });
  el.append(h('h2', {}, 'Suites, edição e associação (operações diretas)'),  h('div', { class: 'formulario' },
    suiteT.no, botao('Criar suite…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'qase.criar_suite', { titulo: suiteT.input.value })) || ''); }, 'su-criar'),
    edId.no, edT.no, botao('Editar caso…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'qase.editar_caso', { casoId: Number(edId.input.value), titulo: edT.input.value })) || ''); }, 'ed-salvar'),
    asId.no, asT.no, botao('Associar caso ao ticket…', async () => { saida.replaceChildren(painelResultado(await executarOperacao(e, 'qase.associar_ticket', { casoId: Number(asId.input.value), ticket: asT.input.value.trim().toUpperCase() })) || ''); }, 'as-salvar'), saida));
};

