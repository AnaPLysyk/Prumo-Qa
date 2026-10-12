# testes — backend

Testes: catálogo de testes da pasta, análise de testes, runs do Qase e publicação de resultados.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `runsBugs.ts` | Canal runs:bugs: Preparar rascunhos de bug para as falhas da run. |
| `runsCriar.ts` | Canal runs:criar: Criar a run no Qase com os casos escolhidos. |
| `runsExecutar.ts` | Canal runs:executar: Executar as automações associadas aos casos da run (somente capabilities declaradas). |
| `runsListar.ts` | Canal runs:listar: Listar as runs locais do projeto (preparadas, criadas, executadas e publicadas). |
| `runsPolitica.ts` | Canal runs:politica: Aprovar uma política para publicar resultados de uma run em rotinas agendadas. |
| `runsPreparar.ts` | Canal runs:preparar: Preparar uma run local com casos do Qase e identificar quais têm automação associada. |
| `runsPublicar.ts` | Canal runs:publicar: Publicar no Qase os resultados ainda não publicados e reler a run. |
| `runsResultado.ts` | Canal runs:resultado: Declarar o resultado de um caso manual. |
| `runsRevogar.ts` | Canal runs:revogar: Revogar uma política de escrita agendada. |
| `testesArquivo.ts` | Canal testes:arquivo: Ler o conteúdo de um arquivo de teste listado pelo catálogo, para a visão de código. |
| `testesCatalogo.ts` | Canal testes:catalogo: Ler os arquivos de teste da pasta do projeto, agrupar por feature e classificar cada teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade). |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `alterarRunLocal.ts` | Abre uma run local, aplica uma alteração, confere e grava. |
| `gravarRunsLocais.ts` | Grava as runs locais em runs-qase.json. |
| `lerRunsLocais.ts` | Lê as runs locais gravadas em runs-qase.json. |
| `listarRunsLocais.ts` | Lista as runs locais de um projeto, da mais nova para a mais antiga. |
| `obterRunLocal.ts` | Busca uma run local pelo id. |

## integracoes/

Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.

