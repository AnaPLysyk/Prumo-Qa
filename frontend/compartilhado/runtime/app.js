'use strict';
// Camada de apresentação. Não calcula métricas nem classifica resultados: só exibe o que o núcleo devolve.
// Todo texto entra no DOM por textContent (nunca innerHTML).
const api = window.prumo;
const $ = (s) => document.querySelector(s);
const estado = { aba: 'inicio', root: null, timer: null, jobId: undefined, ajudaAlvo: null, aviso: null, prefs: null };

// No DOM, append(null) escreve o texto "null". Nas telas, null/undefined/false sempre significam "nada a mostrar".
for (const P of [Element.prototype, DocumentFragment.prototype]) for (const m of ['append', 'prepend', 'replaceChildren']) { const original = P[m]; P[m] = function (...nos) { return original.apply(this, nos.filter((n) => n != null && n !== false)); }; }
function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v; else if (k.startsWith('on')) el.addEventListener(k.slice(2), v); else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  for (const f of filhos.flat()) if (f != null && f !== false) el.append(f.nodeType ? f : document.createTextNode(String(f)));
  return el;
}
const rotulosSelo = { NAO_CONFIGURADO: 'NÃO CONFIGURADO', NAO_APLICAVEL: 'NÃO APLICÁVEL', ERRO_INFRA: 'ERRO DE INFRAESTRUTURA', EXECUTANDO: 'EXECUTANDO', INDISPONIVEL: 'CONSULTA NÃO CONCLUÍDA', LIMITE_DE_TAXA: 'LIMITE DE CONSULTAS', RESPOSTA_INVALIDA: 'RESPOSTA INVÁLIDA', SEM_RELEASE: 'SEM RELEASE', ATUALIZADO: 'ATUALIZADO', ATUALIZACAO_DISPONIVEL: 'ATUALIZAÇÃO DISPONÍVEL' };
const selo = (s) => h('span', { class: 'estado ' + s }, rotulosSelo[s] || s.replaceAll('_', ' '));
const hora = (iso) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—');
const ms = (n) => (n === null || n === undefined ? 'indisponível' : Math.round(n * 10) / 10 + ' ms');

/**
 * 2.11: o aviso aparece embaixo, centralizado na área de conteúdo, e some sozinho (4 s; erro 8 s; clique fecha antes).
 * Não cobre nada fixo: desvia do robô e do painel do chat, reserva espaço no fim da página e, com um modal aberto,
 * entra no fim do próprio modal (no fluxo, empurrando o conteúdo) em vez de flutuar por cima dele.
 */
