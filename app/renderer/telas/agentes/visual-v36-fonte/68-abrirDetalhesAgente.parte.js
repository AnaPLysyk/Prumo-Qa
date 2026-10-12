/** Mostra detalhes e formulario de um agente. Parte visual de interfaces-v36.js; nao carregar separadamente. */
    function detail(x, isNew = false) {
      const pol = { ...s.configuracao.politicas }, esp = new Set(s.configuracao.especializacoes);
      const name = h('input', { id: 'v36-agent-name', value: x.nome, maxlength: 100, required: true, readonly: !x.preview, placeholder: tr('Ex.: Agente de regressão') });
      const desc = h('textarea', { id: 'v36-agent-description', rows: 3, maxlength: 4000, placeholder: tr('Quando o Prumo deve sugerir este agente') }, x.descricao || '');
      const goal = h('textarea', { id: 'v36-agent-goal', rows: 3, maxlength: 4000, required: true, placeholder: tr('Ex.: revisar a cobertura de um ticket autorizado') }, x.objetivo || '');
      const instructions = h('textarea', { id: 'v36-agent-instructions', rows: 6, maxlength: 4000, required: true, placeholder: tr('Responsabilidades, regras de decisão, restrições e formato esperado') }, x.instrucoes || '');
      const enabled = h('input', { type: 'checkbox', id: 'v36-agent-enabled', checked: esp.has(x.id), onchange: ev => { ev.target.checked ? esp.add(x.id) : esp.delete(x.id); sync(); } });
      const form = h('form', { class: 'v36-agent-form v36a-form', id: 'v36-agent-form' });
      const cancel = h('button', { type: 'button', id: 'v36-agent-cancel', 'aria-label': tr('Descartar alterações'), title: tr('Descartar alterações'), disabled: true, onclick: () => reset() }, '×');
      const save = h('button', { type: 'submit', id: 'v36-agent-save', 'aria-label': tr('Confirmar alterações'), title: tr('Confirmar alterações'), disabled: true }, '✓');
      const read = () => ({ version: 1, id: x.id, nome: name.value, descricao: desc.value, objetivo: goal.value, instrucoes: instructions.value });
      const baseline = JSON.stringify(read());
      function changed() { return x.preview ? JSON.stringify(read()) !== baseline : JSON.stringify(pol) !== JSON.stringify(s.configuracao.politicas) || esp.has(x.id) !== habilitada(x.id); }
      function sync() { cancel.disabled = save.disabled = !changed(); rodape.classList.toggle('alterado', changed()); }
      function reset() { if (x.preview) { name.value = x.nome; desc.value = x.descricao || ''; goal.value = x.objetivo || ''; instructions.value = x.instrucoes || ''; } else { detail(x); return; } sync(); }
      form.addEventListener('input', sync);
      form.addEventListener('submit', async ev => { ev.preventDefault(); if (!changed()) return;
        if (x.preview) { let data; try { data = validateDraft(read()); } catch (err) { avisar(err.message, true); return; }
          const d = h('dialog', { class: 'v36-dialog v36a-confirmar', 'aria-label': tr('Confirmar salvamento da prévia') }, h('div', { class: 'v36a-olho' }, tr('CONFIRMAR ALTERAÇÕES')), h('h2', {}, tr('Salvar prévia local?')), note(data.nome + ' · ' + previewNotice), h('div', { class: 'v36a-confirmar-acoes' }, button(tr('Cancelar'), () => d.close()), button(tr('Salvar prévia'), () => { const next = [...drafts.filter(a => a.id !== x.id), data]; if (next.length > 50) { avisar('Limite de 50 prévias por projeto.', true); return; } if (saveDrafts(next)) { const antes = linhasInstrucao(x.instrucoes); registrarMudanca(x.id, [...(data.nome !== x.nome || data.descricao !== (x.descricao || '') ? ['Identidade'] : []), ...(data.objetivo !== (x.objetivo || '') ? ['Objetivo'] : []), ...linhasInstrucao(data.instrucoes).map((l, i) => antes.includes(l) ? null : tr('Instrução {n}', { n: i + 1 })).filter(Boolean)]); d.close(); list(); } }, { class: 'acao primaria' }))); document.body.append(d); d.addEventListener('close', () => d.remove(), { once: true }); d.showModal();
        } else { save.disabled = cancel.disabled = true; const r = await chamar(() => api.agentesSalvar(e.id, [...esp], pol)); if (r && !r.canceled) { registrarMudanca(x.id, [...(esp.has(x.id) !== habilitada(x.id) ? ['Disponibilidade'] : []), ...s.matriz.filter(c => x.capacidades.includes(c.id) && (pol[c.id] ?? null) !== (s.configuracao.politicas[c.id] ?? null)).map(c => c.rotulo)]); avisar('Permissões salvas.'); mostrar('agentes'); } else sync(); }
      });
      const exportar = h('button', { type: 'button', class: 'v36a-quieto', onclick: () => { try { download('prumo-agente-' + x.id + '.json', JSON.stringify(x.preview ? validateDraft(read()) : { fonte: 'nucleo', especializacao: { id: x.id, rotulo: x.rotulo, skill: x.skill, capacidades: x.capacidades }, configuracao: s.configuracao }, null, 2)); } catch (err) { avisar('Exportação recusada: ' + err.message, true); } } }, tr('Exportar JSON'));
      const barra = h('div', { class: 'v36a-barra' }, h('button', { type: 'button', class: 'v36a-voltar', onclick: list }, '← ', tr('Agentes')), h('span', { class: 'v36a-fonte' }, x.preview ? tr('Prévia local · sem execução') : tr('Especialização do núcleo · políticas compartilhadas pelo projeto')), h('div', { class: 'v36a-barra-acoes' }));
      if (x.preview) { const file = h('input', { type: 'file', accept: '.json,application/json', id: 'v36-agent-import', class: 'v36-sr', onchange: async ev => { const f = ev.target.files[0]; if (!f) return; try { if (f.size > 32768) throw Error('Arquivo excede 32 KiB.'); const d = validateDraft(JSON.parse(await f.text())); name.value = d.nome; desc.value = d.descricao; goal.value = d.objetivo; instructions.value = d.instrucoes; sync(); avisar('Prévia importada. Revise e confirme antes de salvar.'); } catch (err) { avisar('Importação recusada: ' + err.message, true); } ev.target.value = ''; } });
        barra.lastChild.append(h('label', { class: 'v36a-quieto', title: tr('A importação só preenche o formulário; revise antes de salvar.') }, '↥ ', h('span', {}, tr('Importar prévia JSON')), file)); }
      barra.lastChild.append(exportar);
      const retrato = h('div', { class: 'v36a-retrato-robo' });
      const perfil = h('aside', { class: 'v36a-perfil' }, h('div', { class: 'v36a-perfil-retrato' }, retrato),
        h('div', { class: 'v36a-perfil-info' }, h('span', { class: 'v36a-olho' }, x.preview ? tr('PRÉVIA LOCAL') : tr('ESPECIALIZAÇÃO DO NÚCLEO')), h('h2', { 'data-i18n-ignore': '' }, x.nome || tr('Novo agente')),
          h('p', {}, x.preview ? tr('Prévia local · sem execução') : h('span', {}, x.skill, ' · ', ...resumoCaps(x).filter(Boolean).slice(0, 1))),
          h('button', { type: 'button', class: 'v36a-cerebro-btn', id: 'v36-brain-open', 'aria-label': tr('Abrir cérebro do agente'), title: tr('Explorar as conexões configuradas deste agente'), onclick: () => brain(x) }, iconeCerebro())));
      perfil.style.setProperty('--face-color', palette[x.index % 8]); neural(perfil, { pontos: 46, escuro: true });
      form.append(h('div', { class: 'v36a-form-topo' }, h('span', {}, isNew ? tr('Criar prévia de agente') : tr('Configuração do agente')), h('span', {}, tr('* Obrigatório'))));
      if (x.preview) form.append(note(previewNotice),
        secao('Identidade', 'Como o agente aparece na lista e como é identificado.', field(tr('Nome *'), name), field(tr('Descrição'), desc)),
        secao('Objetivo e instruções', 'O que fazer, como agir e o que caracteriza um resultado válido.', field(tr('Objetivo *'), goal), field(tr('Instruções *'), instructions)));
      else form.append(
        secao('Identidade', 'Especialização fixa do núcleo; nome e skill não são editáveis.', field(tr('Nome *'), name), field(tr('Skill configurada'), h('input', { value: x.skill, readonly: true }))),
        secao('Disponibilidade', 'Habilitar não inicia sessão nem execução; o cliente de IA decide quando usar.', h('label', { class: 'v36a-interruptor' }, enabled, h('span', { class: 'v36a-trilho', 'aria-hidden': 'true' }), h('span', {}, tr('Especialização habilitada')))),
        secao('Permissões', 'As políticas são compartilhadas pelo projeto e aplicadas pelo servidor MCP.', policyTable(pol, sync, x.capacidades)));
      const rodape = h('div', { class: 'v36-form-actions v36a-commit' }, cancel, save); form.append(rodape);
      body.replaceChildren(barra, h('div', { class: 'v36a-detalhe' }, perfil, form)); figuraRobo(retrato, x, 'perfil', perfil);
    }
    // O que mudou em cada agente desde o último salvamento (só neste computador), para destacar no Cérebro.
