# Como interpretar métricas e logs

Tudo que aparece em Métricas, Logs e Histórico vem de registros reais feitos pelo Prumo a cada operação (um registro no início e outro no término).

- **Interações registradas**: operações iniciadas, por MCP ou terminal.
- **Revisões de cobertura**: análises estruturais concluídas. Não são execuções de teste.
- **Achados e recomendações**: orientações padronizadas do Prumo. O Prumo não observa se a IA as aplicou.
- **Lacunas**: requisito, fonte, oráculo ou rastreabilidade ausentes.
- **Redundâncias candidatas**: cenários estruturalmente equivalentes; ainda dependem de julgamento humano ou da IA.
- **Sem término observado**: a operação começou, mas nenhum término foi registrado (por exemplo, o cliente desconectou).
- **Duração**: tempo medido pelo Prumo para a operação.

Tokens e custos de IA não aparecem porque o Prumo não tem dados verificáveis sobre eles. Conversas privadas de Codex ou Claude Code não são capturadas.

Se algum registro estiver corrompido, a tela avisa que as métricas são parciais; o registro inválido é excluído, não corrigido.

## Diagnóstico da interface

A aba Logs também oferece o diagnóstico técnico das chamadas da própria janela (canal, estado, duração, código). Ele é separado do histórico de QA: atualizar uma tela **não** conta como análise do Prumo e não altera as métricas.