function avisar(msg, erro) {
  const el = $('#aviso'); clearTimeout(avisar.t);
  el.textContent = msg; el.className = erro ? 'erro' : ''; el.hidden = false; el.onclick = () => esconderAviso(el);
  posicionarAviso(el);
  avisar.t = setTimeout(() => esconderAviso(el), erro ? 8000 : 4000);
}
function esconderAviso(el) {
  clearTimeout(avisar.t); el.hidden = true; document.body.classList.remove('com-aviso');
  if (el.parentElement !== document.body) document.body.append(el);
}
function posicionarAviso(el) {
  const visivel = (n) => !!n && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden';
  const modal = [...document.querySelectorAll('dialog[open]')].pop();
  if (modal) { modal.append(el); el.removeAttribute('style'); document.body.classList.remove('com-aviso'); return; }
  if (el.parentElement !== document.body) document.body.append(el);
  const area = $('#conteudo').getBoundingClientRect(); const esquerda = Math.max(area.left, 0); let direita = Math.min(area.right, innerWidth);
  const painel = document.querySelector('.v36f-painel'); if (visivel(painel)) direita = Math.min(direita, painel.getBoundingClientRect().left - 12);
  const centro = (esquerda + direita) / 2; let largura = Math.min(520, direita - esquerda - 24); let baixo = 16;
  const robo = document.querySelector('.v36f-botao');
  if (visivel(robo)) {
    const r = robo.getBoundingClientRect(); const livre = 2 * (r.left - 12 - centro);
    if (livre >= 220) largura = Math.min(largura, livre); else baixo = Math.max(baixo, innerHeight - r.top + 8);
  }
  Object.assign(el.style, { left: Math.round(centro) + 'px', bottom: Math.round(baixo) + 'px', maxWidth: Math.max(200, Math.floor(largura)) + 'px' });
  document.body.style.setProperty('--aviso-reserva', Math.ceil(el.getBoundingClientRect().height + baixo + 16) + 'px'); document.body.classList.add('com-aviso');
}
/** Chamada ao núcleo; erros viram aviso, nunca exceção solta. Sessão encerrada abre a tela de entrada em vez de repetir avisos. */
async function chamar(fn) {
  const r = await fn();
  if (!r.ok) { if (window.PrumoConta?.tratarErro(r.error)) return null; avisar(textoErro(r.error), true); return null; }
  return r.data;
}
/** 2.10.2: explicação primeiro, código técnico só como detalhe no fim ("CODIGO: texto" → "Texto (código CODIGO)"). */
function textoErro(erro) {
  const m = /^([A-Z][A-Z0-9_]{2,63}):\s*([\s\S]+)$/.exec(String(erro || ''));
  if (!m) return String(erro || 'Falha sem detalhe.');
  const texto = m[2].trim(); return texto.charAt(0).toUpperCase() + texto.slice(1) + ' (código ' + m[1] + ')';
}
function semProjeto() {
  return h('div', { class: 'vazio' }, 'Nenhum projeto selecionado. Em ', h('strong', {}, 'Projetos'), ', vincule uma pasta com qa.project.json ou adicione o projeto de demonstração.');
}

function diagnostico(s) {
  return h('div', { class: 'nota' }, h('strong', {}, 'Não vinculado: '), selo(s.state), ' ', s.message, h('div', { class: 'suave' }, h('code', {}, s.root)), s.instructions ? h('p', {}, s.instructions) : null);
}

