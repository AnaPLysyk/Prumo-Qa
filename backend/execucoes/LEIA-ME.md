# execucoes — backend

Execuções: executar uma capacidade com aprovação humana, histórico de execuções e comentário de resultado no Jira.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `execucoesListar.ts` | Canal execucoes:listar: Histórico centralizado de execuções por projeto, repositório, ticket, rotina, estado e período. |
| `jiraPrevia.ts` | Canal jira:previa: Mostrar o comentário de resultado que seria publicado no Jira. |
| `jiraPublicar.ts` | Canal jira:publicar: Publicar o comentário de resultado em um ticket do projeto vinculado (única escrita remota do produto). |

## aprovacao/

A janela de senha do Windows que autoriza uma execução.

| Arquivo | O que faz |
| --- | --- |
| `solicitarAprovacao.ts` | Abre a janela de senha do Windows (aprovar.exe) mostrando projeto, comando e hash; devolve quem aprovou ou nada. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `gravarPublicacoesJira.ts` | Grava o registro das publicações de comentário no Jira, guardando as 1.000 últimas. |
| `lerPublicacoesJira.ts` | Lê o registro das publicações de comentário no Jira (publicacoes-jira.json). |
| `listarPublicacoes.ts` | Lista as publicações de comentário no Jira. |
| `publicacaoDoTrabalho.ts` | Busca a publicação de comentário de uma execução. |

## integracoes/

Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.

| Arquivo | O que faz |
| --- | --- |
| `marcadorDaExecucao.ts` | Texto que identifica no Jira o comentário de uma execução ("Prumo-Execução: <id>"). |
| `paragrafoDoComentario.ts` | Monta um parágrafo do comentário no formato do Jira. |
| `publicarComentarioDeResultado.ts` | Publica o comentário de resultado no Jira uma única vez (confere se já existe pelo marcador) e registra o resultado. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `ambienteMinimo.ts` | Monta o ambiente mínimo do processo de teste: só variáveis permitidas, sem PATH herdado nem segredos. |
| `codigoDoErroDePublicacao.ts` | Extrai o código do erro de uma falha de publicação (ou JIRA_PUBLISH_FAILED). |
| `criarEvidenciaInicial.ts` | Cria a evidência BLOCKED inicial antes de validar contrato, escopo e autorização humana. |
| `duracaoDoTrabalho.ts` | Calcula quanto tempo um trabalho levou (ou nada se não terminou). |
| `elegivelParaPublicar.ts` | Diz se uma execução agendada pode publicar o comentário: concluída, com ticket e coberta por política aprovada. |
| `encerrarArvoreDeProcessos.ts` | Encerra o processo de teste e todos os processos filhos (taskkill /T no Windows). |
| `escopoDaExecucao.ts` | Calcula o escopo que a pessoa aprova: hashes do contrato, do comando, do ambiente e dos arquivos envolvidos. |
| `escopoDeCapability.ts` | Confere se a capacidade pode rodar (declarada, não bloqueada, projeto não somente leitura) e calcula seu escopo. |
| `executarValidacao.ts` | Executa uma capacidade do projeto depois da aprovação humana, com tempo e saída limitados, e grava a evidência (PASS, FAIL, BLOCKED ou NOT_RUN). |
| `gravarRelatorioRedigido.ts` | Grava somente o relatório de testes redigido e remove artefatos não validados. |
| `listarExecucoes.ts` | Lista o histórico de execuções por projeto, repositório, ticket, rotina, estado e período. |
| `mascararLogsDaExecucao.ts` | Mascara segredos declarados e do ambiente antes de mostrar ou gravar a saída de uma execução. |
| `montarComentario.ts` | Escreve o comentário de resultado (PASS/FAIL, contagens, duração, evidência) a partir de uma execução concluída. |
| `prepararPublicacao.ts` | Mostra a prévia do comentário de resultado que seria publicado no Jira. |
| `publicacaoPodeRepetir.ts` | Diz se vale tentar publicar de novo (tempo esgotado, serviço fora ou limite de consultas). |
| `repositorioDoEspaco.ts` | Devolve o repositório GitHub vinculado ao projeto, se houver. |
| `resolverExecutavel.ts` | Descobre como chamar o node ou o npm instalado junto do Node, sem passar pelo shell. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `aprovacao.ts` | O que a janela de senha do Windows mostra para a pessoa aprovar: projeto, pasta, capacidade, comando, hash e validade. |
| `comentarioJira.ts` | Formato do registro das publicações de comentário de resultado no Jira. |
| `execucao.ts` | Autorização delegada (2.8): reconhece um consentimento humano prévio, restrito ao escopo exato. |
| `historicoDeExecucoes.ts` | Filtros aceitos pelo histórico de execuções. |
