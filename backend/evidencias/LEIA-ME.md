# evidencias — backend

Evidências: o que cada execução produziu, guardado com integridade dentro de .prumo do projeto.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `projetoEvidencias.ts` | Canal projeto:evidencias: Resultados e logs de execuções reais, preservando PASS, FAIL, BLOCKED e NOT_RUN. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `consultarEvidencias.ts` | Lê as evidências do projeto conferindo integridade e se pertencem a este projeto; sem evidência, responde NOT_RUN. |
| `excluirEvidencias.ts` | Apaga as evidências do projeto (Ajuda › Privacidade e dados), informando falhas. |
| `salvarEvidencia.ts` | Grava a evidência da execução em .prumo/evidencias do projeto, com impressão digital (exceto em projeto somente leitura). |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `classificarResultado.ts` | Decide o estado final de uma execução: BLOCKED (impedida), NOT_RUN (não rodou), FAIL ou PASS. Falha de processo nunca vira PASS. |
| `listarEvidenciasDoProjeto.ts` | Lista as evidências de execução do projeto, com segredos mascarados, para a tela Evidências. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `evidencia.ts` | Formato de uma evidência de execução: estados PASS/FAIL/BLOCKED/NOT_RUN, casos, logs e integridade. |
