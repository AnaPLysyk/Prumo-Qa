# Agendamentos, bandeja e execuções

O Prumo executa uma rotina de QA sozinho, sem IA. Tudo abaixo funciona com Claude e Codex desligados. Eles podem ajudar a interpretar resultados, mas não executam comandos, não criam agendamentos e não publicam nada fora das permissões que você aprovou.

## Como criar uma rotina

Em Agendamentos, clique em Nova rotina. Escolha o projeto Prumo, o tipo, a frequência e o fuso horário.

Tipos disponíveis: consulta Jira (somente leitura), smoke e regressão (executam uma automação já declarada no contrato do projeto), validação por ticket (executa só automações que você associou ao ticket em Rastreabilidade), análise de mudanças (lê commits do GitHub e recomenda; nunca dispara testes sozinha) e desempenho com k6.

Frequências: uma vez, a cada N minutos, todos os dias ou em dias da semana, sempre no fuso escolhido. A mudança de horário de verão é tratada: um horário que não existe avança para depois do salto e um horário repetido vale uma vez.

A rotina nunca recebe um comando livre. Ela só escolhe uma capability que o projeto já declarou em qa.project.json. Texto de ticket ou de descrição é sempre dado, nunca ordem.

## Como autorizar testes

Executar testes é uma ação protegida. Em cada rotina, use Autorizar execuções agendadas. O Prumo mostra o que a rotina pode fazer, pede a sua confirmação e depois a autenticação do Windows. A autorização vale somente para aquele projeto, ambiente e comando exatos, por até 30 dias e por uma quantidade máxima de execuções. Se o comando, o contrato ou os arquivos de teste mudarem, ela deixa de valer e a execução fica BLOCKED até você autorizar de novo. Você pode revogar quando quiser.

Executar agora, feito por você, pede a autenticação do Windows a cada vez.

## O Prumo na bandeja do Windows

Ao fechar a janela, o Prumo continua na bandeja para que as rotinas sigam. O menu do ícone permite abrir, ver agendamentos, consultar execuções, pausar ou retomar, ver o estado do worker e Sair do Prumo. Sair encerra o worker e os processos que ele iniciou. O Prumo só inicia com o Windows se você ligar essa opção em Agendamentos; ela vem desligada.

Pausar impede novas execuções; o que já está rodando termina sem ser corrompido. Se o computador estiver desligado, suspenso ou o Prumo fechado no horário, nada é executado: o horário aparece como PERDIDO e nunca como executado.

## Como ler PASS, FAIL, BLOCKED e NOT_RUN

PASS: a execução terminou e os cenários reportados passaram. FAIL: houve falha de teste. BLOCKED: não foi possível executar por uma regra (aprovação, autorização vencida, projeto alterado, ferramenta ausente); isso não é defeito do produto. NOT_RUN: nada foi executado. Falha de rede ou serviço aparece como erro de infraestrutura e pode ter nova tentativa automática; falha de teste nunca é repetida em silêncio.

PASS sem cenários individuais significa apenas que o processo terminou com sucesso: não há resultado por cenário.

## Consultar uma execução antiga

Em Execuções você vê o histórico de todos os projetos ou de um projeto, filtrado por ticket e resultado. Cada linha mostra quem executou (agenda ou manual), tentativas, duração, cenários e o estado do comentário Jira. Ver evidência abre o resultado real guardado na pasta do projeto. Consultar a tela não conta como execução de QA.

## Relacionar uma execução a um ticket

Informe o ticket na rotina. Para validação por ticket, as automações vêm das associações declaradas em Rastreabilidade (Jira para automação). Sem associação, a rotina fica BLOCKED e nada é executado.

## Comentários no Jira

O Prumo pode registrar o resultado no ticket como um comentário: ticket, tipo, ambiente, cenários, PASS e FAIL, resumo das falhas e a referência local da evidência. Ele não diz que o ticket foi aprovado e nunca muda o status do ticket.

Manual: em Execuções, abra Comentário Jira, leia a prévia e confirme. Agendado: crie antes uma política de publicação restrita a tickets, tipos de rotina, validade e quantidade. Sem política, nenhuma rotina agendada comenta. Repetir ou tentar de novo não cria comentário duplicado. Se a publicação falhar, o registro local fica como pendência.

## O que depende de IA

Nada do que está aqui depende de IA. A IA é opcional e só assiste: analisa tickets, sugere cobertura, interpreta logs e propõe textos. As decisões, as autorizações e os registros ficam com o Prumo.
