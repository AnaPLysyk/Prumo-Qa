'use strict';
// Camada de apresentação. Não calcula métricas nem classifica resultados: só exibe o que o núcleo devolve.
// Todo texto entra no DOM por textContent (nunca innerHTML).
const api = window.prumo;
const $ = (s) => document.querySelector(s);
const estado = { aba: 'projetos', root: null, timer: null, jobId: undefined };

function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) el.append(f.nodeType ? f : document.createTextNode(String(f)));
  return el;
}
const selo = (s) => h('span', { class: 'estado ' + s }, s.replaceAll('_', ' '));
const hora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');
const ms = (n) => (n === null || n === undefined ? 'indisponível' : Math.round(n * 10) / 10 + ' ms');

function avisar(msg, erro) {
  const el = $('#aviso'); el.textContent = msg; el.className = erro ? 'erro' : ''; el.hidden = false;
  clearTimeout(avisar.t); avisar.t = setTimeout(() => { el.hidden = true; }, erro ? 8000 : 4000);
}
/** Chamada ao núcleo; erros viram aviso, nunca exceção solta. */
async function chamar(fn) {
  const r = await fn();
  if (!r.ok) { avisar(r.error, true); return null; }
  return r.data;
}
function semProjeto() {
  return h('div', { class: 'vazio' }, 'Nenhum projeto selecionado. Em ', h('strong', {}, 'Projetos'), ', vincule uma pasta com qa.project.json ou adicione o projeto de demonstração.');
}

function diagnostico(s) {
  return h('div', { class: 'nota' }, h('strong', {}, 'Não vinculado: '), selo(s.state), ' ', s.message, h('div', { class: 'suave' }, h('code', {}, s.root)), s.instructions ? h('p', {}, s.instructions) : null);
}

