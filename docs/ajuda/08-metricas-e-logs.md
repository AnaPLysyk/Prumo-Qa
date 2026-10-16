# Como interpretar métricas e logs

Aqui eu só mostro número que vem de registro real feito neste computador; nada é estimado.

## Métricas

Os dados vêm das operações registradas pelo Prumo (MCP e terminal) e das execuções do projeto (agendadas ou manuais).

- **Totais do núcleo**: interações registradas, chamadas via MCP, revisões de cobertura, análises de contexto e execuções em PASS, FAIL, BLOCKED e NOT_RUN, de todo o período.
- **Gráficos**: seguem o período e os **Filtros** (fonte, resultado, tipo de rotina, ambiente, execução, ticket). Em **Editar gráficos** você escolhe, muda o formato e ordena. Dá para exportar CSV ou JSON e imprimir ou salvar em PDF.
- **Achados e recomendações**: orientações padronizadas; o Prumo não observa se a IA as aplicou.
- **Lacunas**: requisito, fonte, oráculo ou rastreabilidade ausentes.
- **Redundâncias**: cenários estruturalmente equivalentes; ainda pedem julgamento seu ou da IA.
- **INFO** é uma consulta e não conta como PASS; **ERRO_INFRA** é falha da própria operação ou da infraestrutura.
- **Tokens e custos** aparecem como indisponíveis: não há dados verificáveis. Conversas de Codex ou Claude Code não são capturadas.

Se houver registro inválido ou truncado, a tela avisa que o histórico é parcial; o registro fica fora do cálculo e nunca é corrigido.

## Logs

- Cada operação gera um registro no início e outro no término.
- **Sem término observado**: começou, mas nenhum término foi registrado (por exemplo, o cliente desconectou). Não prova que ainda está rodando.
- **Duração**: tempo medido pelo Prumo.
- **Diagnóstico da interface**: chamadas da própria janela (canal, estado, duração, código), separadas do histórico de QA. Atualizar uma tela não conta como análise e não muda as métricas.