const abas = {
  async projetos(el) {
    el.append(h('h2', { id: 'pastas-contrato-local' }, 'Pastas com contrato local'));
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
    const todas = await chamar(api.projetos); if (!todas) return;
    const gerenciados = await chamar(api.espacos); const lista = todas.filter(p => !gerenciados?.some(e => e.raizContextos === p.root));
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

  async conexoes(el) {
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
  },

  async suporte(el) {
    el.append(h('h1',{},'Suporte'));
    const numero=h('input',{type:'number',min:'1',max:'999999999',id:'sup-numero'});const chamado=h('div',{'aria-live':'polite'});
    el.append(h('h2',{},'Acompanhar chamado no GitHub'),h('label',{class:'campo'},'Número do chamado',numero),
      h('button',{class:'acao',onclick:async()=>{
        const r=await chamar(()=>api.suporteConsultar(Number(numero.value)));if(!r)return;
        chamado.replaceChildren(r.ok?h('div',{},h('h3',{},`#${r.numero} · ${r.title}`),h('p',{},'Status: ',r.status?h('span',{class:`estado status-${r.status.id}`},r.status.nome):(r.ambiguous?'rótulos conflitantes':'sem status informado')),h('p',{},r.status?.explicacao||''),h('p',{},'Última aplicação do status no histórico consultado: ',r.statusAt?hora(r.statusAt):'indisponível'),h('p',{},'Atualização da issue: ',hora(r.updatedAt),' · Responsáveis: ',r.responsible.join(', ')||'não informados'),
          h('ul',{},r.history.map(e=>h('li',{},`${hora(e.at)} · ${e.event==='labeled'?'Aplicado':'Removido'} ${e.status} · ${e.actor||'responsável indisponível'}`))),!r.historyComplete?h('p',{class:'nota'},'Histórico parcial ou indisponível.'):null,h('p',{class:'suave'},r.notice),h('button',{class:'acao',onclick:()=>chamar(()=>api.suporteChamado(r.numero))},'Abrir chamado no GitHub…')):h('p',{class:'nota erro'},r.code));
      }},'Consultar chamado'),chamado);
    el.append(h('p', { class: 'suave' }, 'Relate um bug, peça uma melhoria ou envie uma sugestão. O Prumo prepara o texto aqui, mostra o que será enviado e só abre o formulário oficial do GitHub depois da sua confirmação. Nada é enviado por este aplicativo.'));
    el.append(h('div', { class: 'nota', id: 'aviso-publico' }, h('strong', {}, 'Atenção: '), 'issues do repositório oficial são públicas. Não inclua senhas, tokens, documentos privados, código confidencial ou dados pessoais. Nenhum e-mail de suporte é oferecido; o canal oficial é o GitHub Issues.'));
    const campo = (id, rotulo, el2) => h('label', { class: 'campo' }, rotulo, el2);
    const categoria = h('select', { id: 'sup-categoria' }, h('option', { value: 'bug' }, 'Bug'), h('option', { value: 'melhoria' }, 'Melhoria'), h('option', { value: 'sugestao' }, 'Sugestão'));
    const titulo = h('input', { id: 'sup-titulo', type: 'text', maxlength: '120' });
    const descricao = h('textarea', { id: 'sup-descricao', rows: '5', maxlength: '4000' });
    const passos = h('textarea', { id: 'sup-passos', rows: '4', maxlength: '2000' });
    const esperado = h('textarea', { id: 'sup-esperado', rows: '3', maxlength: '2000' });
    const marca = (id, rotulo, ligado) => { const i = h('input', { type: 'checkbox', id, checked: ligado }); return [i, h('label', { class: 'opcao', for: id }, ' ' + rotulo)]; };
    const [incVersao, lVersao] = marca('sup-versao', 'Incluir a versão do Prumo QA', true);
    const [incSistema, lSistema] = marca('sup-sistema', 'Incluir o sistema operacional (somente se você autorizar)', false);
    const [incDiag, lDiag] = marca('sup-diagnostico', 'Incluir os últimos eventos do diagnóstico da interface (somente metadados)', false);
    const [consente, lConsente] = marca('sup-consentimento', 'Entendo que o texto abaixo será exibido a qualquer pessoa se eu enviar a issue', false);
    const saida = h('div', { id: 'sup-saida', 'aria-live': 'polite' });
    const relato = () => ({ categoria: categoria.value, titulo: titulo.value, descricao: descricao.value, passos: passos.value || undefined, esperado: esperado.value || undefined,
      incluirVersao: incVersao.checked, incluirSistema: incSistema.checked, incluirDiagnostico: incDiag.checked, consentimento: consente.checked });

    const revisar = async () => {
      if (!consente.checked) { avisar('Marque o entendimento sobre issues públicas para revisar.', true); return; }
      const p = await chamar(() => api.suportePreparar(relato())); if (!p) return;
      const nos = [h('h2', {}, 'Revisão antes de enviar'), h('p', { class: 'suave' }, p.aviso)];
      if (p.bloqueios.length) nos.push(h('div', { class: 'nota erro', id: 'sup-bloqueios' }, h('strong', {}, 'Envio bloqueado: '), p.bloqueios.map((b) => b.tipo + (b.trecho ? ' (' + b.trecho + ')' : '')).join('; '), '. Remova ou substitua antes de continuar.'));
      if (p.avisos.length) nos.push(h('div', { class: 'nota', id: 'sup-avisos' }, h('strong', {}, 'Revise: '), p.avisos.map((b) => b.tipo + ' (' + b.trecho + ')').join('; '), '. Você decide se mantém.'));
      if(!p.ok&&!p.markdown)nos.push(h('div',{class:'barra'},h('button',{class:'acao',id:'sup-abrir',disabled:true},'Abrir formulário no GitHub…'),h('button',{class:'acao',id:'sup-exportar',disabled:true},'Exportar Markdown…')));
      if (p.markdown) nos.push(h('p', { class: 'suave' }, 'Este é exatamente o texto que será usado:'), h('pre', { id: 'sup-previa' }, p.markdown), p.truncado ? h('p', { class: 'suave' }, 'O texto é longo e será encurtado no formulário; use Exportar para guardar a versão completa.') : null,
        h('div', { class: 'barra' },
          h('button', { class: 'acao primaria', id: 'sup-abrir', disabled: !p.ok, onclick: async () => { const x = await chamar(() => api.suporteAbrir(relato())); if (x && x.opened) avisar('Formulário aberto no navegador. Revise e envie por lá.'); } }, 'Abrir formulário no GitHub…'),
          h('button', { class: 'acao', id: 'sup-exportar', disabled: !p.ok, onclick: async () => { const x = await chamar(() => api.suporteExportar(relato())); if (x && x.exported) avisar('Relato exportado.'); } }, 'Exportar para arquivo…')));
      saida.replaceChildren(...nos.filter(Boolean));
    };
    el.append(h('div', { class: 'formulario' }, campo('c', 'Tipo', categoria), campo('t', 'Título', titulo), campo('d', 'Descrição', descricao),
      campo('p', 'Passos para reproduzir (obrigatório em bug)', passos), campo('e', 'Resultado ou benefício esperado', esperado),
      h('h2', {}, 'O que incluir'), h('div', {}, incVersao, lVersao), h('div', {}, incSistema, lSistema), h('div', {}, incDiag, lDiag),
      h('p', { class: 'suave' }, 'Logs, evidências, caminhos, contextos e código do seu projeto nunca são anexados.'),
      h('div', {}, consente, lConsente), h('div', { class: 'barra' }, h('button', { class: 'acao primaria', id: 'sup-revisar', onclick: revisar }, 'Revisar')), saida));
  },

  async ajuda(el) {
    const todos = await chamar(api.ajuda); if (!todos) return;
    // Documentos com versão em inglês (.en) substituem o texto em português quando o idioma é inglês; os demais ficam em português, com aviso.
    const en = PrumoI18n.idioma === 'en';
    const docs = todos.filter((d) => !d.id.endsWith('.en')).map((d) => { const alt = en ? todos.find((x) => x.id === d.id + '.en') : null; return alt ? { ...alt, id: d.id } : { ...d, soPt: en }; });
    const corpo = h('article', {}); const indice = h('ul', { class: 'indice' });
    const itens = [
      ...docs.map((d) => ({ id: d.id, title: d.title, soPt: d.soPt, render: () => markdown(d.body, d.id === '10-perguntas') })),
      { id: 'versoes', title: 'Versões', grupo: 'Detalhes técnicos', render: painelVersoes },
      { id: 'atualizacoes', title: 'Atualizações', render: painelAtualizacoes },
      { id: 'integracoes', title: 'Integrações técnicas', render: painelIntegracoes },
      { id: 'dados', title: 'Privacidade e dados', render: painelDados }];
    const abrir = async (it) => {
      for (const b of indice.querySelectorAll('button')) b.setAttribute('aria-current', String(b.dataset.id === it.id));
      corpo.replaceChildren(h('p', { class: 'suave' }, 'Carregando…')); const nos = await it.render(); corpo.replaceChildren(...[].concat(nos).filter(Boolean));
      if (en && (it.soPt || ['versoes', 'integracoes'].includes(it.id))) corpo.prepend(h('div', { class: 'nota', 'data-i18n-ignore': '' }, 'This help content is available in Portuguese only; the interface around it is in English.'));
    };
    for (const it of itens) {
      if (it.grupo) indice.append(h('li', { class: 'grupo' }, it.grupo));
      indice.append(h('li', {}, h('button', { 'data-id': it.id, onclick: () => abrir(it) }, it.title)));
    }
    el.append(h('div', { class: 'ajuda' }, indice, corpo));
    const alvo = itens.find((i) => i.id === estado.ajudaAlvo) || itens[0]; estado.ajudaAlvo = null;
    abrir(alvo);
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
  const info = await chamar(api.info); const saida = h('div', { 'aria-live': 'polite', id: 'saida-atualizacao' });
  const pref = await chamar(api.preferencias); const p = pref ? pref.preferencias : null;
  const detalhes = (versao, notas) => [h('h2', {}, 'O que mudou na ' + versao), ...markdown(notas || 'A release não traz notas.'),
    h('p', { class: 'suave' }, 'Compatibilidade e limitações estão nas notas acima e em Versões. Seus projetos, histórico e evidências são preservados; se o executável mudar de pasta, reconfigure a conexão MCP. O instalador não é assinado: ao atualizar, o Prumo confere o SHA-256 publicado na release antes de instalar.'),
    h('div', { class: 'barra-acoes' }, botaoAtualizar(), h('button', { class: 'acao', id: 'abrir-release', onclick: async () => { const x = await chamar(api.abrirRelease); if (x && x.opened) avisar('Página oficial aberta no navegador.'); } }, 'Abrir página oficial…')), h('div', { id: 'progresso-atualizacao', 'aria-live': 'polite' })];
  // 2.10.2: um clique. Confere de novo a release (a versão vem do processo principal), baixa, confere o SHA-256 e instala.
  function botaoAtualizar() {
    const b = h('button', { class: 'acao primaria', id: 'atualizar-agora', onclick: async () => {
      const prog = document.getElementById('progresso-atualizacao'); b.disabled = true;
      const passo = (t) => prog?.replaceChildren(h('p', { class: 'suave' }, t));
      passo('Conferindo a release oficial…'); const c = await chamar(api.verificarAtualizacao);
      if (!c || c.status !== 'ATUALIZACAO_DISPONIVEL') { b.disabled = false; return passo(c ? c.message : 'A consulta não foi concluída; tente de novo.'); }
      passo('Baixando o instalador e conferindo o SHA-256…'); const x = await chamar(api.instalarAtualizacao); b.disabled = false;
      if (!x || x.canceled) return prog?.replaceChildren();
      prog?.replaceChildren(h('p', { class: 'nota', id: 'atualizacao-conferida' }, x.instalando ? 'Instalador da versão ' + x.versao + ' conferido (SHA-256 ' + x.sha256.slice(0, 12) + '…). O Prumo vai fechar, instalar e abrir de novo.' : x.baixadoEm ? 'Instalador da versão ' + x.versao + ' baixado e conferido (SHA-256 ' + x.sha256.slice(0, 12) + '…) em ' + x.baixadoEm + '. ' + x.proximoPasso : 'Instalador da versão ' + x.versao + ' baixado e conferido (SHA-256 ' + x.sha256.slice(0, 12) + '…). Modo de desenvolvimento: nada foi instalado.'));
    } }, 'Atualizar agora');
    return b;
  }
  const botao = h('button', { class: 'acao primaria', id: 'verificar-atualizacao', onclick: async () => {
    botao.disabled = true; saida.replaceChildren(h('p', { class: 'suave' }, 'Consultando a release oficial…'));
    const r = await chamar(api.verificarAtualizacao); botao.disabled = false; if (!r) return saida.replaceChildren();
    await aplicarNotificacao(r);
    const nos = [h('p', {}, selo(r.status), ' ', r.message)];
    if (r.conclusivo === false) { const pr = await chamar(api.preferencias); const ult = pr && pr.preferencias.ultimaConsulta; nos.push(h('p', { class: 'nota', id: 'consulta-nao-concluida' }, 'A consulta não foi concluída: ainda não sabemos se há atualização.' + (ult ? ' Última consulta concluída em ' + hora(ult) + '.' : ' Nenhuma consulta foi concluída até agora.'))); }
    if (r.latest) nos.push(h('p', {}, 'Instalada: ', h('strong', {}, r.installed), ' · Mais recente publicada: ', h('strong', {}, r.latest)));
    if (r.status === 'ATUALIZACAO_DISPONIVEL') nos.push(...detalhes(r.latest, r.notes));
    saida.replaceChildren(...nos);
  } }, 'Verificar atualizações');
  const opcao = (campo, rotulo) => h('label', { class: 'opcao' }, h('input', { type: 'checkbox', id: 'pref-' + campo, checked: p ? !!p[campo] : campo === 'avisoAutomatico', onchange: async (e) => {
    const x = await chamar(() => api.salvarPreferencias({ [campo]: e.target.checked })); if (!x) { e.target.checked = !e.target.checked; return; } await atualizarSino(); avisar('Preferência salva.');
  } }), ' ' + rotulo);
  const pendente = p && p.disponivel && info ? p.disponivel : null;
  return [h('h1', {}, 'Atualizações'), h('p', {}, 'Versão instalada: ', h('strong', {}, info ? info.version : '?')),
    h('p', { class: 'suave' }, 'Com o aviso automático ligado (padrão), o Prumo consulta só a release mais recente do repositório oficial no GitHub ao abrir e a cada 6 horas, mesmo minimizado na bandeja, e avisa uma vez por versão: no sino e com uma notificação do sistema. Você também pode verificar a qualquer momento pelo botão acima. É enviada apenas uma requisição HTTPS comum (sem logs, projetos, caminhos ou identificadores); o servidor remoto vê, como em qualquer conexão, o seu endereço IP. Isto não é anonimato. Nada é baixado nem instalado automaticamente.'),
    botao, saida,
    pendente ? h('div', { id: 'ultima-conhecida' }, h('p', { class: 'nota' }, 'Última consulta' + (p.ultimaConsulta ? ' (' + hora(p.ultimaConsulta) + ')' : '') + ': a versão ' + pendente.versao + ' estava disponível.'), ...detalhes(pendente.versao, pendente.notas)) : null,
    h('h2', {}, 'Preferências de aviso'),
    opcao('avisoAutomatico', 'Avisar quando houver versão nova (consulta o GitHub ao abrir e a cada 6 horas)'),
    opcao('som', 'Tocar um som curto quando houver uma versão nova (uma vez por versão)'),
    opcao('silenciar', 'Silenciar: nunca tocar som, mesmo com o som ligado'),
    h('p', { class: 'suave' }, 'O sino no cabeçalho mostra um ponto enquanto houver uma versão que você ainda não viu. Clicar nele marca a versão como vista.')];
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
    saida.replaceChildren(h('p', {}, x.canceled ? 'Cancelado; nada foi excluído.' : 'Excluídos: ' + x.deleted + ' arquivo(s).' + ((x.failed || []).length ? ' Falharam: ' + x.failed.map((f) => f.file + ' (' + f.code + ')').join(', ') + '.' : '')));
  } }, rotulo);
  return [h('h1', {}, 'Privacidade e dados'),
    h('p', {}, 'Pasta de dados: ', h('code', {}, r.directory)), h('p', {}, 'Projetos vinculados: ', h('strong', {}, String(r.linkedProjects)), ' · Espaço usado: ', h('strong', {}, bytes(r.totalBytes) + (r.truncated ? ' (estimativa parcial)' : ''))),
    h('table', {}, h('thead', {}, h('tr', {}, ['Categoria', 'Arquivos', 'Tamanho'].map((t) => h('th', {}, t)))), h('tbody', {}, Object.entries(r.categories).map(([k, v]) => h('tr', {}, h('td', {}, k), h('td', { class: 'num' }, String(v.files)), h('td', { class: 'num' }, bytes(v.bytes)))))),
    h('p', { class: 'suave' }, r.evidenceNote), h('h2', {}, 'Retenção'), h('p', {}, r.retention),
    h('h2', {}, 'O que não é transmitido'), lista(r.notTransmitted), h('h2', {}, 'Limites da privacidade com IA externa'), lista(r.privacyLimits),
    h('h2', {}, 'Exportar'), h('p', { class: 'suave' }, 'Exporta o histórico do projeto selecionado para o local que você escolher. Os metadados podem revelar informações do projeto. Nada é enviado pela rede.'),
    h('button', { class: 'acao', id: 'exportar-dados', disabled: !alvo, onclick: async () => { const x = await chamar(() => api.exportarLogs(alvo)); if (x && x.exported) avisar('Dados exportados.'); } }, 'Exportar dados do projeto selecionado…'),
    h('h2', {}, 'Excluir'), h('p', { class: 'suave' }, alvo ? 'Cada ação é separada, pede confirmação e nunca apaga código-fonte. Para apenas remover o projeto da lista, use Desvincular em Projetos.' : 'Selecione um projeto em Projetos para excluir os registros dele. O diagnóstico da interface não depende de projeto.'),
    h('div', { class: 'barra' }, excluir('historico', 'Excluir histórico operacional do projeto…'), excluir('evidencias', 'Excluir evidências do projeto…'), excluir('contextos', 'Excluir todos os contextos do projeto…'), excluir('diagnostico', 'Excluir diagnóstico da interface…')), saida];
}

