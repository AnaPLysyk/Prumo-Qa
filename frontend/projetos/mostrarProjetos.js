'use strict';
/** Projetos: monta a tela principal; formulários e ações de cada projeto ficam em módulos próprios. */
abas.projetos = async elemento => {
  elemento.append(h('h1', {}, 'Projetos'));

  // Pastas com contrato legado continuam visíveis na parte inferior desta tela.
  if (estado.projetoLegado && estado.projetoNome) {
    elemento.append(
      h(
        'p',
        { class: 'nota', id: 'projeto-legado' },
        tr(
          'Projeto selecionado: {n}. É uma pasta com contrato local, listada no fim desta página.',
          { n: estado.projetoNome }
        ),
        ' ',
        DS.link(
          'Ver pasta',
          () => document.getElementById('pastas-contrato-local')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          }),
          { seta: false }
        )
      )
    );
  }

  const formulario = h('div', { id: 'espaco-form' });
  const editar = espaco => abrirFormularioProjeto(formulario, espaco);

  elemento.append(
    h(
      'div',
      { class: 'barra-acoes' },
      botao('Criar projeto manual', () => editar(), 'espaco-novo'),
      botao('Importar projetos do Qase', () => mostrar('conexoes'), 'espaco-importar-qase')
    ),
    formulario
  );

  const projetos = await chamar(api.espacos);
  if (!projetos) {
    elemento.append(DS.estadoTela('erro', 'Não foi possível consultar os projetos',
      'A lista de projetos não foi carregada. Nenhum cadastro foi alterado.',
      [DS.acao('Tentar novamente', () => mostrar('projetos'), { icone: 'atualizar' })],
      { id: 'projetos-falha-consulta' }));
    return;
  }

  for (const espaco of projetos) {
    elemento.append(montarSecaoProjeto(espaco, editar));
  }

  // Preserva a seção inferior de pastas locais com contrato já existente.
  await mostrarPastasLocais(elemento, projetos);
};
