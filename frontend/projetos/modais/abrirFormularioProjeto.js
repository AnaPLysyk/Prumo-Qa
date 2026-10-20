'use strict';
/** Projetos: cria ou edita o cadastro manual; nenhuma integração é configurada neste formulário. */
function abrirFormularioProjeto(formulario, espaco) {
  const nome = campoPlataforma('Nome', {
    id: 'espaco-nome',
    maxlength: 200,
    value: espaco?.nome || ''
  });
  const descricao = campoPlataforma('Descrição', {
    id: 'espaco-descricao',
    maxlength: 1000,
    value: espaco?.descricao || ''
  });

  formulario.replaceChildren(
    h('h2', {}, espaco ? 'Editar projeto' : 'Novo projeto Prumo'),
    nome.no,
    descricao.no,
    botao('Salvar projeto', async () => {
      const dados = { nome: nome.input.value, descricao: descricao.input.value };
      const resultado = await chamar(() => espaco
        ? api.espacoEditar(espaco.id, dados)
        : api.espacoCriar(dados)
      );
      if (resultado) escolherEspaco(resultado);
    }, 'espaco-salvar'),
    botao('Cancelar', () => formulario.replaceChildren())
  );

  nome.input.focus();
}
