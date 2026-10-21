'use strict';
/** Navegação da janela: menu lateral, projeto selecionado, estado do worker e atalhos globais. */
/** Controla menu, tema, idioma, notificações e seletor de projeto da janela. */
// ---- Barra superior: esfera, estado do worker, tema e idioma ----
async function atualizarWorker() {
  const r = await api.workerEstado(); if (!r.ok) return null; const w = r.data; estado.worker = w;
  // Só ícone: a cor diz o estado; o texto vai para a dica e para o leitor de tela; clicar abre Agendamentos.
  const chip = $('#worker-estado'); if (chip) {
    const texto = textoWorker(w); const proxima = tr('Próxima execução: {quando}', { quando: w.proximaExecucao ? hora(w.proximaExecucao) : tr('nenhuma agendada') });
    const fase = nivelWorker(w) === 'falha' ? 'Parado' : w.pausado ? 'Pausado' : w.emExecucao ? 'Executando' : 'Ativo';
    chip.dataset.nivel = nivelWorker(w); chip.dataset.fase = fase.toLowerCase(); chip.dataset.dica = texto + '\n' + proxima;
    chip.removeAttribute('title'); chip.setAttribute('aria-label', texto + '. ' + proxima); chip.replaceChildren(DS.icone('worker' + fase));
    chip.onclick = () => mostrar('agenda');
  }
  qc.definirEstado(estadoOrb(w)); return w;
}

function aplicarMenu(fechado, salvar = true) { document.body.dataset.menu = fechado ? 'fechado' : 'aberto'; const b = $('#menu-alternar'); if (b) { b.setAttribute('aria-expanded', String(!fechado)); const t = tr(fechado ? 'Expandir menu' : 'Recolher menu'); b.setAttribute('aria-label', t); b.title = t; } if (salvar) { try { localStorage.setItem('menu', fechado ? 'fechado' : 'aberto'); } catch { /* sem armazenamento */ } } }