const abas = {
  async projetos(el) {
    el.append(h('h1', {}, 'Projetos'), h('p', { class: 'suave' }, 'Somente pastas que você vincula são lidas. O Prumo não cria nem altera arquivos dos projetos.'));
    const caixa = h('div', { id: 'diagnostico' });
    el.append(h('div', { class: 'barra' },
      h('button', { class: 'acao primaria', onclick: async () => {
        const r = await chamar(api.escolherProjeto); if (!r || r.canceled) return;
        if (r.linked) { estado.root = r.situation.root; salvarRaiz(); avisar('Projeto vinculado.'); mostrar('projetos'); return; }
        caixa.replaceChildren(diagnostico(r.situation));
      } }, 'Vincular pasta…'),
      h('button', { class: 'acao', onclick: async () => {
        const r = await chamar(api.adicionarDemo); if (!r) return;
        if (r.linked) { estado.root = r.situation.root; salvarRaiz(); mostrar('projetos'); } else caixa.replaceChildren(diagnostico(r.situation));
      } }, 'Adicionar projeto de demonstração')), caixa);
    const lista = await chamar(api.projetos); if (!lista) return;
    if (!lista.length) { el.append(h('div', { class: 'vazio' }, 'Nenhum projeto vinculado ainda.')); return; }
    el.append(h('table', {}, h('thead', {}, h('tr', {}, ['Projeto', 'Situação', 'Capacidades', 'Pasta', ''].map((t) => h('th', {}, t)))),
      h('tbody', {}, lista.map((p) => h('tr', {},
        h('td', {}, h('strong', {}, p.name || p.id || '—'), h('div', { class: 'suave' }, p.id || '')),
        h('td', {}, selo(p.state), p.readOnly ? h('div', { class: 'suave' }, 'somente leitura') : null, p.state !== 'INTEGRADO' ? h('div', { class: 'suave' }, p.message) : null),
        h('td', {}, (p.capabilities || []).join(', ') || '—'),
        h('td', {}, h('code', {}, p.root)),
        h('td', {}, p.root === estado.root ? h('span', { class: 'suave' }, 'selecionado') : h('button', { class: 'acao', onclick: () => { estado.root = p.root; salvarRaiz(); mostrar('projetos'); } }, 'Selecionar'),
          ' ', h('button', { class: 'acao', title: 'Remove só o vínculo; arquivos e histórico permanecem', onclick: async () => { await chamar(() => api.desvincular(p.root)); if (estado.root === p.root) estado.root = null; salvarRaiz(); mostrar('projetos'); } }, 'Desvincular')))))));
  },

  async metricas(el) {
    el.append(h('h1', {}, 'Métricas'));
    if (!estado.root) return el.append(semProjeto());
    const v = await chamar(() => api.visao(estado.root)); if (!v) return;
    const m = v.metrics;
    if (!m.complete) el.append(h('div', { class: 'nota' }, 'Histórico parcial: ' + m.problems.length + ' registro(s) inválido(s) ou truncado(s) foram excluídos; os números abaixo são parciais.'));
    const cel = (n, rot) => h('div', {}, h('b', {}, String(n)), h('span', {}, rot));
    el.append(h('p', { class: 'suave' }, 'Calculadas a partir das operações registradas pelo Prumo neste computador.'),
      h('div', { class: 'grade' }, cel(m.totalOperations, 'interações registradas'), cel(m.mcpCalls, 'chamadas via MCP'), cel(m.coverageReviews, 'revisões de cobertura'), cel(m.contextAnalyses, 'análises de contexto'),
        cel(m.findings, 'achados'), cel(m.recommendations, 'recomendações'), cel(m.gaps, 'lacunas identificadas'), cel(m.candidateRedundancies, 'redundâncias candidatas'),
        cel(m.executionsRequested, 'execuções solicitadas'), cel(m.executions.PASS, 'PASS'), cel(m.executions.FAIL, 'FAIL'), cel(m.executions.BLOCKED, 'BLOCKED'), cel(m.executions.NOT_RUN, 'NOT_RUN'),
        cel(m.errors, 'erros'), cel(m.unfinished, 'sem término observado')),
      h('p', {}, 'Última atividade: ', h('strong', {}, hora(m.lastActivity)), ' · Duração média: ', h('strong', {}, ms(m.averageDurationMs))),
      h('p', { class: 'suave' }, 'Tokens e custos: ' + m.providerMetrics + '. Alterações aplicadas pela IA: não observadas pelo Prumo.'),
      h('p', { class: 'suave' }, 'Última chamada MCP de: ' + (v.lastMcpClient || 'nenhum cliente') + ' (identidade declarada pelo cliente). ' + v.connection),
      h('p', { class: 'suave' }, 'Dados em: ', h('code', {}, v.directory)));
  },

  async logs(el) {
    el.append(h('h1', {}, 'Logs'));
    if (!estado.root) return el.append(semProjeto());
    const f = estado.filtroLogs || (estado.filtroLogs = {});
    const sel = (id, rot, opcoes, chave) => h('label', {}, rot, h('select', { id, onchange: (e) => { f[chave] = e.target.value || undefined; carregar(); } },
      h('option', { value: '' }, 'Todos'), opcoes.map((o) => h('option', { value: o, selected: f[chave] === o }, o))));
    const data = (id, rot, chave) => h('label', {}, rot, h('input', { id, type: 'datetime-local', value: f['_' + chave] || '', onchange: (e) => { f['_' + chave] = e.target.value; f[chave] = e.target.value ? new Date(e.target.value).toISOString() : undefined; carregar(); } }));
    const acomp = h('input', { type: 'checkbox', id: 'acompanhar', onchange: (e) => { clearInterval(estado.timer); if (e.target.checked) estado.timer = setInterval(carregar, 2000); } });
    const corpo = h('div', {}); const diag = h('div', {});
    el.append(h('div', { class: 'barra' },
      sel('f-tool', 'Operação', ['contexto_projeto', 'revisar_cobertura', 'executar_validacao', 'consultar_evidencias'], 'tool'),
      sel('f-state', 'Estado', ['STARTED', 'OK', 'NOT_VERIFIED', 'PASS', 'FAIL', 'BLOCKED', 'NOT_RUN', 'ERROR'], 'state'),
      data('f-since', 'Desde', 'since'), data('f-until', 'Até', 'until'),
      h('button', { class: 'acao', onclick: () => carregar() }, 'Atualizar'),
      h('label', { class: 'linha' }, acomp, 'Acompanhar novos eventos'),
      h('button', { class: 'acao', onclick: async () => { const r = await chamar(() => api.exportarLogs(estado.root)); if (r && r.exported) avisar('Logs exportados.'); } }, 'Exportar…'),
      h('button', { class: 'acao', id: 'ver-diagnostico', onclick: async () => {
        const r = await chamar(api.diagnostico); if (!r) return;
        diag.replaceChildren(h('h2', {}, 'Diagnóstico da interface'), h('p', { class: 'suave' }, 'Chamadas da própria janela: somente canal, estado, duração, código e correlação; nunca argumentos. Fica fora das métricas de QA.'),
          r.events.length ? h('table', {}, h('thead', {}, h('tr', {}, ['Horário', 'Canal', 'Estado', 'Duração', 'Código'].map((t) => h('th', {}, t)))),
            h('tbody', {}, r.events.slice().reverse().map((e) => h('tr', {}, h('td', {}, hora(e.at)), h('td', {}, h('code', {}, e.channel)), h('td', {}, selo(e.state)), h('td', { class: 'num' }, ms(e.durationMs)), h('td', {}, e.code || ''))))) : h('div', { class: 'vazio' }, 'Nenhum diagnóstico registrado. Consultas frequentes só aparecem quando falham.'));
      } }, 'Diagnóstico da interface')), corpo, diag);
    async function carregar() {
      if (estado.aba !== 'logs') return;
      const filtro = { tool: f.tool, state: f.state, since: f.since, until: f.until };
      const r = await chamar(() => api.logs(estado.root, filtro)); if (!r) return;
      const filhos = [];
      if (!r.complete) filhos.push(h('div', { class: 'nota' }, 'Há registros inválidos ou truncados no histórico; eles foram excluídos desta lista.'));
      filhos.push(r.events.length ? h('table', {}, h('thead', {}, h('tr', {}, ['Horário', 'Fase', 'Ferramenta', 'Origem', 'Resultado', 'Duração', 'Diagnóstico'].map((t) => h('th', {}, t)))),
        h('tbody', {}, r.events.slice().reverse().map((e) => h('tr', {}, h('td', {}, hora(e.at)), h('td', {}, e.phase === 'start' ? 'início' : 'término'), h('td', {}, e.tool),
          h('td', {}, e.origin + '/' + e.client), h('td', {}, selo(e.state)), h('td', { class: 'num' }, e.phase === 'start' ? '—' : ms(e.durationMs)),
          h('td', {}, e.summary.code || '', e.findingsText ? h('div', { class: 'suave' }, e.findingsText) : null)))))
        : h('div', { class: 'vazio' }, 'Nenhum registro para estes filtros.'));
      corpo.replaceChildren(...filhos);
    }
    await carregar();
  },

  async historico(el) {
    el.append(h('h1', {}, 'Histórico'));
    if (!estado.root) return el.append(semProjeto());
    const r = await chamar(() => api.historico(estado.root)); if (!r) return;
    el.append(h('p', { class: 'suave' }, r.notice));
    if (!r.complete) el.append(h('div', { class: 'nota' }, 'Há registros inválidos ou truncados excluídos do histórico.'));
    if (!r.activities.length) return el.append(h('div', { class: 'vazio' }, 'Nenhuma operação registrada para este projeto.'));
    el.append(h('table', {}, h('thead', {}, h('tr', {}, ['Quando', 'Operação', 'Resultado', 'Achados', 'Evidência'].map((t) => h('th', {}, t)))),
      h('tbody', {}, r.activities.map((a) => h('tr', {},
        h('td', {}, hora(a.at), h('div', { class: 'suave' }, a.origin + '/' + a.client + ' (declarado)')),
        h('td', {}, a.tool, h('div', { class: 'suave' }, h('code', {}, a.operationId))),
        h('td', {}, selo(a.state), h('div', { class: 'suave' }, a.phase === 'start' ? 'sem término observado' : ms(a.durationMs)), a.summary.code ? h('div', { class: 'suave' }, a.summary.code) : null),
        h('td', {}, a.summary.findings + ' achados · ' + a.summary.recommendations + ' recomendações · ' + a.summary.gaps + ' lacunas · ' + a.summary.candidateRedundancies + ' redundâncias candidatas', a.findingsText ? h('div', { class: 'suave' }, a.findingsText) : null),
        h('td', {}, a.summary.evidenceJobId ? h('button', { class: 'acao', onclick: () => { estado.jobId = a.summary.evidenceJobId; mostrar('evidencias'); } }, a.summary.evidenceJobId.slice(0, 8) + (a.summary.evidencePersisted === false ? ' (não persistida)' : '')) : '—'))))));
  },

  async evidencias(el) {
    el.append(h('h1', {}, 'Evidências'));
    if (!estado.root) return el.append(semProjeto());
    const alvo = estado.jobId; estado.jobId = undefined;
    const r = await chamar(() => api.evidencias(estado.root, alvo)); if (!r) return;
    el.append(h('p', { class: 'suave' }, alvo ? 'Filtrada pela evidência ' + alvo : 'Resultados reais preservados em .prumo/evidencias do projeto. Código de saída 0 valida a rodada, não cada cenário.'));
    if (!r.results.length) return el.append(h('div', { class: 'vazio' }, h('span', { class: 'estado NOT_RUN' }, 'NOT_RUN'), ' ' + (r.reason || 'Nenhuma evidência para esta consulta.')));
    for (const e of r.results.slice().reverse()) {
      el.append(...[h('h2', {}, e.capability + ' ', selo(e.status)),
        h('p', { class: 'suave' }, hora(e.endedAt) + ' · código de saída ' + (e.exitCode ?? 'n/d') + ' · escopo da evidência: ' + e.evidenceScope + ' · ' + (e.executed ? 'executado' : 'não executado')),
        h('p', {}, e.reason), e.cases.length ? h('p', {}, 'Cenários individuais: ', e.cases.map((c) => [c.id + ' ', selo(c.status), ' '])) : h('p', { class: 'suave' }, 'Sem resultados individuais verificáveis.'),
        h('p', { class: 'suave' }, h('code', {}, e.evidencePath)), e.stdout ? h('pre', {}, e.stdout) : null, e.stderr ? h('pre', {}, e.stderr) : null].filter(Boolean));
    }
    if (r.trust) el.append(h('p', { class: 'suave' }, r.trust));
  },

  async conexoes(el) {
    el.append(h('h1', {}, 'Conexões de IA'), h('p', { class: 'suave' }, 'O servidor MCP é iniciado pelo próprio cliente de IA e continua funcionando mesmo com esta janela fechada. A configuração abaixo é uma proposta: nada é alterado sem sua confirmação.'));
    if (!estado.root) return el.append(semProjeto());
    const r = await chamar(() => api.conexoes(estado.root)); if (!r) return;
    for (const c of r) {
      el.append(h('h2', {}, c.client === 'codex' ? 'Codex' : 'Claude Code', ' ', h('span', { class: 'suave' }, c.installed ? '(cliente localizado)' : '(cliente não localizado)')),
        h('p', { class: 'suave' }, 'Destino da configuração: ', h('code', {}, c.destination)), h('pre', {}, c.command), h('p', { class: 'suave' }, c.notice),
        c.automatic ? h('button', { class: 'acao', onclick: async () => { const x = await chamar(() => api.conectar(estado.root, 'codex')); if (x) avisar(x.configured ? 'Configuração adicionada. Reabra o cliente.' : x.reason, !x.configured); } }, 'Adicionar ao Codex…')
          : h('p', { class: 'suave' }, 'Copie o comando acima e execute no PowerShell depois de revisar o destino.'));
    }
  },

  async ajuda(el) {
    const docs = await chamar(api.ajuda); if (!docs) return;
    const corpo = h('article', {}); const indice = h('ul', { class: 'indice' });
    const itens = [
      ...docs.map((d) => ({ id: d.id, title: d.title, render: () => markdown(d.body, d.id === '10-perguntas') })),
      { id: 'versoes', title: 'Versões', grupo: 'Detalhes técnicos', render: painelVersoes },
      { id: 'atualizacoes', title: 'Atualizações', render: painelAtualizacoes },
      { id: 'integracoes', title: 'Integrações técnicas', render: painelIntegracoes },
      { id: 'dados', title: 'Privacidade e dados', render: painelDados }];
    const abrir = async (it) => {
      for (const b of indice.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.id === it.id));
      corpo.replaceChildren(h('p', { class: 'suave' }, 'Carregando…')); const nos = await it.render(); corpo.replaceChildren(...[].concat(nos).filter(Boolean));
    };
    for (const it of itens) {
      if (it.grupo) indice.append(h('li', { class: 'grupo' }, it.grupo));
      indice.append(h('li', {}, h('button', { 'data-id': it.id, onclick: () => abrir(it) }, it.title)));
    }
    el.append(h('div', { class: 'ajuda' }, indice, corpo));
    abrir(itens[0]);
  }
};

