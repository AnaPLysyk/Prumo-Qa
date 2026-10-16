# Agendamentos, bandeja e execuções

Eu queria que a rotina de QA rodasse sozinha, sem depender de IA. Tudo nesta página funciona com Claude e Codex desligados: eles podem ajudar a ler um resultado, mas não executam, não agendam e não publicam nada.

## Criar uma rotina

Em Agendamentos, clique em **Nova rotina** e escolha projeto, tipo, ambiente, frequência e fuso horário.

- **Consulta Jira**: lê até 50 tickets e mostra o que é novo ou mudou. Não executa nada.
- **Smoke** e **Regressão**: rodam uma automação já declarada no `qa.project.json` do projeto.
- **Validação por ticket**: roda só as automações associadas ao ticket nos vínculos declarados (Testes › Repositório). Sem vínculo, fica BLOCKED.
- **Análise de mudanças**: lê os commits do GitHub vinculado e diz quantos são novos. Nunca dispara testes.
- **Desempenho (k6)**: usa o k6 oficial instalado, até 50 usuários virtuais e 600 s, nunca em produção. Sem k6, fica NOT_RUN.
- **Run do Qase**: roda as automações dos casos de uma run já criada no Qase.

Frequência: uma vez, a cada N minutos, todos os dias ou semanal, sempre no fuso escolhido. Horário de verão é tratado: um horário que não existe vai para logo depois do salto; um horário repetido vale uma vez.

A rotina nunca recebe comando livre, só uma capability que o projeto declarou. Texto de ticket é dado, nunca ordem.

## Autorizar testes

Rodar testes é ação protegida. Abra a rotina, aba **Autorização**, escolha a validade (1 a 30 dias) e o máximo de execuções e clique em **Autorizar execuções agendadas…**. O Prumo mostra o que a rotina pode fazer, pede a sua confirmação e depois a autenticação do sistema.

- Vale só para aquele projeto, ambiente e comando exatos.
- Se o comando, o contrato ou os arquivos de teste mudarem, deixa de valer e a execução fica BLOCKED até você autorizar de novo.
- Você pode revogar quando quiser.

**Executar agora** é feito por você e pede a autenticação a cada vez.

## Bandeja e horário perdido

Ao fechar a janela, o Prumo fica na bandeja para as rotinas seguirem. O menu do ícone abre o Prumo, mostra agendamentos e execuções, pausa ou retoma, mostra o estado do worker e tem **Sair do Prumo**, que encerra o worker e os processos que ele iniciou.

Em **Políticas e preferências › Prumo residente** você liga **Iniciar o Prumo com o sistema**. Vem desligado.

Pausar impede novas execuções; o que já está rodando termina sem ser corrompido. Com o computador desligado, suspenso ou o Prumo fechado, nada roda: o horário aparece como PERDIDO, nunca como executado. Na rotina, **Se o Prumo estiver fechado no horário** permite trocar para **Executar uma vez ao voltar**.

## PASS, FAIL, BLOCKED e NOT_RUN

- **PASS**: terminou e os cenários reportados passaram. Sem cenários individuais, PASS só diz que o processo terminou bem.
- **FAIL**: um teste falhou. Falha de teste nunca é repetida em silêncio.
- **BLOCKED**: uma regra impediu a execução (autorização ausente ou vencida, projeto alterado, ferramenta ausente). Não é defeito do produto.
- **NOT_RUN**: nada foi executado.

Falha de rede ou serviço aparece como erro de infraestrutura e pode ter nova tentativa automática.

## Consultar execuções

Em **Testes › Runs** ficam as execuções manuais e agendadas, com filtro por origem e situação. Abra uma linha para ver resumo, etapas (tentativas), logs e evidências guardadas na pasta do projeto.

## Comentário no Jira

Informe o ticket na rotina. O Prumo pode comentar o resultado no ticket: tipo, ambiente, cenários, resumo das falhas e a referência local da evidência. O comentário não aprova o ticket e nunca muda o status dele.

- **Manual**: abra a execução (PASS ou FAIL) em Testes › Runs, clique em **Comentário Jira**, leia a prévia e use **Publicar no Jira…**.
- **Agendado**: aprove antes uma política em **Políticas e preferências › Comentários no Jira**, restrita a tickets, tipos de rotina, validade e quantidade. Sem política, nenhuma rotina comenta.

Repetir não duplica o comentário. Se a publicação falhar, o registro fica como pendência local.

A rotina **Run do Qase** segue a mesma ideia: só publica no Qase com a política aprovada na aba **Publicação** da run (Testes › Runs). Você revoga essas políticas em **Políticas e preferências › Resultados no Qase**.
