'use strict';
/** Ajuda: paineis de versoes, atualizacoes, integracoes, dados e texto Markdown. */
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