const bytes = (n) => (n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(1) + ' KB' : (n / 1048576).toFixed(1) + ' MB');
const lista = (itens) => (itens && itens.length ? h('ul', {}, itens.map((i) => h('li', {}, i))) : null);
const secao = (t, itens) => (itens && itens.length ? [h('h2', {}, t), lista(itens)] : []);

async function painelVersoes() {
  const r = await chamar(api.versoes); if (!r) return [];
  const rotulo = { instalada: 'instalada', publicada: 'publicada', repositorio: 'no repositório, sem release', planejada: 'planejada' };
  return [h('h1', {}, 'Versões'), h('p', { class: 'suave' }, 'Versão instalada: ' + r.installed + '. Histórico offline, da mesma fonte das notas de release.'),
    ...r.versions.map((v) => h('details', { class: 'versao', open: v.state === 'instalada' },
      h('summary', {}, h('strong', {}, v.version + ' — ' + v.title), ' ', h('span', { class: 'estado ' + (v.state === 'instalada' ? 'OK' : v.state === 'planejada' ? 'NOT_RUN' : 'NOT_VERIFIED') }, rotulo[v.state]), ' ', h('span', { class: 'suave' }, v.date ? v.date : 'sem data de publicação')),
      h('p', {}, v.objective), h('p', {}, h('strong', {}, 'Diferencial: '), v.differential),
      ...secao('Funcionalidades', v.features), ...secao('Melhorias', v.improvements), ...secao('Problemas corrigidos', v.fixes), ...secao('Como funciona', v.howItWorks),
      ...secao('Segurança', v.security), ...secao('Compatibilidade', v.compatibility), ...secao('Limitações conhecidas', v.limitations),
      h('p', {}, h('strong', {}, 'Migração de dados: '), v.migration), ...secao('Depois de atualizar', v.afterUpdate),
      v.releaseUrl ? h('p', { class: 'suave' }, 'Release oficial: ', h('code', {}, v.releaseUrl)) : h('p', { class: 'suave' }, 'Sem release oficial publicada.')))];
}

