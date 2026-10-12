# agendamentos — backend

Agendamentos: rotinas, fila de trabalhos, worker residente, autorizações prévias e k6.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `agendaAutorizar.ts` | Canal agenda:autorizar: Autorizar previamente execuções agendadas de um escopo exato, com validade e limite de usos. |
| `agendaEstado.ts` | Canal agenda:estado: Pausar, retomar ou desativar uma rotina. |
| `agendaExcluir.ts` | Canal agenda:excluir: Excluir uma rotina (histórico de execuções permanece). |
| `agendaExecutar.ts` | Canal agenda:executar: Executar uma rotina agora (trabalho manual). |
| `agendaListar.ts` | Canal agenda:listar: Listar as rotinas agendadas com próxima e última execução, permissões e autorizações. |
| `agendaPermissoes.ts` | Canal agenda:permissoes: Listar autorizações de execução e políticas de publicação com seus estados. |
| `agendaPolitica.ts` | Canal agenda:politica: Aprovar uma política de publicação de comentários no Jira restrita a tickets, tipos, validade e limite. |
| `agendaRevogar.ts` | Canal agenda:revogar: Revogar uma autorização de execução. |
| `agendaRevogarPolitica.ts` | Canal agenda:revogarpolitica: Revogar uma política de publicação. |
| `agendaSalvar.ts` | Canal agenda:salvar: Criar ou editar uma rotina (único, intervalo, diário ou semanal, com fuso). |
| `workerEstado.ts` | Canal worker:estado: Estado real do worker de agendamentos. |
| `workerEventos.ts` | Canal worker:eventos: Receber avisos do worker e pedidos de navegação da bandeja desde o último número visto. |
| `workerPausa.ts` | Canal worker:pausa: Pausar ou retomar todos os agendamentos. |

## autorizacoes/

Autorizações prévias e políticas aprovadas pela pessoa, com validade e limite de usos.