/** Lista todos os projetos QA e as pastas locais legadas, sem confundir seus contextos. */
function montarSeletorProjeto(espacos, pastas) {
  const btn = $('#projeto-botao'), lista = $('#projeto-lista');
  if (!btn || !lista) return;
  const projetos = Array.isArray(espacos) ? espacos : [];
  const locais = (Array.isArray(pastas) ? pastas : []).filter(p =>
    p.root && !projetos.some(e => e.raizContextos === p.root || e.pastaLocal === p.root));
  const item = (nome, ativo, fn, extra = {}) =>
    h('button', { type: 'button', class: 'projeto-item', 'aria-current': ativo ? 'true' : null,
      onclick: fn, ...extra }, nome);
  const fechar = () => { lista.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  const escolher = e => {
    estado.espaco = e;
    estado.projetoSelecionadoId = e.id;
    estado.root = e.raizContextos;
    estado.jobId = undefined;
    salvarRaiz();
    fechar();
    void mostrar(estado.aba);
  };
  const escolherLocal = p => {
    estado.espaco = null;
    estado.projetoSelecionadoId = null;
    estado.root = p.root;
    estado.jobId = undefined;
    salvarRaiz();
    fechar();
    // Pasta legada não é cadastro QA: apresenta a opção de vincular em Projetos.
    void mostrar('projetos');
  };
  // Menos informação no seletor: título de grupo só quando há projetos e pastas juntos; busca só com muitos itens.
  const doisGrupos = projetos.length > 0 && locais.length > 0;
  const comBusca = projetos.length + locais.length > 5;
  const semNada = Array.isArray(espacos) && !projetos.length && !locais.length;
  const grupo = (titulo, itens) => h('div', { class: 'projeto-grupo' },
    doisGrupos ? h('span', { class: 'projeto-grupo-titulo' }, titulo) : null, itens);
  const filtro = h('input', { class: 'projeto-busca', type: 'search', placeholder: 'Buscar projetos...',
    'aria-label': 'Buscar projetos ou pastas locais', autocomplete: 'off',
    oninput: () => {
      const busca = paraBusca(filtro.value.trim());
      for (const opcao of lista.querySelectorAll('button[data-seletor-item]')) {
        opcao.hidden = !paraBusca(opcao.textContent).includes(busca);
      }
      for (const g of lista.querySelectorAll('.projeto-grupo')) {
        g.hidden = !g.querySelector('button[data-seletor-item]:not([hidden])');
      }
    },
    onkeydown: ev => { if (ev.key === 'Escape') { ev.stopPropagation(); fechar(); btn.focus(); } }
  });
  const conteudo = comBusca ? [filtro] : [];
  // Sem nenhum projeto: só o aviso e o botão que já abre o formulário de criação.
  if (semNada) {
    conteudo.push(h('p', { class: 'projeto-vazio' }, 'Nenhum projeto criado ainda.'),
      item('Criar projeto', false, () => { fechar(); (estado.sub ||= {}).projetos = 'novo'; void mostrar('projetos'); },
        { class: 'projeto-item projeto-criar', id: 'projeto-criar-menu' }));
  } else if (Array.isArray(espacos)) {
    if (projetos.length) conteudo.push(grupo('PROJETOS DE QUALIDADE · ' + projetos.length,
      projetos.map(e => item(e.nome, estado.espaco?.id === e.id,
        () => escolher(e), { 'data-seletor-item': 'projeto', 'data-projeto': e.id,
          title: e.nome }))));
  } else {
    conteudo.push(h('p', { class: 'projeto-vazio', role: 'alert' },
      'Não foi possível consultar os projetos de qualidade.'),
      item('Tentar novamente', false, () => { fechar(); void mostrar(estado.aba); }));
  }
  if (locais.length) conteudo.push(grupo('PASTAS LOCAIS · ' + locais.length,
    locais.map(p => item(p.name || p.id || p.root.split(/[\\/]/).filter(Boolean).pop() || 'Pasta local',
      !estado.espaco && estado.root === p.root, () => escolherLocal(p),
      { 'data-seletor-item': 'local', 'data-raiz': p.root,
        title: 'Pasta vinculada ao computador; abra Projetos para associá-la à qualidade' }))));
  if (pastas === null) conteudo.push(h('span', { class: 'projeto-vazio' },
    'Não foi possível consultar as pastas locais.'));
  if (!semNada) conteudo.push(item(projetos.length || locais.length ? 'Gerenciar projetos' : 'Criar primeiro projeto',
    false, () => { fechar(); void mostrar('projetos'); }, { class: 'projeto-item gerenciar' }));
  lista.replaceChildren(...conteudo);
  lista.onkeydown = ev => { if (ev.key === 'Escape') { ev.stopPropagation(); fechar(); btn.focus(); } };
  const caixaSeletor = btn.closest?.('.seletor-projeto');
  if (caixaSeletor) caixaSeletor.onfocusout = ev => { if (!lista.hidden && ev.relatedTarget && !caixaSeletor.contains(ev.relatedTarget)) fechar(); };
  btn.onclick = ev => {
    ev.stopPropagation();
    const abrir = lista.hidden;
    lista.hidden = !abrir;
    btn.setAttribute('aria-expanded', String(abrir));
    if (abrir) (comBusca ? filtro : lista.querySelector('button[data-seletor-item]:not([hidden])') || lista.querySelector('button'))?.focus();
  };
  if (!montarSeletorProjeto.ligado) {
    montarSeletorProjeto.ligado = true;
    document.addEventListener('click', ev => {
      if (!lista.hidden && !lista.contains(ev.target) && !btn.contains(ev.target)) fechar();
    });
  }
}

/** Reflete o projeto ativo nas fontes dos módulos (dica do botão), sem legenda embaixo de cada item do menu. */
function atualizarMenuDoProjeto(espaco) {
  const vinculos = espaco?.vinculos || [];
  const tem = servico => vinculos.some(v => v.servico === servico);
  const fontes = {
    projetos: espaco ? ['Gerenciar conexões'] : ['Criar projeto'],
    tickets: [...(tem('jira') ? ['Jira'] : []), ...(tem('qase') ? ['Qase'] : []),
      ...(tem('github') ? ['GitHub'] : []), 'Prumo'],
    testes: [...(tem('qase') ? ['Qase'] : []), ...(tem('github') ? ['GitHub'] : []),
      ...(espaco?.pastaLocal ? ['Local'] : []), 'Prumo'],
    agenda: ['Projeto'], evidencias: ['Projeto'], metricas: ['Projeto'],
    logs: ['Projeto'], agentes: ['Projeto']
  };
  for (const b of document.querySelectorAll('#nav button[data-aba]')) {
    const tipo = b.dataset.aba, opcoes = fontes[tipo];
    if (!opcoes) continue;
    const titulo = b.querySelector('span')?.textContent?.trim() || tipo;
    b.title = espaco ? titulo + ' — ' + espaco.nome + ' — ' + opcoes.join(', ') : titulo + ' — Nenhum projeto selecionado';
    b.dataset.projeto = espaco?.id || '';
  }
  document.querySelector('#lateral')?.setAttribute('data-projeto-ativo', espaco?.id || '');
}

function iniciarAjustes() {
  const bt = $('#ajustes'); const pop = $('#controles'); if (!bt || !pop) return;
  const abrir = (v) => { pop.hidden = !v; bt.setAttribute('aria-expanded', String(v)); };
  bt.addEventListener('click', (ev) => { ev.stopPropagation(); abrir(pop.hidden); });
  document.addEventListener('click', (ev) => { if (!pop.hidden && !pop.contains(ev.target)) abrir(false); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !pop.hidden) { abrir(false); bt.focus(); } });
  // F5 / Ctrl+R: atualiza a tela atual com os dados mais recentes (sem recarregar a janela nem importar arquivo).
  document.addEventListener('keydown', (ev) => { if (ev.key === 'F5' || (ev.ctrlKey && ev.key.toLowerCase() === 'r')) { ev.preventDefault(); atualizarWorker().then(() => mostrar(estado.aba)); } });
  $('#site-institucional')?.addEventListener('click', () => chamar(() => api.abrirSite()));
}

function iniciarMenu() { iniciarAjustes(); let f = false; try { f = localStorage.getItem('menu') === 'fechado'; document.documentElement.dataset.acento = localStorage.getItem('acento') || 'azul'; } catch { /* sem armazenamento */ } aplicarMenu(f, false); $('#menu-alternar')?.addEventListener('click', () => aplicarMenu(document.body.dataset.menu !== 'fechado')); }
