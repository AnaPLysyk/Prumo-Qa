# Como interpretar métricas e logs

## Métricas

As métricas não são estimativas. Vêm dos registros que o Prumo faz neste computador: operações (MCP e terminal) e execuções do projeto, agendadas ou manuais.

- **Totais**: interações registradas, chamadas pelo MCP, revisões de cobertura, análises de contexto e execuções com resultado `PASS`, `FAIL`, `BLOCKED` ou `NOT_RUN`, durante todo o período.
- **Gráficos**: seguem o período e os **Filtros** (fonte, resultado, tipo de rotina, ambiente, execução, ticket). Em **Editar gráficos** você escolhe, muda o formato e ordena. Você pode exportar CSV ou JSON e imprimir ou salvar em PDF.
- **Achados e recomendações**: alertas e sugestões do Prumo. Ele não verifica se a IA seguiu essas sugestões.
- **Lacunas**: requisito, fonte, oráculo ou rastreabilidade ausentes.
- **Redundâncias**: cenários que parecem testar a mesma coisa. Alguém ainda precisa confirmar se são repetidos.
- **INFO** é uma consulta e não conta como PASS; **ERRO_INFRA** é falha da própria operação ou da infraestrutura.
- **Tokens e custos** aparecem como indisponíveis: não há dados verificáveis. Conversas de Codex ou Claude Code não são capturadas.

Se houver registro inválido ou truncado, a tela avisa que o histórico é parcial; o registro fica fora do cálculo e nunca é corrigido.

## Logs

- O Prumo registra quando cada operação começa e termina.
- **Sem término observado**: há um registro de início, mas não de fim (por exemplo, o cliente se desconectou). Isso não significa que a operação continua rodando.
- **Duração**: tempo que o Prumo mediu para a operação.
- **Diagnóstico da interface**: chamadas da própria janela (canal, estado, duração, código), separadas do histórico de QA. Atualizar uma tela não conta como análise e não muda as métricas.