async function painelAtualizacoes() {
  const info = await chamar(api.info); const saida = h('div', { 'aria-live': 'polite' });
  const botao = h('button', { class: 'acao primaria', onclick: async () => {
    botao.disabled = true; saida.replaceChildren(h('p', { class: 'suave' }, 'Consultando a release oficial…'));
    const r = await chamar(api.verificarAtualizacao); botao.disabled = false; if (!r) return saida.replaceChildren();
    const nos = [h('p', {}, selo(r.status), ' ', r.message)];
    if (r.latest) nos.push(h('p', {}, 'Instalada: ', h('strong', {}, r.installed), ' · Mais recente publicada: ', h('strong', {}, r.latest)));
    if (r.status === 'ATUALIZACAO_DISPONIVEL') {
      nos.push(h('h2', {}, 'O que mudou'), ...markdown(r.notes || 'A release não traz notas.'),
        h('p', { class: 'suave' }, 'Compatibilidade e limitações estão nas notas acima e em Versões. Seus projetos, histórico e evidências são preservados; se o executável mudar de pasta, reconfigure a conexão MCP. O instalador não é assinado: confira o SHA-256 na página.'),
        h('button', { class: 'acao', onclick: async () => { const x = await chamar(api.abrirRelease); if (x && x.opened) avisar('Página oficial aberta no navegador.'); } }, 'Abrir página oficial…'));
    }
    saida.replaceChildren(...nos);
  } }, 'Verificar atualizações');
  return [h('h1', {}, 'Atualizações'), h('p', {}, 'Versão instalada: ', h('strong', {}, info ? info.version : '?')),
    h('p', { class: 'suave' }, 'A consulta só acontece quando você clica. O Prumo envia ao GitHub apenas uma requisição HTTPS comum (sem logs, projetos, caminhos ou identificadores); o servidor remoto vê, como em qualquer conexão, o seu endereço IP. Isto não é anonimato. Nada é baixado nem instalado automaticamente.'),
    botao, saida];
}

