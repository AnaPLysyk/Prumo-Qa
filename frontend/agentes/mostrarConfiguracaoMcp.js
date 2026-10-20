'use strict';
/** Agentes: configuração e testes do cliente MCP (Codex/Claude), independente do login de contas. */
async function mostrarConfiguracaoMcp(el) {
    el.append(h('h1', {}, 'Agentes e MCP'), h('p', { class: 'suave' }, 'O servidor MCP é iniciado pelo próprio cliente de IA e continua funcionando mesmo com esta janela fechada. A configuração abaixo é uma proposta: nada é alterado sem sua confirmação.'));
    if (!estado.root) return el.append(semProjeto());
    el.append(h('ol', { class: 'suave' }, h('li', {}, 'Escolha o cliente de IA que você usa (Codex ou Claude Code) e adicione a configuração do Prumo a ele.'), h('li', {}, 'Feche e reabra o cliente de IA para que ele leia a configuração.'), h('li', {}, 'Volte aqui e clique em "Testar integração" para confirmar que o servidor do Prumo responde.'), h('li', {}, 'No cliente, peça ao agente para usar o Prumo (por exemplo: "consulte o contexto do projeto"). A chamada aparece em "Última chamada observada".')));
    const r = await chamar(() => api.conexoes(estado.root)); if (!r) return;
    for (const c of r) {
      const diagnostico = h('div', { 'aria-live': 'polite' });
      const mostrar = (d) => diagnostico.replaceChildren(...[h('p', {}, 'Estado: ', selo(d.state), ' ', h('span', { class: 'suave' }, '· Projeto: ', d.project)),
        h('p', {}, 'Último teste de protocolo (SDK): ', d.lastProtocol ? `${hora(d.lastProtocol.at)} · ${d.lastProtocol.state} · ${ms(d.lastProtocol.durationMs)}${d.protocolCurrent ? '' : ' · escopo anterior'}` : 'não executado'),
        h('p', {}, 'Última chamada observada do cliente (identidade declarada): ', d.lastObserved ? `${hora(d.lastObserved.at)} · ${d.lastObserved.tool} · ${ms(d.lastObserved.durationMs)}` : 'nenhuma'),
        h('p', {}, 'Ferramentas utilizadas pelo cliente: ', d.toolsUsed.join(', ') || 'nenhuma'),
        d.problems ? h('p', { class: 'nota erro' }, 'Há registros inválidos: ', String(d.problems)) : null,
        h('details', {}, h('summary', {}, 'Detalhes técnicos'),
          h('p', {}, 'Configuração: ', d.inspection?.code || 'diagnóstico indisponível', d.lastProtocol ? ' · ' + d.lastProtocol.code : ''),
          d.lastProtocol ? h('p', {}, 'Evidência SDK: ', h('code', {}, d.lastProtocol.id), ' · handshake: ', String(d.lastProtocol.handshake), ' · ferramentas: ', d.lastProtocol.tools.join(', '), ' · leitura: ', String(d.lastProtocol.read)) : null,
          d.lastObserved ? h('p', {}, 'Identificador da chamada: ', h('code', {}, d.lastObserved.id)) : null,
          d.lastObserved?.contextReferences.length ? h('pre', {}, JSON.stringify(d.lastObserved.contextReferences, null, 2)) : null,
          h('p', { class: 'suave' }, d.notice))].filter(Boolean));
      mostrar(c);
      el.append(h('h2', {}, c.client === 'codex' ? 'Codex' : 'Claude Code', ' ', h('span', { class: 'suave' }, c.installed ? '(cliente localizado)' : '(cliente não localizado)')),
        h('h3', {}, '1. Adicionar a configuração'),
        c.automatic ? h('button', { class: 'acao', onclick: async () => { const x = await chamar(() => api.conectar(estado.root, 'codex')); if (x) avisar(x.configured ? 'Configuração adicionada. Reabra o cliente.' : x.reason, !x.configured); } }, 'Adicionar ao Codex…')
          : h('p', { class: 'suave' }, 'Copie o comando abaixo e execute no terminal (PowerShell no Windows) depois de revisar o destino.'),
        h('details', {}, h('summary', {}, 'Ver o que será configurado'), h('p', { class: 'suave' }, 'Destino da configuração: ', h('code', {}, c.destination)), h('pre', {}, c.command)),
        h('h3', {}, '2. Testar e acompanhar'),
        h('button', { class: 'acao', onclick: async (e) => { const b=e.currentTarget; b.disabled=true; try { const x=await chamar(()=>api.testarIntegracao(estado.root,c.client)); if(x)mostrar(x); } finally { b.disabled=false; } } }, `Testar integração ${c.client}`),
        diagnostico);
    }
}