/* ---- Notificações de atualização (2.5): sino, som opcional e preferências. Sem processo em segundo plano. ---- */
const resumoNotas = (notas) => (notas || '').split(/\r?\n/).map((l) => l.replace(/^[-*#>\s]+/, '').replace(/[`*]/g, '').trim()).filter((l) => l.length > 3).slice(0, 3);
function tocarSom() {
  // Dois tons curtos (≈0,3 s) sintetizados na hora: sem arquivo de áudio e sem biblioteca. Falha de áudio nunca atrapalha o uso.
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return;
    const ctx = new Ctx(); const t0 = ctx.currentTime;
    [[660, 0], [880, 0.14]].forEach(([freq, atraso]) => {
      const osc = ctx.createOscillator(); const ganho = ctx.createGain(); osc.type = 'sine'; osc.frequency.value = freq;
      ganho.gain.setValueAtTime(0.0001, t0 + atraso); ganho.gain.exponentialRampToValueAtTime(0.12, t0 + atraso + 0.02); ganho.gain.exponentialRampToValueAtTime(0.0001, t0 + atraso + 0.14);
      osc.connect(ganho).connect(ctx.destination); osc.start(t0 + atraso); osc.stop(t0 + atraso + 0.16);
    });
    setTimeout(() => ctx.close().catch(() => {}), 600);
    window.__prumoSom = (window.__prumoSom || 0) + 1; // contador observável pelos testes automatizados
  } catch { /* sem áudio: ignora */ }
}
function desenharSino(aviso) {
  const sino = $('#sino'); const ponto = $('#sino-ponto'); const dica = $('#sino-dica');
  estado.aviso = aviso && aviso.indicador ? aviso : null;
  ponto.hidden = !estado.aviso; sino.classList.toggle('novo', !!estado.aviso);
  sino.setAttribute('aria-label', estado.aviso ? 'Atualizações do Prumo QA: versão ' + estado.aviso.versao + ' disponível' : 'Atualizações do Prumo QA: nenhuma novidade');
  const itens = estado.aviso ? resumoNotas(estado.aviso.notas) : [];
  dica.replaceChildren(...(estado.aviso
    ? [h('p', {}, h('strong', {}, 'Versão ' + estado.aviso.versao + ' disponível')), itens.length ? h('ul', {}, itens.map((i) => h('li', {}, i))) : null,
       h('p', { class: 'suave' }, 'Clique para ver as notas completas (correções, segurança e compatibilidade). Nada é baixado nem instalado automaticamente.')]
    : [h('p', {}, 'Nenhuma atualização pendente.'), h('p', { class: 'suave' }, 'Clique para abrir Atualizações e verificar.')]));
}
async function atualizarSino() { const r = await chamar(api.preferencias); if (r) { estado.prefs = r.preferencias; desenharSino(r.aviso); } return r; }
function ligarSino() {
  const sino = $('#sino'); const dica = $('#sino-dica'); let preso = false;
  const mostrarDica = () => { dica.hidden = false; }; const esconder = () => { if (!preso) dica.hidden = true; };
  sino.addEventListener('mouseenter', mostrarDica); sino.addEventListener('mouseleave', esconder); sino.addEventListener('focus', mostrarDica); sino.addEventListener('blur', esconder);
  sino.addEventListener('keydown', (e) => { if (e.key === 'Escape') { preso = false; dica.hidden = true; } });
  sino.addEventListener('click', async () => {
    dica.hidden = true;
    if (estado.aviso) { await chamar(() => api.marcarVisualizada(estado.aviso.versao)); await atualizarSino(); }
    estado.ajudaAlvo = 'atualizacoes'; mostrar('ajuda');
  });
}
/** Aplica o resultado de uma verificação: atualiza o sino e toca o som no máximo uma vez por versão (decidido e gravado pelo núcleo). */
async function aplicarNotificacao(r) {
  if (!r || !r.notificacao) return; const n = r.notificacao;
  await atualizarSino(); if (n.tocarSom) tocarSom();
}
async function iniciarNotificacoes() {
  // 2.10.1: a consulta automática (ao abrir e a cada 6 horas) é feita pelo processo principal e chega como evento;
  // aqui só se desenha o aviso já conhecido, que funciona offline.
  await atualizarSino(); ligarSino();
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

function salvarRaiz() { if (estado.espaco && estado.espaco.raizContextos !== estado.root) estado.espaco = null; try { if (estado.root) localStorage.setItem('raiz', estado.root); else localStorage.removeItem('raiz'); if (estado.espaco) localStorage.setItem('espaco', estado.espaco.id); else localStorage.removeItem('espaco'); } catch { /* sem armazenamento: ignora */ } }
// 2.13: Execuções e Rastreabilidade deixaram de ser telas; viram subabas de Testes (Runs e Vínculos). Os nomes antigos continuam abrindo o lugar novo.
const rotasVirtuais = { runs: ['testes', 'runs'], execucoes: ['testes', 'runs'], automacoes: ['testes', 'pipelines'], vinculos: ['testes', 'repositorio'], rastreabilidade: ['testes', 'repositorio'] };
async function mostrar(aba) {
  if (rotasVirtuais[aba]) { const [pai, sub] = rotasVirtuais[aba]; (estado.sub ||= {})[pai] = sub; aba = pai; }
  clearInterval(estado.timer); estado.aba = aba;
  for (const b of document.querySelectorAll('#nav button')) { if (b.dataset.aba === aba) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); }
  // Corrida de navegação: cada renderização usa um token e constrói num contêiner separado; só a mais recente é anexada.
  // Sem isso, duas trocas rápidas de aba escreviam no mesmo elemento e misturavam conteúdos ou duplicavam ids.
  const token = (estado.render = (estado.render || 0) + 1); const el = document.createElement('div');
  const locais = await chamar(api.projetos); const espacos = await chamar(api.espacos);
  // Consulta que falhou não prova que o projeto sumiu: só descarta a seleção quando as duas listas vieram.
  const consultou = !!locais && !!espacos;
  if (espacos) estado.espaco = espacos.find(e => e.raizContextos === estado.root) || null;
  const nome = estado.espaco || locais?.find((p) => p.root === estado.root);
  if (token !== estado.render) return;
  if (estado.root && !nome && consultou) estado.root = null;
  // 2.10.2: um só nome de projeto atual para lateral, Suporte e Projetos (inclusive pasta com contrato local, como a demonstração).
  if (nome || consultou) { estado.projetoNome = nome ? (nome.nome || nome.name || nome.id) : null; estado.projetoLegado = !!nome && !estado.espaco; $('#projeto-atual').textContent = estado.projetoNome || 'nenhum selecionado'; }
  try { await abas[aba](el); } catch (e) { if (token === estado.render) avisar('Falha ao carregar a seção.', true); }
  if (token !== estado.render) return;
  $('#conteudo').replaceChildren(...el.childNodes);
  if (typeof montarSeletorProjeto === 'function') montarSeletorProjeto();
}

(async () => {
  // Espera todos os scripts da página terminarem de executar antes de montar a primeira tela.
  if (document.readyState === 'loading') await new Promise((ok) => document.addEventListener('DOMContentLoaded', ok, { once: true }));
  const info = await chamar(api.info); if (info) $('#versao').textContent = 'v' + info.version;
  // 2.11: com o login ligado, nada mais carrega antes de a pessoa entrar (a tela de entrada recarrega a janela ao concluir).
  if (window.PrumoConta && !(await window.PrumoConta.iniciar())) return;
  try { estado.root = localStorage.getItem('raiz'); } catch { /* ignora */ }
  for (const b of document.querySelectorAll('#nav button')) b.addEventListener('click', () => mostrar(b.dataset.aba));
  iniciarMenu();
  await iniciarAgenda();
  mostrar('inicio');
  iniciarNotificacoes();
})();
