# Como interpretar os resultados

Eu preferi que nenhum estado parecesse melhor do que é. Falha nunca é escondida.

- **PASS**: saída zero e nenhum cenário individual com falha, bloqueio ou sem execução. Sem cenários individuais, o PASS vale para a rodada, não para cada cenário.
- **FAIL**: saída diferente de zero ou pelo menos um cenário falhou.
- **BLOCKED**: não deu para executar ou concluir (sem aprovação, pré-condição ausente, política do contrato, ambiente indisponível) ou algum cenário ficou bloqueado.
- **NOT_RUN**: nada foi executado, não há evidência ou algum cenário não rodou.
- **NOT_VERIFIED**: análise estrutural (contexto ou revisão de cobertura); nada foi comprovado por execução.
- **OK** e **ERROR**: a consulta terminou, ou a própria operação falhou.

Uma chamada MCP concluída **não** é teste aprovado, e uma recomendação do Prumo não prova que a IA mudou o código.