| Arquivo | O que faz |
| --- | --- |
| `autorizacaoDelegada.ts` | Cria a verificação que o worker usa: só executa se houver autorização vigente para exatamente o mesmo escopo, e gasta um uso. |
| `autorizacaoVigente.ts` | Diz se uma autorização ainda vale (não revogada e não vencida). |
| `autorizarEscopo.ts` | Pede a autenticação humana do Windows e grava a autorização para um escopo exato (projeto, comando por hash, ambiente). |
| `autorizarExecucao.ts` | Autoriza execuções agendadas de uma capacidade do projeto. |
| `autorizarRotina.ts` | Pede a autenticação do Windows e cria a autorização prévia para a rotina rodar sozinha (escopo exato, validade e limite de usos). |
| `consumirPoliticaEscrita.ts` | Gasta um uso da política de escrita no Qase antes de publicar. |
| `consumirPublicacao.ts` | Gasta uma publicação da política antes de publicar. |
| `criarPoliticaEscrita.ts` | Cria a política que permite rotinas publicarem resultados numa run do Qase, com validade e limite. |
| `criarPoliticaPublicacao.ts` | Cria a política que permite a rotina publicar comentário em tickets escolhidos, com validade e limite. |
| `devolverPublicacao.ts` | Devolve a publicação gasta quando o envio falhou. |
| `estadoDaAutorizacao.ts` | Diz o estado de uma autorização de execução: vigente, expirada, revogada ou esgotada. |
| `estadoDaPoliticaDeEscrita.ts` | Diz o estado de uma política de escrita no Qase. |
| `estadoDaPoliticaDePublicacao.ts` | Diz o estado de uma política de publicação no Jira. |
| `politicaCobre.ts` | Busca a política vigente que cobre este ticket e este tipo de rotina. |
| `revogarExecucao.ts` | Revoga uma autorização de execução. |
| `revogarPoliticaEscrita.ts` | Revoga uma política de escrita no Qase. |
| `revogarPublicacao.ts` | Revoga uma política de publicação no Jira. |
| `validadeDaAutorizacao.ts` | Calcula até quando uma autorização vale (de 1 a 30 dias). |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `agendaPausada.ts` | Diz se todos os agendamentos estão pausados. |
| `alterarRotina.ts` | Abre uma rotina, aplica uma alteração, confere e grava. |
| `cancelarTrabalho.ts` | Cancela um trabalho que ainda não começou. |
| `concluirTrabalho.ts` | Marca o trabalho como concluído com o resultado. |
| `definirEstadoJiraDoTrabalho.ts` | Anota o estado da publicação do comentário no Jira para o trabalho. |
| `enfileirar.ts` | Coloca um trabalho na fila uma única vez (a mesma chave nunca vira dois trabalhos). |
| `falharPorInfraestrutura.ts` | Registra falha de infraestrutura; tenta de novo mais tarde, com espera crescente, quando ainda há tentativas. |
| `fecharTentativa.ts` | Fecha a tentativa em andamento de um trabalho com o estado final. |
| `gravarAgenda.ts` | Grava as rotinas agendadas e a pausa geral (agenda.json). |
| `gravarAutorizacoes.ts` | Grava as autorizações e políticas (autorizacoes.json). |
| `gravarEstadoDasRotinas.ts` | Grava o estado de execução de cada rotina (agenda-estado.json). |
| `gravarFila.ts` | Grava a fila de trabalhos; quando passa de 1.500, apaga só os encerrados mais antigos, nunca os pendentes. |
| `lerAgenda.ts` | Lê as rotinas agendadas e a pausa geral (agenda.json). |
| `lerAutorizacoes.ts` | Lê as autorizações de execução e as políticas de publicação (autorizacoes.json). |
| `lerEstadoDasRotinas.ts` | Lê o estado de execução de cada rotina (agenda-estado.json). |
| `lerFila.ts` | Lê a fila de trabalhos (fila.json). |
| `lerTravaDoWorker.ts` | Lê a trava que garante um único worker ligado; se o arquivo estiver ilegível (ex.: queda de energia), põe de lado e segue. |
| `listarAutorizacoes.ts` | Lista todas as autorizações e políticas. |
| `listarRotinas.ts` | Lista todas as rotinas agendadas. |
| `listarTrabalhos.ts` | Lista todos os trabalhos da fila. |
| `mudarTrabalho.ts` | Abre um trabalho da fila, aplica uma alteração, confere e grava. |
| `obterRotina.ts` | Busca uma rotina pelo id; se não existe, avisa SCHEDULE_NOT_FOUND. |
| `obterTrabalho.ts` | Busca um trabalho da fila pelo id. |
| `pegarProximoTrabalho.ts` | Pega o próximo trabalho pendente para executar, um de cada vez. |
| `recuperarInterrompidos.ts` | Encontra trabalhos que ficaram "executando" sem batimento (o aplicativo caiu) e os devolve à fila ou encerra. |
| `registrarBatimento.ts` | Anota que o trabalho em execução continua vivo (batimento). |
| `registrarPerdido.ts` | Registra um horário que não vai rodar (perdido ou substituído) sem confundir com execução. |

## k6/

Teste de desempenho com o executável oficial do k6, com limites e produção bloqueada.