async function painelIntegracoes() {
  const ops = await chamar(api.integracoes); if (!ops) return [];
  const corpo = h('div', {}); let tipo = '';
  const desenhar = () => corpo.replaceChildren(...ops.filter((o) => !tipo || o.tipo === tipo).map((o) => h('details', { class: 'operacao' },
    h('summary', {}, h('span', { class: 'estado NOT_VERIFIED' }, o.tipo), ' ', h('code', {}, o.nome), ' ', h('span', { class: 'suave' }, o.finalidade)),
    h('dl', {}, ...[['Tipo', o.tipo], ['Operação', o.nome], ['Origem', o.origem], ['Destino', o.destino], ['Entrada', o.entrada], ['Argumentos aceitos', o.campos.join(', ') || 'nenhum'], ['Saída', o.saida],
      ['Permissões', o.permissoes], ['Efeito', o.efeito], ['Arquivos consultados', o.arquivos], ['Erros possíveis', o.erros.join(', ')], ['Proteções', o.protecoes.join('; ')], ['Registro', o.registro]]
      .flatMap(([k, v]) => [h('dt', {}, k), h('dd', {}, v)])))));
  desenhar();
  return [h('h1', {}, 'Integrações técnicas'), h('p', { class: 'suave' }, 'Catálogo gerado do código: ' + ops.filter((o) => o.tipo === 'IPC').length + ' operações IPC da janela e ' + ops.filter((o) => o.tipo === 'MCP').length + ' ferramentas MCP. Não existe API HTTP.'),
    h('div', { class: 'barra' }, h('label', {}, 'Tipo', h('select', { id: 'filtro-tipo', onchange: (e) => { tipo = e.target.value; desenhar(); } }, h('option', { value: '' }, 'Todos'), h('option', { value: 'IPC' }, 'IPC (janela)'), h('option', { value: 'MCP' }, 'MCP (agentes de IA)')))), corpo];
}

