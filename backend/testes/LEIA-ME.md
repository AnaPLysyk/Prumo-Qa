# testes — backend

Testes: IDE, Repositório, Runs e Planos — casos, automações, execuções com aprovação humana, evidências, vínculos e o comentário de resultado no Jira.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `execucoesListar.ts` | Canal execucoes:listar: Histórico centralizado de execuções por projeto, repositório, ticket, rotina, estado e período. |
| `jiraPrevia.ts` | Canal jira:previa: Mostrar o comentário de resultado que seria publicado no Jira. |
| `jiraPublicar.ts` | Canal jira:publicar: Publicar o comentário de resultado em um ticket do projeto vinculado (escrita remota, sempre com prévia e confirmação ou política). |
| `projetoEvidencias.ts` | Canal projeto:evidencias: Resultados e logs de execuções reais, preservando PASS, FAIL, BLOCKED e NOT_RUN. |
| `repositorioCaso.ts` | Canal repositorio:caso: Criar ou editar um caso offline sem publicar no Qase. |
| `repositorioListar.ts` | Canal repositorio:listar: Consultar casos e suítes do projeto no repositório offline. |
| `repositorioSuite.ts` | Canal repositorio:suite: Criar ou editar uma suíte de testes offline do projeto. |
| `runsBugs.ts` | Canal runs:bugs: Preparar rascunhos de bug para as falhas da run. |
| `runsCriar.ts` | Canal runs:criar: Criar a run no Qase com os casos escolhidos. |
| `runsExecutar.ts` | Canal runs:executar: Executar as automações associadas aos casos da run (somente capabilities declaradas). |
| `runsListar.ts` | Canal runs:listar: Listar as runs locais do projeto (preparadas, criadas, executadas e publicadas). |
| `runsPolitica.ts` | Canal runs:politica: Aprovar uma política para publicar resultados de uma run em rotinas agendadas. |
| `runsPreparar.ts` | Canal runs:preparar: Preparar uma run local com casos do Qase e identificar quais têm automação associada. |
| `runsPublicar.ts` | Canal runs:publicar: Publicar no Qase os resultados ainda não publicados e reler a run. |
| `runsResultado.ts` | Canal runs:resultado: Declarar o resultado de um caso manual. |
| `runsRevogar.ts` | Canal runs:revogar: Revogar uma política de escrita agendada. |
| `testesArquivo.ts` | Canal testes:arquivo: Ler o conteúdo de um arquivo de teste listado pelo catálogo, para a IDE (só é editável se não tiver segredo mascarado). |
| `testesCatalogo.ts` | Canal testes:catalogo: Ler os arquivos de teste da pasta do projeto, agrupar por feature e classificar cada teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade). |
| `testesGravar.ts` | Canal testes:gravar: Gravar ou criar um arquivo de teste na pasta vinculada, depois da confirmação nativa do Windows. |
| `testesPipelines.ts` | Canal testes:pipelines: Listar os pipelines do GitHub Actions (.github/workflows) da pasta vinculada ao projeto. |
| `vinculosMapa.ts` | Canal vinculos:mapa: Mapa de vínculos entre projeto, Jira, Qase, repositório, tickets, casos, runs, execuções e evidências, com lacunas de cadastro. |

## aprovacao/

A janela de senha do Windows que autoriza uma execução.

| Arquivo | O que faz |
| --- | --- |
| `aprovarNoLinux.ts` | Aprovação humana no Linux: janela com o escopo (zenity ou kdialog) e, em seguida, a autenticação do sistema (polkit/pkexec). |
| `aprovarNoMac.ts` | Aprovação humana no macOS: a janela de autenticação do próprio sistema (senha ou Touch ID), com o escopo no texto. |
| `executarAprovador.ts` | Roda um programa de autenticação do sistema (osascript, zenity, pkexec) sem shell, com prazo, e devolve o código de saída. |
| `solicitarAprovacao.ts` | Pede a aprovação humana no sistema da pessoa: janela de senha do Windows (aprovar.exe), autenticação do macOS ou polkit no Linux. |
| `textoDaAprovacao.ts` | Texto curto, sem marcação, que a janela de autenticação do sistema mostra para a pessoa aprovar. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `alterarRunLocal.ts` | Abre uma run local, aplica uma alteração, confere e grava. |
| `consultarEvidencias.ts` | Lê as evidências do projeto conferindo integridade e se pertencem a este projeto; sem evidência, responde NOT_RUN. |
| `excluirEvidencias.ts` | Apaga as evidências do projeto (Ajuda › Privacidade e dados), informando falhas. |
| `gravarPublicacoesJira.ts` | Grava o registro das publicações de comentário no Jira, guardando as 1.000 últimas. |
| `gravarRepositorioLocal.ts` | Grava dados locais de forma atômica e validada, sem tocar o cadastro de propostas. |
| `gravarRunsLocais.ts` | Grava as runs locais em runs-qase.json. |
| `lerPublicacoesJira.ts` | Lê o registro das publicações de comentário no Jira (publicacoes-jira.json). |
| `lerRepositorioLocal.ts` | Lê o repositório offline; ausência de arquivo não cria dados nem modifica propostas antigas. |
| `lerRunsLocais.ts` | Lê as runs locais gravadas em runs-qase.json. |
| `listarRunsLocais.ts` | Lista as runs locais de um projeto, da mais nova para a mais antiga. |
| `obterRunLocal.ts` | Busca uma run local pelo id. |
| `publicacaoDoTrabalho.ts` | Busca a publicação de comentário de uma execução. |
| `salvarEvidencia.ts` | Grava a evidência da execução em .prumo/evidencias do projeto, com impressão digital (exceto em projeto somente leitura). |

