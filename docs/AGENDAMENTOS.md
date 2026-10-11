# Agendamentos, worker residente e comentário Jira — Prumo QA 2.8

O Prumo organiza e executa uma rotina de QA **sem IA**. Este documento descreve o funcionamento técnico. O guia em linguagem simples está na Ajuda do aplicativo (Agendamentos, bandeja e execuções).

## Visão geral

```
Janela / bandeja  ->  IPC validado  ->  agenda.ts (quando)  ->  fila.ts (o quê, uma vez)  ->  worker.ts (executa)
                                                                       |                              |
                                          autorizacoes.ts (pode?) -----+--> execucao.ts / k6.ts  ->  evidência em <projeto>/.prumo
                                                                                                  ->  jiraComentario.ts (opcional)
```

Tudo é Node puro (sem Electron) e testado fora da janela. Só `src/desktop/main.ts` conhece Electron: janela, bandeja, diálogos e ciclo de vida.

| Módulo | Responsabilidade |
|---|---|
| `src/agenda.ts` | Rotinas (único, intervalo, diário, semanal), fuso e horário de verão, slots, política de horários perdidos |
| `src/fila.ts` | Fila persistente: reivindicação única, batimento, recuperação, retentativa de infraestrutura, idempotência por chave |
| `src/autorizacoes.ts` | Autorização prévia de execução por escopo exato e política de publicação no Jira |
| `src/worker.ts` | Laço do worker, trava de instância única, tipos de rotina, parada controlada |
| `src/k6.ts`, `src/playwright.ts`, `reporters/` | Adaptador do k6 oficial, conversão de relatório Playwright e reporter do Prumo |
| `src/jiraComentario.ts` | Texto do comentário, publicação idempotente, rastreabilidade |
| `src/historicoCentral.ts` | Histórico por projeto, repositório, ticket, rotina, estado e período; métricas |
| `src/agendaOperacoes.ts` | Operações de aplicação (validar rotina, listar com permissões, autorizar) |

## Arquivos locais

