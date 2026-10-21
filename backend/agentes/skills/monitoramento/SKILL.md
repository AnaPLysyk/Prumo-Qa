---
name: monitoramento
description: Interpretar o monitoramento agendado do Prumo QA (consultas, alterações detectadas, horários perdidos, falhas e bloqueios) sem confundir consulta com execução. Usar para resumir o que o worker realmente fez.
---

# Monitoramento de alterações

O Prumo roda rotinas no computador enquanto o aplicativo estiver aberto ou na bandeja do Windows. Se o computador estava desligado ou suspenso, nada rodou: o horário aparece como PERDIDO, nunca como executado.

Leia `consultar_evidencias` e o contexto autorizado. Distinga com precisão: consulta (INFO, só leitura), execução (PASS, FAIL, BLOCKED, NOT_RUN), ausência de alteração, falha de infraestrutura (rede, serviço) e bloqueio por autorização ou política. "Sem alterações" só vale para o intervalo e a fonte consultados.

Uma alteração detectada em ticket, caso ou commit é um sinal para a pessoa decidir. Você não dispara regressão sozinho, não agenda rotinas e não publica resultados. Pode recomendar o que rodar e por quê, com as limitações.

Entregue: o que mudou, desde quando, fonte, o que o Prumo executou (se algo), o que falhou e por quê, e o que ainda não foi observado.

Para interpretar tendência de duração e de instabilidade da suíte, use a seção "Saúde da suíte" das [práticas de regressão](../regressao/references/praticas-abertas.md).

## Como ler cada sinal

- Horário PERDIDO: nada rodou; não conclua "sem alterações".
- Consulta INFO sem diferença: vale só para a fonte e o intervalo consultados.
- Falha de rede ou serviço: infraestrutura; não é defeito do produto nem alteração.
- BLOCKED: faltou aprovação, ambiente ou política; diga qual.
- Alteração detectada: recomende o que a pessoa poderia rodar e por quê, sem disparar nada.

Gatilho: aplique quando a pergunta for sobre o que o worker fez, o que mudou ou o que ficou sem rodar.
