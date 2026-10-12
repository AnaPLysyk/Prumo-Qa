# projetos — backend

Projetos: projetos do Prumo, pastas de código vinculadas e o contrato qa.project.json.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `espacosAssociar.ts` | Canal espacos:associar: Registra uma ligação explícita entre dois itens do projeto (ex.: ticket ↔ caso). |
| `espacosAutomacoes.ts` | Canal espacos:automacoes: Mostra a pasta de código do projeto, os frameworks detectados, os comandos declarados e se o k6 está instalado. |
| `espacosCriar.ts` | Canal espacos:criar: Cria um projeto do Prumo com o nome e a descrição informados. |
| `espacosEditar.ts` | Canal espacos:editar: Altera o nome e a descrição de um projeto do Prumo. |
| `espacosListar.ts` | Canal espacos:listar: Lista os projetos do Prumo para a tela Projetos. |
| `espacosObter.ts` | Canal espacos:obter: Abre um projeto do Prumo com vínculos, relações e histórico. |
| `espacosPasta.ts` | Canal espacos:pasta: Vincular a pasta de um repositório de código ao projeto Prumo, de qualquer stack. |
| `projetosDemo.ts` | Canal projetos:demo: Copiar o projeto de demonstração para uma pasta gravável e vinculá-lo. |
| `projetosDesvincular.ts` | Canal projetos:desvincular: Remover o vínculo de um projeto da lista. |
| `projetosEscolher.ts` | Canal projetos:escolher: Abrir o seletor nativo de pasta e vincular o projeto se o contrato for válido. |
| `projetosListar.ts` | Canal projetos:listar: Listar projetos vinculados com a situação do contrato. |
| `projetoVisao.ts` | Canal projeto:visao: Métricas do projeto calculadas do histórico real. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `arquivoDePastasVinculadas.ts` | Caminho do arquivo vinculos.json, a lista de pastas de projeto vinculadas neste computador. |
| `atualizarEspaco.ts` | Abre um projeto do Prumo, aplica uma alteração e grava de volta. |
| `gravarEspacos.ts` | Grava os projetos do Prumo em espacos.json depois de conferir o formato. |
| `gravarPastasVinculadas.ts` | Grava a lista de pastas de projeto vinculadas (vinculos.json). |
| `lerEspacos.ts` | Lê os projetos do Prumo gravados em espacos.json. |
| `lerPastasVinculadas.ts` | Lê a lista de pastas de projeto vinculadas (vinculos.json). |
| `listarEspacos.ts` | Lista todos os projetos do Prumo. |
| `obterEspaco.ts` | Busca um projeto do Prumo pelo id; se não existe, avisa WORKSPACE_NOT_FOUND. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `abrirProjetoVinculado.ts` | Abre o contrato de uma pasta vinculada usando a pasta de dados escolhida. |
| `adicionarVinculo.ts` | Vincula uma pasta ao Prumo se ela tiver contrato válido; não repete pastas já vinculadas. |
| `associarEspaco.ts` | Registra uma ligação explícita entre dois itens (ex.: ticket Jira ↔ caso Qase) no projeto, recusando duplicadas e serviços não vinculados. |
| `atualizarEstadoDoVinculo.ts` | Atualiza o estado da ligação com um serviço (válida, sem permissão, indisponível...) depois de uma conferência. |
| `caminhoComparavel.ts` | Normaliza um caminho de pasta (caminho real, minúsculas) para comparar se duas pastas são a mesma. |
| `configurarAceite.ts` | Escolhe qual campo do Jira guarda os critérios de aceite deste projeto. |
| `copiarDemonstracao.ts` | Copia o projeto de demonstração para a pasta de dados do usuário (sem sobrescrever) para poder vinculá-lo. |
| `criarEspaco.ts` | Cria um projeto do Prumo: pasta própria, contrato somente leitura e registro na lista de projetos. |
| `desvincularPasta.ts` | Desvincula uma pasta de projeto (nada é apagado nela). |
| `editarEspaco.ts` | Altera o nome e a descrição de um projeto do Prumo. |
| `espacoDaRaiz.ts` | Descobre qual projeto do Prumo usa esta pasta. |
| `eventoEspaco.ts` | Anota um acontecimento no histórico do projeto (criado, editado, vinculado, consulta...), guardando só os 1.000 últimos. |
| `gravarContratoProposto.ts` | Grava o qa.project.json aprovado pela pessoa, sem sobrescrever; se não passar na validação, apaga. |
| `idDoProjetoPeloNome.ts` | Gera um identificador simples (letras, números e hífen) a partir do nome da pasta. |
| `listarPastasVinculadas.ts` | Lista as pastas de projeto vinculadas para a tela Projetos. |
| `listarRaizDoProjeto.ts` | Lista só a primeira camada de arquivos e pastas do projeto, sem seguir atalhos nem itens sensíveis. |
| `listarVinculos.ts` | Lista as pastas vinculadas com a situação atual de cada uma. |
| `projetoVinculado.ts` | Abre o contrato de uma pasta só se ela estiver na lista de vinculadas; senão recusa. |
| `proporContrato.ts` | Olha a pasta, descobre a tecnologia (npm, Python, Go...) e monta um qa.project.json proposto, sem gravar nada. |
| `registrarConsultaExterna.ts` | Anota no histórico do projeto que um serviço externo (Jira, Qase, GitHub) foi consultado. |
| `registrarEscritaExterna.ts` | Anota no histórico do projeto que algo foi escrito num serviço externo. |
| `removerVinculo.ts` | Desvincula uma pasta do Prumo (nada é apagado na pasta). |
| `removerVinculoServico.ts` | Remove a ligação do projeto com um serviço (Jira, Qase ou GitHub); nada é apagado no serviço. |
| `resumirContratoProposto.ts` | Escreve o resumo do contrato proposto que aparece na confirmação do Windows (pastas, comandos, observações). |
| `situacaoProjeto.ts` | Diz em que estado está uma pasta: integrada, sem contrato, com contrato inválido ou inexistente. |
| `vincularPasta.ts` | Vincula uma pasta de projeto usando a pasta de dados escolhida. |
| `vincularPastaAoEspaco.ts` | Liga a pasta de código ao projeto do Prumo, conferindo o contrato e se outra pessoa/projeto já usa a mesma pasta. |
| `vincularServicoAoEspaco.ts` | Liga o projeto a um recurso de um serviço (ex.: projeto Jira ABC) depois de validado. |
| `visaoGeralDoProjeto.ts` | Monta a visão geral de um projeto: contrato, capacidades, métricas e a última chamada de IA observada. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `contrato.ts` | Formato do contrato proposto e as regras que reconhecem tecnologias, pastas e scripts numa pasta nova. |
| `espacos.ts` | Formato de um projeto do Prumo ("espaço"): vínculos com serviços, relações, histórico e limites. |
| `painel.ts` | Filtros aceitos pelas telas Logs e Histórico e a lista de documentos da Ajuda. |
| `pastasVinculadas.ts` | Formato da lista de pastas vinculadas (vinculos.json) e da situação de cada pasta. |
