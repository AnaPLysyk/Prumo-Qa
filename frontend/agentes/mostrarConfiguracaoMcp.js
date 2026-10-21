'use strict';
/** MCP por cliente externo: Codex e Claude com diagnóstico; Copilot e Gemini com configuração revisável. */
async function mostrarConfiguracaoMcp(el) {
    el.append(h('h1', {}, 'Agentes e MCP'), h('p', { class: 'suave' }, 'O cliente de IA inicia o servidor MCP do projeto. Para consultar dados da sua conta, o Prumo precisa estar aberto com a sessão autenticada: ao sair da conta ou fechar o aplicativo, o acesso é revogado. A configuração abaixo é apenas uma proposta; nada é alterado sem sua confirmação.'));
    if (!estado.root) return el.append(semProjeto());
    el.append(h('ol', { class: 'suave' }, h('li', {}, 'Escolha Codex, Claude Code, Copilot ou Gemini. No chat do Prumo, a conexão é preparada por sessão; para falar diretamente no cliente, use o comando do cliente abaixo.'), h('li', {}, 'Revise e execute apenas o comando do cliente escolhido. Depois, feche e reabra esse cliente.'), h('li', {}, 'Em Codex ou Claude, "Testar integração" verifica o servidor pelo SDK. Isso não prova que a IA usou a ferramenta.'), h('li', {}, 'No cliente, peça "consulte o contexto do projeto" e confirme o uso em "Última chamada observada".')));
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
    // O chat do Prumo conecta o MCP automaticamente. Aqui a pessoa configura o OUTRO caminho:
    // conversar diretamente pelo Copilot ou Gemini, sem abrir o chat do Prumo.
    const plano = r[0];
    if (plano?.configuration) {
      const config = plano.configuration;
      const lista = 'contexto_projeto,revisar_cobertura,consultar_evidencias,listar_politicas,perguntar_ao_orquestrador';
      const windows = /Win/i.test(navigator.platform || '');
      const aspas = (valor) => windows ? "'" + String(valor).replaceAll("'", "''") + "'" : "'" + String(valor).replaceAll("'", "'\\''") + "'";
      const comando = (argumentos) => (windows ? '& ' : '') + argumentos.map(aspas).join(' ');
      const ambiente = Object.entries(config.env || {});
      const servidores = [
        { cliente: 'GitHub Copilot', cli: windows ? 'copilot.cmd' : 'copilot', args: ['mcp', 'add', '--tools', lista, ...ambiente.flatMap(([k, v]) => ['--env', `${k}=${v}`]), plano.name, '--', config.command, ...config.args], verificar: 'copilot mcp list' },
        { cliente: 'Gemini CLI', cli: windows ? 'gemini.cmd' : 'gemini', args: ['mcp', 'add', '--scope', 'user', '--include-tools', lista, ...ambiente.flatMap(([k, v]) => ['--env', `${k}=${v}`]), plano.name, config.command, ...config.args], verificar: 'gemini mcp list' }
      ];
      el.append(h('h2', {}, 'Outros clientes MCP'), h('p', { class: 'suave' }, 'Estes comandos conectam o MCP do projeto ao chat do próprio cliente, fora do Prumo. Revise antes de executar: nada é instalado ou registrado automaticamente. Para o chat do Início, basta autorizar a IA em Configurações > Assistente.'));
      for (const item of servidores) el.append(h('h3', {}, item.cliente),
        h('p', {}, '1. Faça login no cliente. 2. Execute o comando abaixo no terminal. 3. Feche e reabra o cliente. 4. Verifique com ', h('code', {}, item.verificar), '.'),
        h('pre', {}, comando([item.cli, ...item.args])),
        h('p', { class: 'suave' }, 'Ferramentas expostas pelo cliente: somente consultas. Uma configuração registrada não comprova uso: peça uma consulta real e confira a última chamada observada no Prumo.'));
    }
}
