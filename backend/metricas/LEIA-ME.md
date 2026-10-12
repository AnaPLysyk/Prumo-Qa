# metricas — backend

Métricas: números reais calculados das execuções e do diário de operações.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `execucoesMetricas.ts` | Canal execucoes:metricas: Indicadores reais das execuções registradas. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `calcularMetricas.ts` | Calcula os indicadores do diário (chamadas MCP, revisões, achados, execuções por estado, duração média). |
| `metricasDasExecucoes.ts` | Calcula os números reais das execuções: PASS/FAIL/BLOCKED/NOT_RUN, última e próxima execução, rotinas e falhas recentes. |
