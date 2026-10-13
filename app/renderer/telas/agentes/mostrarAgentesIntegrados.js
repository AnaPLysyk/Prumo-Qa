'use strict';
/** Acrescenta recursos integrados à tela de Agentes. */
// ---------------- Agentes ----------------
const agentesLegado = abas.agentes;
abas.agentes = async (el) => {
  el.append(h('h1', {}, 'Agentes'));
  const e = estado.espaco; if (e) {
    const s = await chamar(() => api.agentesEstado(e.id)); if (s) {
      const esp = new Set(s.configuracao.especializacoes); const pol = { ...s.configuracao.politicas };
      el.append(h('div', { class: 'nota', id: 'ag-aviso' }, s.configuracao.padrao ? 'Configuração padrão: todas as especializações habilitadas.' : 'Configuração personalizada por você.', ' Propostas feitas por IA neste projeto: ', h('strong', {}, String(s.propostasIA)), '.'),
        h('h2', {}, 'Profissões e especializações'), h('div', { id: 'ag-especializacoes' }, s.especializacoes.map(x => h('label', { class: 'opcao linha', title: x.skill }, h('input', { type: 'checkbox', 'data-esp': x.id, checked: esp.has(x.id), onchange: (ev) => (ev.target.checked ? esp.add(x.id) : esp.delete(x.id)) }), h('span', {}, h('strong', {}, tr(x.profissao)), h('div', { class: 'suave' }, tr(x.especialidade)), h('div', { class: 'suave' }, x.rotulo), h('div', { class: 'suave' }, tr('Capacidades:') + ' ' + x.capacidades.map(id => tr(s.matriz.find(c => c.id === id)?.rotulo ?? id)).join(', ')))))),
        h('h2', {}, 'Permissões efetivas'), h('p', { class: 'suave' }, 'A especialização define capacidades; a política do projeto determina a permissão efetiva. Execução e publicação mantêm seus controles de autorização.'), h('div', { class: 'rolagem' }, h('table', { id: 'ag-matriz' }, h('thead', {}, h('tr', {}, ['Capacidade', 'Permissão efetiva', 'Política configurada', 'Por quê'].map(t => h('th', {}, t)))), h('tbody', {}, s.matriz.map(c => h('tr', { 'data-cap': c.id }, h('td', {}, c.rotulo, c.ferramenta ? h('div', { class: 'suave' }, c.ferramenta) : null), h('td', {}, selo(c.estado)),
          h('td', {}, c.editavel.length ? h('select', { 'data-pol': c.id, onchange: (ev) => { pol[c.id] = ev.target.value; } }, c.editavel.map(v => h('option', { value: v, selected: (pol[c.id] ?? c.editavel[0]) === v }, v === 'BLOQUEADO' ? 'Bloquear' : v === 'EXIGE_AUTORIZACAO' ? 'Permitir com autorização' : 'Permitir'))) : 'Somente pessoa'), h('td', {}, c.motivo)))))),
        botao('Salvar permissões…', async () => { const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { avisar('Permissões salvas.'); mostrar('agentes'); } }, 'ag-salvar'), h('h2', {}, 'Conexão com Claude e Codex'));
    }
  } else el.append(h('div', { class: 'nota' }, 'Selecione um projeto para configurar permissões.'));
  await agentesLegado(el);
};

