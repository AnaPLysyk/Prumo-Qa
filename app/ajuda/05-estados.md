# Estados dos resultados

- **PASS**: a execução terminou com código de saída zero e, quando há resultados individuais, nenhum deles falhou, ficou bloqueado ou não executado. Sem resultados individuais, o PASS vale para a rodada, não para cada cenário.
- **FAIL**: código de saída diferente de zero, ou ao menos um cenário individual falhou. Uma falha nunca é escondida.
- **BLOCKED**: não foi possível executar ou concluir: falta de aprovação humana, pré-condição ausente, política do contrato, ambiente indisponível.
- **NOT_RUN**: nada foi executado ou não existe evidência.

Estados de análise:

- **NOT_VERIFIED**: análise estrutural; nada foi comprovado por execução.
- **OK**: operação de consulta concluída.
- **ERROR**: a própria operação falhou.
