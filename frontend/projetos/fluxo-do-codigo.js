/** A mesma origem de código em Projetos e na IDE: pasta nova, existente ou clone e envio explícito. */
window.PrumoCodigo = (() => {
  const atualizar = async e => {
    const r = await chamar(() => api.espacoObter(e.id));
    if (!r) return;
    if (estado.espaco?.id === e.id) estado.espaco = r;
    if (estado.projetoSelecionadoId === e.id) estado.projetoSelecionadoId = r.id;
    DS.fecharModal();
    void mostrar('testes');
  };
  function criar(e) {
    const nome = h('input', { id: 'codigo-pasta-nova', maxlength: 80, placeholder: 'meu-projeto' });
    DS.modal('Criar projeto do zero', [DS.info('Escolha o nome da pasta e depois onde criá-la. Você poderá criar o código e os testes na IDE, sem conectar um serviço.'), DS.campo('Nome da pasta nova', nome),
      DS.rodape(DS.acao('Cancelar', () => DS.fecharModal()), DS.acao('Escolher local e criar', async () => {
        const r = await chamar(() => api.ideCriarProjeto(e.id, nome.value.trim()));
        if (r?.pastaCriada) { avisar(tr('A pasta foi criada, mas o contrato não foi aprovado. Use Usar pasta existente para retomar:') + ' ' + r.pastaCriada, true); DS.fecharModal(); }
        else if (r && !r.canceled) await atualizar(e);
      }, { id: 'codigo-criar-projeto', primaria: true }))]);
    nome.focus();
  }
  const escolherPasta = async e => { const r = await chamar(() => api.espacoPasta(e.id)); if (r && !r.canceled) await atualizar(e); };
  const clonar = async e => { const r = await chamar(() => api.espacoTrazer(e.id, true)); if (r && !r.canceled) { if (r.vinculada === false) { avisar(tr('A cópia foi baixada, mas ainda precisa ser vinculada ao projeto.'), true); return; } await atualizar(e); } };
  function origem(e) {
    const gh = e.vinculos.find(v => v.servico === 'github');
    DS.modal('Código do projeto', [DS.meta([['Projeto', e.nome], ['Pasta da IDE', e.pastaLocal || tr('Nenhuma pasta selecionada')], ['GitHub', gh?.recurso.chave || tr('Não conectado')]]),
      DS.info('A IDE usa a pasta selecionada deste projeto. Salvar mantém as alterações no computador; use Enviar alterações para publicar no GitHub.'),
      DS.rodape(!e.pastaLocal ? DS.acao('Criar projeto do zero', () => criar(e), { primaria: true }) : null,
        DS.acao(e.pastaLocal ? 'Usar outra pasta existente' : 'Usar pasta existente', () => escolherPasta(e)),
        gh ? DS.acao(e.pastaLocal ? 'Usar clone do GitHub na IDE' : 'Clonar e usar na IDE', () => clonar(e)) : null,
        e.pastaLocal ? DS.acao('Publicar no GitHub', () => publicar(e)) : null,
        DS.acao('Fechar', () => DS.fecharModal()))]);
  }
  async function publicar(e) {
    const gh = e.vinculos.find(v => v.servico === 'github');
    if (!gh) return escolherRepositorio(e);
    const r = await chamar(() => api.idePublicacao(e.id)); if (!r) return;
    const mensagem = h('input', { id: 'codigo-mensagem', maxlength: 200, value: 'Atualizar projeto pelo Prumo QA' });
    const msg = h('p', { class: 'ds-sub', role: 'status' }); let enviando = false;
    const enviar = DS.acao('Enviar alterações', async () => {
      if (enviando) return; enviando = true; enviar.disabled = true;
      try {
        const resultado = await chamar(() => api.idePublicar(e.id, mensagem.value));
        if (resultado && !resultado.canceled) { avisar(tr('Código enviado e conferido no GitHub.') + ' ' + resultado.ramo); await atualizar(e); }
      } finally { enviando = false; enviar.disabled = false; }
    }, { id: 'codigo-enviar', primaria: true });
    DS.modal('Publicar no GitHub', [DS.meta([['Pasta da IDE', r.pasta], ['Repositório', gh.recurso.chave], ['Branch de envio', 'prumo/projeto-' + e.id]]),
      DS.info('Só os arquivos salvos serão enviados. .gitignore é respeitado. O envio cria um commit no branch do projeto; não faz merge nem altera o histórico Git local.'),
      DS.campo('Mensagem do commit', mensagem), h('ul', { class: 'ds-lista' }, [...r.alterados.map(p => '+ ' + p), ...r.removidos.map(p => '− ' + p)].map(p => h('li', {}, p))),
      !r.alterados.length && !r.removidos.length ? h('p', {}, tr('Nenhuma alteração local desde o último envio confirmado.')) : null,
      msg, DS.rodape(DS.acao('Fechar', () => DS.fecharModal()), DS.acao('Habilitar envios neste projeto', async () => { const x = await chamar(() => api.escritaHabilitar(e.id, 'github', true)); if (x && !x.canceled) msg.textContent = tr('Envios habilitados.'); }), enviar)], { tamanho: 'lg' });
  }
  async function escolherRepositorio(e) {
    const contas = await chamar(api.servicos); if (!contas) return;
    const github = contas.filter(c => c.servico === 'github' && c.ativa);
    if (!github.length) { DS.modal('Conectar GitHub', [DS.info('O código continua neste computador. Conecte sua conta GitHub em Projetos quando quiser publicar.'), DS.rodape(DS.acao('Abrir Projetos', () => { DS.fecharModal(); void mostrar('projetos'); }))]); return; }
    const conta = h('select', { id: 'codigo-conta' }, github.map(c => h('option', { value: c.id }, c.nome)));
    const nome = h('input', { id: 'codigo-repo-novo', maxlength: 100, placeholder: 'meu-projeto' });
    const privado = h('input', { type: 'checkbox', id: 'codigo-repo-privado', checked: true });
    const lista = h('div'); const msg = h('p', { role: 'status', class: 'ds-sub' }); let consulta = 0;
    async function existentes(offset = 0, anexar = false) {
      const id = ++consulta; const conexaoId = conta.value;
      const r = await chamar(() => api.projetosRecursos(conexaoId, { offset, limite: 100 })); if (id !== consulta || !r) return;
      if (!anexar) lista.replaceChildren();
      lista.querySelector('[data-mais]')?.remove();
      lista.append(...r.recursos.map(rec => h('div', { class: 'ds-cab-acoes' }, h('span', {}, rec.chave), DS.acao(rec.usadoPor ? 'Já vinculado' : 'Usar este repositório', async () => {
        const p = await chamar(() => api.projetosVincular(e.id, conexaoId, rec));
        if (p && !p.canceled) { const atual = await chamar(() => api.espacoObter(e.id)); if (atual) { if (estado.espaco?.id === e.id) estado.espaco = atual; await publicar(atual); } }
      }, { compacto: true, desabilitado: !!rec.usadoPor }))));
      if (r.proxima != null) { const mais = DS.acao('Carregar mais', () => existentes(r.proxima, true), { compacto: true }); mais.dataset.mais = ''; lista.append(mais); }
    }
    conta.addEventListener('change', () => existentes());
    DS.modal('Escolher repositório do GitHub', [DS.campo('Conta conectada', conta), DS.bloco('Usar um repositório existente', lista),
      DS.bloco('Criar um repositório novo', h('div', {}, DS.campo('Nome do repositório', nome), h('label', {}, privado, ' ', tr('Repositório privado')), DS.acao('Criar repositório', async () => {
        const r = await chamar(() => api.ideCriarRepositorio(e.id, conta.value, nome.value.trim(), privado.checked));
        if (r && !r.canceled) { if (estado.espaco?.id === e.id) estado.espaco = r.projeto; await publicar(r.projeto); }
      }, { id: 'codigo-criar-repositorio' }))), msg,
      DS.rodape(DS.acao('Fechar', () => DS.fecharModal()), DS.acao('Habilitar envios neste projeto', async () => { const r = await chamar(() => api.escritaHabilitar(e.id, 'github', true)); if (r && !r.canceled) msg.textContent = tr('Envios habilitados.'); }))], { tamanho: 'lg' });
    await existentes();
  }
  return { criar, origem, publicar };
})();