## integracoes/

Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.

| Arquivo | O que faz |
| --- | --- |
| `acharCasoNoQase.ts` | Procura um caso com o mesmo título (e suite) no Qase. |
| `associarCasoAoTicket.ts` | Liga um caso do Qase ao ticket do Jira de origem. |
| `associarTicketAoCasoNoQase.ts` | Operação "Associar caso do Qase a ticket do Jira". |
| `automacaoNoQase.ts` | Converte o tipo de automação do caso para o formato do Qase (0/1 no envio) e lê qualquer formato que o Qase devolva. |
| `camposDeSistema.ts` | Lê os campos de sistema do Qase (prioridade, severidade...). |
| `conferirCasosNoQase.ts` | Confere no Qase que todos os casos escolhidos existem no projeto vinculado. |
| `conferirIdsDoObjetoQase.ts` | Confere casos do plano/run releitos do Qase: IDs, não apenas quantidade. |
| `corpoDoCasoQase.ts` | Monta o corpo do caso de teste enviado ao Qase, com segredos mascarados. |
| `criarCasoNoQase.ts` | Operação "Criar caso de teste no Qase", ligando ao ticket de origem quando informado. |
| `criarDefeitoNoQase.ts` | Publica defeito Qase autorizado, com marcador de idempotência e confirmação por GET. |
| `criarPlanoNoQase.ts` | Operação "Criar plano de teste no Qase". |
| `criarRunNoQase.ts` | Cria no Qase a run correspondente à run local, depois da confirmação. |
| `criarRunNoQaseOperacao.ts` | Operação "Criar test run no Qase" (não executa nada). |
| `criarSuiteNoQase.ts` | Operação "Criar suite no Qase", sem repetir suite com o mesmo nome. |
| `editarCasoNoQase.ts` | Operação "Editar caso de teste no Qase". |
| `encerrarRunNoQase.ts` | Operação "Encerrar run no Qase". |
| `enviarAnexoAoQase.ts` | Operação "Enviar anexo ao Qase". |
| `idCriadoNoQase.ts` | Lê o id do item criado numa resposta do Qase. |
| `itensDaPaginaQase.ts` | Lê a lista de itens de uma resposta paginada do Qase. |
| `listarNoQase.ts` | Percorre as paginas da consulta Qase sem concluir falsamente que um caso/run/suite não existe. |
| `marcadorDaExecucao.ts` | Texto que identifica no Jira o comentário de uma execução ("Prumo-Execução: <id>"). |
| `mudarStatusDefeitoNoQase.ts` | Operação "Mudar status de defeito no Qase" (em andamento, resolvido ou inválido), com conferência por GET. |
| `operacoesQase.ts` | Lista das operações de escrita no Qase que o Prumo conhece. |
| `paragrafoDoComentario.ts` | Monta um parágrafo do comentário no formato do Jira. |
| `publicarComentarioDeResultado.ts` | Publica o comentário de resultado no Jira uma única vez (confere se já existe pelo marcador) e registra o resultado. |
| `publicarResultadosNoQase.ts` | Operação "Publicar resultados na run do Qase", sem reenviar o que já foi registrado. |
| `publicarRunLocal.ts` | Publica no Qase os resultados ainda não enviados e confere relendo a run. |
| `resultadosDaRun.ts` | Lê os resultados já registrados numa run do Qase (até 1.000). |
| `tituloComparavel.ts` | Simplifica um título (espaços e minúsculas) para comparar casos. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `ambienteMinimo.ts` | Monta o ambiente mínimo do processo de teste: só variáveis permitidas, sem PATH herdado nem segredos. |
| `analisarArquivoFeature.ts` | Encontra os cenários de um arquivo .feature (Gherkin) com suas etiquetas. |
| `analisarArquivoJs.ts` | Encontra os testes (describe/test/it) de um arquivo JavaScript/TypeScript. |
| `analisarArquivoPython.ts` | Encontra as funções test_ de um arquivo Python. |
| `analisarPlaywright.ts` | Aponta problemas num teste Playwright (esperas fixas, seletores frágeis, falta de verificação...) com a orientação e a fonte oficial. |
| `anotarQase.ts` | Marca em cada teste encontrado onde ele termina e quais casos do Qase cita. |
| `aplicarEvidencia.ts` | Copia o resultado de uma execução para os casos da run que usam a mesma automação. |
| `arquivoDeTeste.ts` | Lê um arquivo de teste (ou pipeline do GitHub Actions) para a IDE, só dentro da pasta do projeto. |
| `automacaoDoCaso.ts` | Descobre se um caso do Qase tem automação associada no projeto (qual capacidade e qual cenário). |
| `blocosDeTeste.ts` | Separa cada test(...) de um arquivo Playwright com seu título e corpo. |
| `catalogoDeTestes.ts` | Monta o catálogo de testes do projeto: arquivos agrupados por funcionalidade, cada teste classificado e contado por tipo. |
| `classificarResultado.ts` | Decide o estado final de uma execução: BLOCKED (impedida), NOT_RUN (não rodou), FAIL ou PASS. Falha de processo nunca vira PASS. |
| `classificarTeste.ts` | Classifica um teste (unitário, integração, funcional, regressão, smoke, desempenho, acessibilidade) dizendo o motivo e a confiança. |
| `codigoDoErroDePublicacao.ts` | Extrai o código do erro de uma falha de publicação (ou JIRA_PUBLISH_FAILED). |
| `codigoSemComentarios.ts` | Apaga os comentários de um código mantendo as linhas no lugar, para analisar só o que executa. |
| `coletarArquivosDeTeste.ts` | Procura os arquivos de teste na pasta do projeto, pulando node_modules, builds e atalhos, com limites. |
| `converterRelatorioPlaywright.ts` | Transforma o relatório JSON do Playwright em um resultado por cenário (PASS, FAIL, BLOCKED) com evidência. |
| `criarEvidenciaInicial.ts` | Cria a evidência BLOCKED inicial antes de validar contrato, escopo e autorização humana. |
| `declaraPlaywright.ts` | Diz se um package.json declara @playwright/test. |
| `declararResultadoManual.ts` | Registra o resultado de um caso manual dito pela pessoa, sem apagar resultado de execução. |
| `detectarFrameworks.ts` | Descobre, por evidência (dependência, configuração, imports), quais frameworks de teste o projeto usa. |
| `duracaoDoTrabalho.ts` | Calcula quanto tempo um trabalho levou (ou nada se não terminou). |
| `ehTestePlaywright.ts` | Diz se o arquivo é um teste Playwright. |
| `elegivelParaPublicar.ts` | Diz se uma execução agendada pode publicar o comentário: concluída, com ticket e coberta por política aprovada. |
| `encerrarArvoreDeProcessos.ts` | Encerra o processo de teste e todos os processos filhos (taskkill /T no Windows). |
| `escopoDaExecucao.ts` | Calcula o escopo que a pessoa aprova: hashes do contrato, do comando, do ambiente e dos arquivos envolvidos. |
| `escopoDeCapability.ts` | Confere se a capacidade pode rodar (declarada, não bloqueada, projeto não somente leitura) e calcula seu escopo. |
| `escreverArquivoDeTeste.ts` | Grava ou cria um arquivo de teste ou de pipeline (.github/workflows) só dentro da pasta do projeto: sem atalhos, até 300 KB, troca atômica e recusa se o arquivo mudou desde a leitura. |
| `etiquetasDoTeste.ts` | Lê as etiquetas @tag de um trecho de teste (ex.: @smoke). |
| `executarRunLocal.ts` | Executa as automações dos casos da run (só capacidades declaradas) e anota os resultados. |
| `executarValidacao.ts` | Executa uma capacidade do projeto depois da aprovação humana, com tempo e saída limitados, e grava a evidência (PASS, FAIL, BLOCKED ou NOT_RUN). |
| `funcionalidadeDoArquivo.ts` | Deduz o nome da funcionalidade a partir do caminho do arquivo de teste. |
| `gravarRelatorioRedigido.ts` | Grava somente o relatório de testes redigido e remove artefatos não validados. |
| `idsQase.ts` | Acha no código de um teste os ids de casos do Qase (ex.: qase(12), @qase-12). |
| `importaPlaywright.ts` | Diz se um arquivo de teste importa @playwright/test. |
| `listarEvidenciasDoProjeto.ts` | Lista as evidências de execução do projeto, com segredos mascarados, para a tela Evidências. |
| `listarExecucoes.ts` | Lista o histórico de execuções por projeto, repositório, ticket, rotina, estado e período. |
| `listarPipelines.ts` | Lista os pipelines (.github/workflows) da pasta do projeto, com nome, eventos e jobs lidos do próprio arquivo, sem executar nada. |
| `listarRepositorioLocal.ts` | Combina casos locais próprios e casos pessoais antigos, sem duplicar IDs nem modificar propostas.json. |
| `mapaDeVinculos.ts` | Desenha o mapa de ligações do projeto (Jira, Qase, repositório, tickets, casos, runs, execuções e evidências) e mostra o que falta ligar. |
| `mascararLogsDaExecucao.ts` | Mascara segredos declarados e do ambiente antes de mostrar ou gravar a saída de uma execução. |
| `montarComentario.ts` | Escreve o comentário de resultado (PASS/FAIL, contagens, duração, evidência) a partir de uma execução concluída. |
| `pareceArquivoDePipeline.ts` | Diz pelo caminho se um arquivo é um pipeline do GitHub Actions (.github/workflows/*.yml ou *.yaml, sem subpastas). |
| `pareceArquivoDeTeste.ts` | Diz pelo nome se um arquivo é de teste (.spec, .test, .feature, test_*.py). |
| `prepararPublicacao.ts` | Mostra a prévia do comentário de resultado que seria publicado no Jira. |
| `prepararRunLocal.ts` | Prepara uma run local com os casos escolhidos, marcando quais têm automação. |
| `propostasDeBugs.ts` | Cria rascunhos de bug para os casos que falharam na run. |
| `publicacaoPodeRepetir.ts` | Diz se vale tentar publicar de novo (tempo esgotado, serviço fora ou limite de consultas). |
| `recorteDaLinha.ts` | Encurta uma linha de código para mostrar como evidência. |
| `repositorioDoEspaco.ts` | Devolve o repositório GitHub vinculado ao projeto, se houver. |
| `resolverExecutavel.ts` | Descobre como chamar o node ou o npm instalado junto do Node, sem passar pelo shell. |
| `revisarCobertura.ts` | Revisa um plano de testes contra o requisito: rastreabilidade, riscos, oráculos, lacunas e cenários repetidos. Nunca diz que está aprovado. |
| `salvarCasoLocal.ts` | Cria/edita caso offline. Ao editar um legado, copia o mesmo ID para o arquivo novo sem apagar o original. |
| `salvarSuiteLocal.ts` | Cria/edita suítes locais com escopo por projeto e recusa árvore cíclica. |
| `seletorFragil.ts` | Diz se um seletor de tela é frágil (XPath, nth-child, classes geradas, cadeias de div). |

## reporters/

Relatores (Playwright e node:test) que gravam o resultado de cada caso no formato do Prumo, para usar nos projetos.

| Arquivo | O que faz |
| --- | --- |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `aprovacao.ts` | O que a janela de senha do Windows mostra para a pessoa aprovar: projeto, pasta, capacidade, comando, hash e validade. |
| `catalogoDeTestes.ts` | Tipos de teste, formato do catálogo e as pastas e limites usados ao procurar testes. |
| `comentarioJira.ts` | Formato do registro das publicações de comentário de resultado no Jira. |
| `escritaQase.ts` | Formatos aceitos nas operações de escrita no Qase (suite, caso, plano, run, resultados, anexo). |
| `evidencia.ts` | Formato de uma evidência de execução: estados PASS/FAIL/BLOCKED/NOT_RUN, casos, logs e integridade. |
| `execucao.ts` | Autorização delegada (2.8): reconhece um consentimento humano prévio, restrito ao escopo exato. |
| `frameworks.ts` | Formato de um framework detectado e de um achado de teste, com as fontes oficiais do Playwright. |
| `historicoDeExecucoes.ts` | Filtros aceitos pelo histórico de execuções. |
| `mapaDeVinculos.ts` | Formato dos nós e ligações do mapa de rastreabilidade. |
| `relatorioPlaywright.ts` | Formato do relatório JSON do Playwright e do caso convertido para o Prumo. |
| `repositorioLocal.ts` | Cadastro de casos e suítes do modo offline. Independente de propostas e do Qase. |
| `revisaoDeCobertura.ts` | Formato do plano enviado para revisão de cobertura (requisito, cenários, testes existentes, contradições). |
| `runLocal.ts` | Formato de uma run local (casos, resultados, publicações) e a tradução de estados para o Qase. |
