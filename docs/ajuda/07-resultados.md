# Como interpretar os resultados

Os estados mostram o resultado real. Falhas e ações que não foram executadas não são ocultadas.

- **PASS**: o comando terminou sem erro e nenhum cenário reportado falhou, foi bloqueado ou ficou sem execução. Se não houver resultados por cenário, `PASS` vale para a execução inteira, não para cada teste.
- **FAIL**: saída diferente de zero ou pelo menos um cenário falhou.
- **BLOCKED**: uma regra impediu o início ou a conclusão (por exemplo, falta de aprovação, pré-requisito, permissão ou ambiente) ou algum cenário foi bloqueado.
- **NOT_RUN**: nada foi executado, não há evidência ou algum cenário não rodou.
- **NOT_VERIFIED**: o Prumo analisou a estrutura (por exemplo, o contexto ou a cobertura), mas nada foi confirmado por uma execução.
- **OK** e **ERROR**: a consulta terminou, ou a própria operação falhou.

Uma chamada MCP concluída **não** significa que um teste passou. Uma recomendação do Prumo também não prova que a IA alterou o código.