Em `%LOCALAPPDATA%\PrumoQA\plataforma\`: `agenda.json`, `agenda-estado.json`, `fila.json`, `autorizacoes.json`, `publicacoes-jira.json`, `worker-trava.json`. Gravação atômica, arquivo regular sem links, limite de 2 MB. Nenhum contém credencial, corpo de resposta remota ou texto de ticket além do comentário preparado. Evidências continuam em `<projeto>/.prumo/evidencias`.

## Agenda

- **Único**: `em` com fuso explícito (ISO 8601). **Intervalo**: ancorado no instante de criação; mesmo resultado depois de reiniciar. **Diário** e **semanal**: hora de parede no fuso IANA escolhido.
- Horário de verão: hora inexistente (salto da primavera) avança para depois do salto, executando uma vez; hora repetida (fim do verão) vale a primeira ocorrência. O *slot* (instante UTC) é a chave de idempotência.
- **Horários perdidos** (Prumo fechado, computador desligado ou suspenso): política `PULAR` (padrão) registra `PERDIDO` com `NOT_RUN` quando passou da tolerância; `EXECUTAR_UMA_VEZ` executa só o mais recente e marca os demais como substituídos. Nunca se registra como executado o que não rodou.
- Pausar uma rotina e retomá-la não executa o que passou durante a pausa. A pausa global impede novos trabalhos; trabalho em andamento termina.

## Fila e worker

Estados: `PENDENTE`, `EXECUTANDO`, `CONCLUIDO`, `ERRO`, `CANCELADO`, `PERDIDO`. Uma execução por vez no total. Trabalho `EXECUTANDO` sem batimento recente (aplicativo fechado, queda, suspensão) é recuperado ao iniciar: volta a `PENDENTE` se restarem tentativas ou termina como `ERRO_INFRA`; nunca vira PASS. Falha de teste é **resultado** (FAIL), registrada uma vez; apenas falha de infraestrutura (rede, serviço indisponível) tem nova tentativa com espera crescente e limite de tentativas.

Trava `worker-trava.json` (pid + batimento): uma segunda instância do worker é recusada. O Electron já impede duas instâncias do aplicativo.

Parada controlada: ao sair, o worker aborta o processo filho (árvore inteira, `taskkill /T /F` no Windows), registra a evidência parcial como BLOCKED `CANCELLED`, marca o trabalho como `ERRO CANCELLED` e libera a trava.

## Autorização

Execuções **manuais** pedem a autenticação nativa do Windows (broker `aprovar.exe`) a cada vez, como antes. Para rotinas **agendadas**, a pessoa aprova **uma vez** um escopo exato pelo mesmo broker:

- projeto, capability, ambiente e **hash do escopo** (raiz, manifesto, comando, ambiente permitido e fontes de contexto);
- validade de 1 a 30 dias, limite de execuções e revogação;
- uma autorização vigente por projeto/capability/ambiente (a nova revoga a anterior).

Se o comando, o contrato, as fontes ou o ambiente mudarem, o hash muda e a execução fica `BLOCKED` até nova aprovação. Não existe autorização global. O broker não foi alterado e nenhum caminho cria aprovação sem ele. Em testes automatizados o consentimento humano é **simulado pelo runner** e isso é declarado no relatório; a autenticação humana real do Windows em execução agendada não foi verificada.

Tipos que só leem (consulta Jira, análise de mudanças) usam as conexões de leitura já configuradas e não precisam desta autorização.

## Rotinas

| Tipo | O que faz | Observações |
|---|---|---|
| `consulta-jira` | Lista tickets do projeto Jira vinculado ou um ticket | Compara `updated` com a consulta anterior; resultado `INFO` |
| `smoke`, `regressao` | Executa a capability declarada | Evidência, cenários individuais quando o runner os reporta |
| `validacao-ticket` | Executa as automações associadas ao ticket em Rastreabilidade | Sem associação verificável: `BLOCKED NO_VERIFIED_LINK` |
| `analise-mudancas` | Lê commits do GitHub vinculado | Recomenda regressão; **não** dispara execução |
| `k6` | Executa o k6 oficial | Veja abaixo |

A rotina nunca recebe comando livre: o esquema é estrito e a capability precisa existir no manifesto. Descrição de ticket é dado, nunca instrução.

## Playwright

O Prumo não impõe organização ao repositório. Ele executa a capability declarada e lê o resultado estruturado: o reporter incluído (`reporters/prumo-playwright-reporter.cjs`) grava `PRUMO_RESULT_FILE`, ou `src/playwright.ts` converte o JSON nativo (`passed`, `failed`, `timedOut`, `skipped`, `interrupted`, `flaky`). Teste ignorado vira `NOT_RUN`, interrompido vira `NOT_RUN`, falha vira `FAIL`. Sem relatório estruturado a rodada fica sem cenários individuais; o exit code não inventa cenários. A execução real do Playwright depende do projeto do usuário (dependências e navegadores) e não foi exercitada no laboratório.

## k6

Adaptador do executável oficial (nenhum código do k6 é copiado; licença AGPL-3.0 não é incorporada). O executável é procurado só em pastas absolutas do `PATH`. Limites obrigatórios: 1 a 50 usuários virtuais e 1 a 600 s. O script fica dentro do projeto (`.js`/`.mjs`, até 256 KB). Ambiente `local` só aceita `localhost`/`127.0.0.1`; `producao` é bloqueado. Sem k6 instalado a rotina fica `NOT_RUN RUNTIME_MISSING`. Exit 99 do k6 (limiar ultrapassado) é `FAIL`; outros códigos são falha de execução. Limiares e métricas do resumo oficial vão para a evidência. Execução real do k6 não foi exercitada nesta máquina por falta do executável; os testes usam um executável sintético.

## Comentário no Jira

É a **única escrita remota do produto**. Conteúdo montado só de dados locais da execução (ticket, projeto Prumo, tipo, ambiente, cenários, PASS/FAIL, resumo das falhas mascarado, referência local da evidência) e marcador `Prumo-Execução: <id>`. Só execuções reais com resultado PASS ou FAIL geram comentário; BLOCKED, NOT_RUN, INFO e erro de infraestrutura não. O comentário nunca afirma aprovação do ticket inteiro e nunca altera status.

- **Manual**: prévia, confirmação nativa que mostra o texto, publicação.
- **Agendado**: exige política de publicação aprovada (tickets, tipos, validade, quantidade); sem política nada é publicado.
- Transporte: `POST https://<instancia>.atlassian.net/rest/api/3/issue/<KEY>/comment`, host e caminho fixos, IP público fixado, sem redirects. O projeto do ticket é conferido antes.
- **Idempotência**: registro local por (execução, ticket) e busca do marcador no ticket antes de reenviar após falha ambígua (resposta perdida). Falha mantém o registro como pendência; nova tentativa não duplica.
- Rastreabilidade em `publicacoes-jira.json`: execução, projeto Prumo, conexão e vínculo Jira, ticket, estado, id remoto do comentário, tentativas e erro.

## Bandeja e ciclo de vida

Fechar a janela só a esconde. O ícone oferece: abrir Prumo, ver agendamentos, consultar execuções, pausar/retomar, estado do worker e sair. Um vigia reinicia o worker se ele parar sem pedido e avisa. Iniciar com o Windows é opcional e vem desligado. Não há serviço do Windows nem tarefa agendada: se o computador estiver desligado ou suspenso, nada roda.

## Notificações

Avisos nativos e som opcional para: rotina iniciada (só aviso interno), concluída, falha, bloqueada, publicação Jira com falha e worker interrompido. O mesmo aviso não se repete em 30 minutos. Enfileirar não gera aviso de sucesso.

## Histórico e métricas

`execucoes:listar` e `execucoes:metricas` consolidam fila, rotina, projeto, ticket e repositório vinculado. Métricas contam execuções reais (PASS, FAIL, BLOCKED, NOT_RUN); consultas (`INFO`) e horários perdidos ficam à parte; abrir a interface não conta como execução. Não há porcentagem de qualidade.

## Limitações

Veja [VALIDACAO.md](VALIDACAO.md) e a entrega 2.8: autenticação humana real do Windows em execução agendada, Jira/Qase/GitHub reais, k6 real, Playwright real, leitor de tela e assinatura digital não foram verificados.
