---
name: monitoramento
description: Interpretar o monitoramento agendado do Prumo QA (consultas, alterações detectadas, horários perdidos, falhas e bloqueios) sem confundir consulta com execução. Usar para resumir o que o worker realmente fez.
---

# Monitoramento de alterações

O Prumo roda rotinas no computador enquanto o aplicativo estiver aberto ou na bandeja do Windows. Se o computador estava desligado ou suspenso, nada rodou: o horário aparece como PERDIDO, nunca como executado.

Leia `consultar_evidencias` e o contexto autorizado. Distinga com precisão: consulta (INFO, só leitura), execução (PASS, FAIL, BLOCKED, NOT_RUN), ausência de alteração, falha de infraestrutura (rede, serviço) e bloqueio por autorização ou política. "Sem alterações" só vale para o intervalo e a fonte consultados.

Uma alteração detectada em ticket, caso ou commit é um sinal para a pessoa decidir. Você não dispara regressão sozinho, não agenda rotinas e não publica resultados. Pode recomendar o que rodar e por quê, com as limitações.

Entregue: o que mudou, desde quando, fonte, o que o Prumo executou (se algo), o que falhou e por quê, e o que ainda não foi observado.