| Arquivo | O que faz |
| --- | --- |
| `acharCasoNoQase.ts` | Procura um caso com o mesmo título (e suite) no Qase. |
| `associarCasoAoTicket.ts` | Liga um caso do Qase ao ticket do Jira de origem. |
| `associarTicketAoCasoNoQase.ts` | Operação "Associar caso do Qase a ticket do Jira". |
| `camposDeSistema.ts` | Lê os campos de sistema do Qase (prioridade, severidade...). |
| `conferirCasosNoQase.ts` | Confere no Qase que todos os casos escolhidos existem no projeto vinculado. |
| `corpoDoCasoQase.ts` | Monta o corpo do caso de teste enviado ao Qase, com segredos mascarados. |
| `criarCasoNoQase.ts` | Operação "Criar caso de teste no Qase", ligando ao ticket de origem quando informado. |
| `criarPlanoNoQase.ts` | Operação "Criar plano de teste no Qase". |
| `criarRunNoQase.ts` | Cria no Qase a run correspondente à run local, depois da confirmação. |
| `criarRunNoQaseOperacao.ts` | Operação "Criar test run no Qase" (não executa nada). |
| `criarSuiteNoQase.ts` | Operação "Criar suite no Qase", sem repetir suite com o mesmo nome. |
| `editarCasoNoQase.ts` | Operação "Editar caso de teste no Qase". |
| `encerrarRunNoQase.ts` | Operação "Encerrar run no Qase". |
| `enviarAnexoAoQase.ts` | Operação "Enviar anexo ao Qase". |
| `idCriadoNoQase.ts` | Lê o id do item criado numa resposta do Qase. |
| `itensDaPaginaQase.ts` | Lê a lista de itens de uma resposta paginada do Qase. |
| `listarNoQase.ts` | Lista casos, runs, planos ou suites do projeto Qase com filtros. |
| `operacoesQase.ts` | Lista das operações de escrita no Qase que o Prumo conhece. |
| `publicarResultadosNoQase.ts` | Operação "Publicar resultados na run do Qase", sem reenviar o que já foi registrado. |
| `publicarRunLocal.ts` | Publica no Qase os resultados ainda não enviados e confere relendo a run. |
| `resultadosDaRun.ts` | Lê os resultados já registrados numa run do Qase (até 1.000). |
| `tituloComparavel.ts` | Simplifica um título (espaços e minúsculas) para comparar casos. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `analisarArquivoFeature.ts` | Encontra os cenários de um arquivo .feature (Gherkin) com suas etiquetas. |
| `analisarArquivoJs.ts` | Encontra os testes (describe/test/it) de um arquivo JavaScript/TypeScript. |
| `analisarArquivoPython.ts` | Encontra as funções test_ de um arquivo Python. |
| `analisarPlaywright.ts` | Aponta problemas num teste Playwright (esperas fixas, seletores frágeis, falta de verificação...) com a orientação e a fonte oficial. |
| `anotarQase.ts` | Marca em cada teste encontrado onde ele termina e quais casos do Qase cita. |
| `aplicarEvidencia.ts` | Copia o resultado de uma execução para os casos da run que usam a mesma automação. |
| `arquivoDeTeste.ts` | Lê um arquivo de teste listado no catálogo para a visão de código, só dentro da pasta do projeto. |
| `automacaoDoCaso.ts` | Descobre se um caso do Qase tem automação associada no projeto (qual capacidade e qual cenário). |
| `blocosDeTeste.ts` | Separa cada test(...) de um arquivo Playwright com seu título e corpo. |
| `catalogoDeTestes.ts` | Monta o catálogo de testes do projeto: arquivos agrupados por funcionalidade, cada teste classificado e contado por tipo. |
| `classificarTeste.ts` | Classifica um teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade) dizendo o motivo e a confiança. |
| `codigoSemComentarios.ts` | Apaga os comentários de um código mantendo as linhas no lugar, para analisar só o que executa. |
| `coletarArquivosDeTeste.ts` | Procura os arquivos de teste na pasta do projeto, pulando node_modules, builds e atalhos, com limites. |
| `converterRelatorioPlaywright.ts` | Transforma o relatório JSON do Playwright em um resultado por cenário (PASS, FAIL, BLOCKED) com evidência. |
| `declaraPlaywright.ts` | Diz se um package.json declara @playwright/test. |
| `declararResultadoManual.ts` | Registra o resultado de um caso manual dito pela pessoa, sem apagar resultado de execução. |
| `detectarFrameworks.ts` | Descobre, por evidência (dependência, configuração, imports), quais frameworks de teste o projeto usa. |
| `ehTestePlaywright.ts` | Diz se o arquivo é um teste Playwright. |
| `etiquetasDoTeste.ts` | Lê as etiquetas @tag de um trecho de teste (ex.: @smoke). |
| `executarRunLocal.ts` | Executa as automações dos casos da run (só capacidades declaradas) e anota os resultados. |
| `funcionalidadeDoArquivo.ts` | Deduz o nome da funcionalidade a partir do caminho do arquivo de teste. |
| `idsQase.ts` | Acha no código de um teste os ids de casos do Qase (ex.: qase(12), @qase-12). |
| `importaPlaywright.ts` | Diz se um arquivo de teste importa @playwright/test. |
| `pareceArquivoDeTeste.ts` | Diz pelo nome se um arquivo é de teste (.spec, .test, .feature, test_*.py). |
| `prepararRunLocal.ts` | Prepara uma run local com os casos escolhidos, marcando quais têm automação. |
| `propostasDeBugs.ts` | Cria rascunhos de bug para os casos que falharam na run. |
| `recorteDaLinha.ts` | Encurta uma linha de código para mostrar como evidência. |
| `revisarCobertura.ts` | Revisa um plano de testes contra o requisito: rastreabilidade, riscos, oráculos, lacunas e cenários repetidos. Nunca diz que está aprovado. |
| `seletorFragil.ts` | Diz se um seletor de tela é frágil (XPath, nth-child, classes geradas, cadeias de div). |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `catalogoDeTestes.ts` | Tipos de teste, formato do catálogo e as pastas e limites usados ao procurar testes. |
| `escritaQase.ts` | Formatos aceitos nas operações de escrita no Qase (suite, caso, plano, run, resultados, anexo). |
| `frameworks.ts` | Formato de um framework detectado e de um achado de teste, com as fontes oficiais do Playwright. |
| `relatorioPlaywright.ts` | Formato do relatório JSON do Playwright e do caso convertido para o Prumo. |
| `revisaoDeCobertura.ts` | Formato do plano enviado para revisão de cobertura (requisito, cenários, testes existentes, contradições). |
| `runLocal.ts` | Formato de uma run local (casos, resultados, publicações) e a tradução de estados para o Qase. |