| Arquivo | O que faz |
| --- | --- |
| `capacidadeDoK6.ts` | Nome da capacidade de um script k6 (k6:<caminho>). |
| `enderecoLocal.ts` | Diz se um endereço é deste próprio computador (localhost, 127.x, ::1). |
| `escopoDoK6.ts` | Calcula o escopo exato (hash do script, destino, limites e executável) que a autorização do k6 cobre. |
| `executarK6.ts` | Executa o teste k6 autorizado, sem shell e com teto de tempo, e grava a evidência. |
| `localizarK6.ts` | Procura o executável oficial do k6 nas pastas absolutas do PATH. |
| `metricasDoK6.ts` | Extrai do resumo do k6 as métricas principais (requisições, falhas, tempos). |
| `validarAlvoDoK6.ts` | Confere o destino do teste k6: http(s), sem senha na URL, só localhost em ambiente local e nunca produção. |
| `validarLimitesDoK6.ts` | Confere os limites do k6: até 50 usuários virtuais e 600 segundos. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `anotarNaRotina.ts` | Anota um acontecimento no histórico da rotina, guardando os 200 últimos. |
| `capacidadesDaRotina.ts` | Diz quais comandos do projeto (capacidades) uma rotina vai executar. |
| `criarRotina.ts` | Cria uma rotina agendada, recusando horário único no passado e mais de 200 rotinas. |
| `dataNoFusoHorario.ts` | Diz a data e o dia da semana de um instante num fuso horário. |
| `definirPausaGlobal.ts` | Pausa ou retoma todos os agendamentos de uma vez. |
| `desativarRotina.ts` | Desativa uma rotina. |
| `desvioDoFuso.ts` | Calcula quantos minutos um fuso horário está adiantado ou atrasado num instante (considera horário de verão). |
| `editarRotina.ts` | Edita uma rotina (o projeto não pode mudar) e recomeça a contagem dos horários a partir de agora. |
| `excluirRotina.ts` | Exclui uma rotina (as execuções já registradas continuam no histórico). |
| `horariosEntre.ts` | Lista os horários em que a rotina deveria rodar entre dois instantes (único, intervalo, diário ou semanal). |
| `horariosVencidos.ts` | Lista os horários da rotina que já venceram e diz quais ainda dá tempo de rodar e quais foram perdidos. |
| `instanteLocal.ts` | Converte data e hora de parede num fuso (ex.: 08:00 em São Paulo) no instante exato, tratando horário de verão. |
| `listarAgenda.ts` | Lista as rotinas para a tela Agendamentos, com próxima e última execução, permissões e autorizações. |
| `listarPermissoes.ts` | Lista autorizações de execução e políticas de publicação com o estado de cada uma (vigente, expirada, revogada, esgotada). |
| `marcarHorarioTratado.ts` | Anota que um horário da rotina já foi tratado; rotina de execução única passa a concluída. |
| `pausarRotina.ts` | Pausa uma rotina ativa. |
| `permissoesDaRotina.ts` | Explica em frases o que a rotina pode fazer (ler Jira, executar testes, publicar comentário...), para a pessoa aprovar. |
| `proximoHorario.ts` | Calcula o próximo horário em que a rotina vai rodar. |
| `retomarRotina.ts` | Retoma uma rotina sem executar os horários que passaram durante a pausa. |
| `validarRotina.ts` | Confere uma rotina antes de salvar: projeto, capacidade declarada, run do mesmo projeto, k6 e produção bloqueada. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `autorizacoes.ts` | Formato das autorizações de execução e das políticas de publicação no Jira e escrita no Qase, com validade e usos. |
| `fila.ts` | Formato de um trabalho da fila (estados, tentativas, resultado, Jira) e os limites da fila. |
| `k6.ts` | Formato da configuração do k6 e seus limites (50 usuários, 600 segundos). |
| `rotina.ts` | Formato de uma rotina agendada: tipos, ambientes, frequência (único, intervalo, diário, semanal), fuso e k6. |
| `worker.ts` | Formato dos eventos do worker, da trava de instância única e do estado de cada rotina. |

## worker/

O trabalhador que roda as rotinas sozinho, um trabalho por vez.