async function painelDados() {
  const r = await chamar(api.resumoDados); if (!r) return [];
  const saida = h('div', { 'aria-live': 'polite', id: 'resultado-exclusao' });
  const alvo = estado.root;
  const excluir = (escopo, rotulo) => h('button', { class: 'acao perigo', id: 'excluir-' + escopo, disabled: escopo !== 'diagnostico' && !alvo, onclick: async () => {
    const x = await chamar(() => api.excluirDados(escopo, alvo)); if (!x) return;
    saida.replaceChildren(h('p', {}, x.canceled ? 'Cancelado; nada foi excluído.' : 'Excluídos: ' + x.deleted + ' arquivo(s).' + (x.failed.length ? ' Falharam: ' + x.failed.map((f) => f.file + ' (' + f.code + ')').join(', ') + '.' : '')));
  } }, rotulo);
  return [h('h1', {}, 'Privacidade e dados'),
    h('p', {}, 'Pasta de dados: ', h('code', {}, r.directory)), h('p', {}, 'Projetos vinculados: ', h('strong', {}, String(r.linkedProjects)), ' · Espaço usado: ', h('strong', {}, bytes(r.totalBytes) + (r.truncated ? ' (estimativa parcial)' : ''))),
    h('table', {}, h('thead', {}, h('tr', {}, ['Categoria', 'Arquivos', 'Tamanho'].map((t) => h('th', {}, t)))), h('tbody', {}, Object.entries(r.categories).map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', { class: 'num' }, String(v.files)), h('td', { class: 'num' }, bytes(v.bytes)))))),
    h('p', { class: 'suave' }, r.evidenceNote), h('h2', {}, 'Retenção'), h('p', {}, r.retention),
    h('h2', {}, 'O que não é transmitido'), lista(r.notTransmitted), h('h2', {}, 'Limites da privacidade com IA externa'), lista(r.privacyLimits),
    h('h2', {}, 'Exportar'), h('p', { class: 'suave' }, 'Exporta o histórico do projeto selecionado para o local que você escolher. Os metadados podem revelar informações do projeto. Nada é enviado pela rede.'),
    h('button', { class: 'acao', id: 'exportar-dados', disabled: !alvo, onclick: async () => { const x = await chamar(() => api.exportarLogs(alvo)); if (x && x.exported) avisar('Dados exportados.'); } }, 'Exportar dados do projeto selecionado…'),
    h('h2', {}, 'Excluir'), h('p', { class: 'suave' }, alvo ? 'Cada ação é separada, pede confirmação e nunca apaga código-fonte. Para apenas remover o projeto da lista, use Desvincular em Projetos.' : 'Selecione um projeto em Projetos para excluir os registros dele. O diagnóstico da interface não depende de projeto.'),
    h('div', { class: 'barra' }, excluir('historico', 'Excluir histórico operacional do projeto…'), excluir('evidencias', 'Excluir evidências do projeto…'), excluir('diagnostico', 'Excluir diagnóstico da interface…')), saida];
}

/** Markdown mínimo (títulos, listas, código, parágrafos), sempre via nós de texto. */
function markdown(texto, sanfona = false) {
  const saida = []; let lista = null; let codigo = null; let destino = saida;
  for (const linha of texto.split(/\r?\n/)) {
    if (linha.startsWith('```')) { if (codigo) { destino.push(h('pre', {}, codigo.join('\n'))); codigo = null; } else codigo = []; continue; }
    if (codigo) { codigo.push(linha); continue; }
    const item = /^[-*] (.*)/.exec(linha);
    if (item) { if (!lista) { lista = h('ul', {}); destino.push(lista); } lista.append(h('li', {}, inline(item[1]))); continue; }
    lista = null;
    const t = /^(#{1,3}) (.*)/.exec(linha);
    if (t && sanfona && t[1].length === 2) { const d = h('details', { class: 'faq' }, h('summary', {}, t[2])); saida.push(d); destino = { push: (n) => d.append(n) }; }
    else if (t) saida.push(h(t[1].length === 1 ? 'h1' : 'h2', {}, t[2])); else if (linha.trim()) destino.push(h('p', {}, inline(linha)));
  }
  return saida;
}
function inline(s) { return s.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((p) => (p.startsWith('`') ? h('code', {}, p.slice(1, -1)) : p.startsWith('**') ? h('strong', {}, p.slice(2, -2)) : p)); }

function salvarRaiz() { try { if (estado.root) localStorage.setItem('raiz', estado.root); else localStorage.removeItem('raiz'); } catch { /* sem armazenamento: ignora */ } }
async function mostrar(aba) {
  clearInterval(estado.timer); estado.aba = aba;
  for (const b of document.querySelectorAll('#nav button')) { if (b.dataset.aba === aba) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  const el = $('#conteudo'); el.replaceChildren();
  const nome = (await chamar(api.projetos))?.find((p) => p.root === estado.root);
  if (estado.root && !nome) estado.root = null;
  $('#projeto-atual').textContent = nome ? (nome.name || nome.id) : 'nenhum selecionado';
  try { await abas[aba](el); } catch (e) { avisar('Falha ao carregar a seção.', true); }
}

(async () => {
  const info = await chamar(api.info); if (info) $('#versao').textContent = 'v' + info.version;
  try { estado.root = localStorage.getItem('raiz'); } catch { /* ignora */ }
  for (const b of document.querySelectorAll('#nav button')) b.addEventListener('click', () => mostrar(b.dataset.aba));
  mostrar('projetos');
})();
