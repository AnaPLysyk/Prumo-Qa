# Backend de Projetos — um arquivo por ação

**Criar:** `criarProjeto.ts` cria o projeto e seu contrato local.

**Editar:** `editarProjeto.ts` altera nome e descrição.

**Pasta:** `vincularPastaDoProjeto.ts` confere o contrato antes de vincular.

**Serviços:** `vincularServicoAoProjeto.ts`, `removerServicoDoProjeto.ts` e `validarEstadoDoVinculo.ts` gerenciam as ligações externas.

**Critérios de aceite:** `configurarCampoAceite.ts` guarda o campo do Jira.

**Histórico:** `registrarConsultaExterna.ts` e `registrarEscritaExterna.ts` registram atividades.

**Vínculos entre casos e tickets:** `associarReferencias.ts` valida e registra associações explícitas.

**Dados:** `definicoesEspaco.ts` valida os dados; `armazenarEspacos.ts` lê e grava por meio de `src/armazenamentoLocal.ts`.

**Entrada temporária:** `src/espacos.ts` preserva os nomes que o Electron e outras regras já utilizam.
