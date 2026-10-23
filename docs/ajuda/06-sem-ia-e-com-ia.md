# O que o Prumo faz sem IA e o que depende dela

O Prumo funciona sem conta de IA. Uma IA pode ajudar, mas a decisão é sua.

## Sem IA

- criar projetos (à mão ou importados do Jira, do Qase e do GitHub) e guardar as informações deles;
- conectar Jira, Qase e GitHub com suas credenciais, consultar dados e, se você habilitar a escrita, publicar depois de confirmar;
- registrar relações entre tickets e casos, com uma justificativa. Uma relação registrada não comprova que o caso cobre o ticket;
- agendar rotinas (consulta Jira, smoke, regressão, validação por ticket, análise de mudanças, desempenho com k6 e run do Qase), com o worker na bandeja do sistema, e comentar o resultado no Jira com a sua aprovação;
- conferir as regras do projeto e ler as informações autorizadas;
- revisar um plano de testes (por exemplo, procurar resultados esperados ou relações com requisitos ausentes, identificadores repetidos e casos possivelmente duplicados);
- executar comandos permitidos pelo projeto, depois da sua autenticação;
- conversar com o assistente local, que responde com os dados deste computador;
- guardar histórico, métricas, logs e evidências.

## Decisões que precisam de julgamento

Estas análises são suas; uma IA externa pode ajudar:

- interpretar requisitos e decidir o que é risco de verdade;
- julgar se dois cenários são equivalentes;
- escolher quantos cenários e quais técnicas;
- raciocinar sobre o que o código deveria fazer.

O Prumo não tem inteligência artificial própria nem pede uma chave de IA. Ele mostra fatos e informações que faltam; a equipe decide o que fazer.