| Arquivo | O que faz |
| --- | --- |
| `agendarProximaPassada.ts` | Marca a próxima passada do worker daqui a alguns milissegundos; erro numa passada fica anotado e a seguinte é agendada mesmo assim. |
| `analisarMudancasAgendada.ts` | Rotina "análise de mudanças": lê os commits do repositório vinculado e diz quantos são novos desde a última análise; nunca dispara testes sozinha. |
| `capacidadeDaRotinaAgendada.ts` | Diz qual comando do projeto (capacidade) o trabalho da rotina vai usar: o escolhido na rotina ou o do script k6. |
| `consultarJiraAgendada.ts` | Rotina "consulta Jira": lê até 50 tickets e informa quais são novos ou mudaram desde a consulta anterior; não executa nada. |
| `contarCasosDaEvidencia.ts` | Conta quantos casos de uma evidência passaram, falharam, foram bloqueados ou não rodaram. |
| `criarEstadoDoWorker.ts` | Cria o estado inicial de um worker: identidade própria, relógio, pasta de dados e intervalo entre passadas (5 s por padrão). |
| `emitirEventoDoWorker.ts` | Avisa a janela de um acontecimento do worker, sem repetir o mesmo aviso por 30 minutos; um erro no aviso nunca derruba o worker. |
| `enfileirarHorariosVencidos.ts` | Para cada rotina ativa, põe na fila os horários vencidos que ainda dá tempo de rodar e registra como perdidos os que passaram. |
| `estadoDaTravaDoWorker.ts` | Diz se outro worker está vivo (trava ativa com batimento recente). |
| `estadoDoWorker.ts` | Resume o estado real do worker para a janela e a bandeja: ligado, pausado, trava, pendentes, em execução, próxima execução e último erro. |
| `executarK6Agendado.ts` | Rotina k6: procura o executável oficial e roda o teste de desempenho com a autorização prévia (ou a aprovação humana, se manual). |
| `executarRotinaAgora.ts` | "Executar agora": põe na fila um trabalho manual da rotina (testes pedem a aprovação humana do Windows a cada execução). |
| `executarRunQaseAgendada.ts` | Rotina "run do Qase": executa as automações dos casos e só publica no Qase com política vigente para a run; senão os resultados ficam locais. |
| `executarTrabalhoDaRotina.ts` | Escolhe o que fazer conforme o tipo da rotina (smoke, regressão, validação por ticket, k6, run do Qase, consulta Jira ou análise de mudanças) e devolve o resultado. |
| `gravarTravaDoWorker.ts` | Grava a trava do worker (worker-trava.json) com a identidade, o processo e o batimento atual, ligada ou desligada. |
| `iniciarWorker.ts` | Liga o worker: assume a trava de instância única (ou recusa se outro estiver vivo), recupera execuções interrompidas e agenda a primeira passada. |
| `pararWorker.ts` | Desliga o worker com cuidado: interrompe o teste em execução (e seus processos filhos), espera o registro e libera a trava. |
| `passadaDoWorker.ts` | Uma passada do worker: bate o coração, transforma horários vencidos em trabalhos, executa um trabalho e tenta publicações pendentes. |
| `processarTrabalho.ts` | Executa um trabalho da fila do começo ao fim: batimento, aviso de início, execução, registro do resultado e publicação; falhas viram BLOCKED ou nova tentativa, nunca PASS. |
| `processoVivo.ts` | Diz se um processo do Windows ainda está rodando. |
| `projetoDaRotina.ts` | Abre o contrato da pasta de automação do projeto da rotina; sem pasta vinculada, recusa com PROJECT_FOLDER_REQUIRED. |
| `publicarComentarioSeAutorizado.ts` | Depois de uma execução agendada, publica o comentário de resultado no Jira só se uma política aprovada cobrir o ticket; sem política, deixa preparado. |
| `repetirPublicacoesPendentes.ts` | Tenta de novo os comentários no Jira que falharam por rede ou serviço (sem duplicar); depois de 3 tentativas, marca como falha. |
| `resultadoDaEvidencia.ts` | Transforma a evidência de uma execução no resultado do trabalho: estado, motivo, contagem de casos e as primeiras falhas. |
| `resumoDasFalhas.ts` | Escreve as cinco primeiras falhas de uma evidência em texto curto. |
| `validarTicketAgendado.ts` | Rotina "validação por ticket": executa as automações ligadas ao ticket nas relações do projeto (até 5) e junta os resultados, valendo o pior. |
| `vigiarWorker.ts` | Se o worker parou sem a pessoa pedir, tenta religar e avisa; nunca finge que está ativo. |
| `Worker.ts` | Worker de agendamentos: a cada ciclo coloca na fila os horários vencidos, executa um trabalho por vez com batimento, registra o resultado e publica quando há política aprovada. |
| `workerDoAplicativo.ts` | O worker de agendamentos deste aplicativo, ligado aos serviços e aos avisos da janela. |
