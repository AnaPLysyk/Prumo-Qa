# Agendamentos, bandeja e execuções

As rotinas de QA funcionam sem IA. Claude e Codex podem ajudar a interpretar um resultado, mas não criam rotinas, não executam testes nem publicam resultados.

## Criar uma rotina

Em **Agendamentos**, clique em **Nova rotina**. Escolha o projeto, o tipo de rotina, o ambiente, a frequência e o fuso horário.

- **Consulta Jira**: lê até 50 tickets e mostra o que é novo ou mudou. Não executa nada.
- **Smoke** e **Regressão**: rodam uma automação já declarada no `qa.project.json` do projeto.
- **Validação por ticket**: executa apenas os testes ligados ao ticket em **Testes › Repositório**. Se não houver vínculo, fica `BLOCKED`.
- **Análise de mudanças**: lê os commits do GitHub vinculado e diz quantos são novos. Nunca dispara testes.
- **Desempenho (k6)**: usa o k6 oficial instalado no computador, com até 50 usuários virtuais por até 600 segundos. Não pode ser executado em produção. Sem k6, fica `NOT_RUN`.
- **Run do Qase**: roda as automações dos casos de uma run já criada no Qase.

Você pode executar a rotina uma vez, a cada certo número de minutos, diariamente ou semanalmente. Ela usa o fuso horário escolhido. Na mudança para o horário de verão, um horário que não existe passa para o primeiro horário disponível; se um horário acontecer duas vezes, a rotina roda apenas uma.

A rotina só pode executar um comando permitido no projeto; ela não aceita comandos escritos livremente. O texto de um ticket é tratado como informação, nunca como uma instrução para o Prumo.

## Autorizar testes

Executar testes exige autorização. Abra a rotina, escolha a aba **Autorização**, defina por quantos dias (de 1 a 30) e quantas vezes a autorização vale e clique em **Autorizar execuções agendadas…**. O Prumo mostra o que a rotina poderá fazer e pede sua confirmação e a autenticação do sistema.

- Vale apenas para aquele projeto, ambiente e comando.
- Se o comando, o contrato ou os arquivos de teste mudarem, a autorização deixa de valer. A rotina fica `BLOCKED` até você autorizá-la novamente.
- Você pode revogar quando quiser.

**Executar agora** é feito por você e pede a autenticação a cada vez.

## Bandeja e horário perdido

Ao fechar a janela, o Prumo continua na área de notificação do sistema (bandeja), para que as rotinas possam rodar. No menu do ícone, você pode abrir o Prumo, ver ou pausar as rotinas e consultar o estado do worker (processo que executa as rotinas). **Sair do Prumo** encerra o worker e os processos que ele iniciou.

Em **Políticas e preferências › Prumo residente** você liga **Iniciar o Prumo com o sistema**. Vem desligado.

Pausar impede o início de novas execuções, mas não interrompe uma que já começou. Se o computador estiver desligado ou suspenso, ou se você sair do Prumo, a rotina não roda; o horário aparece como **PERDIDO**. Em **Se o Prumo estiver fechado no horário**, você pode escolher **Executar uma vez ao voltar**.

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
