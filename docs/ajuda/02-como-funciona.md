# Como funciona

O caminho de uma análise é sempre o mesmo:

```
Projeto (qa.project.json) → IA (Codex, Claude Code) → MCP → núcleo QA do Prumo → resultado → evidências
```

1. O projeto declara, no contrato qa.project.json, o que pode ser lido e quais comandos podem ser executados.
2. A IA que desenvolve o sistema chama as ferramentas MCP do Prumo.
3. O núcleo valida contrato e permissões e devolve fatos, hipóteses e lacunas (revisão sempre NOT_VERIFIED) ou executa uma capacidade autorizada.
4. Cada chamada fica registrada no histórico local; execuções geram evidências no projeto.

## As quatro ferramentas MCP

- **contexto_projeto**: lê só os arquivos autorizados e descreve tecnologias, testes e comandos, informando o que falta.
- **revisar_cobertura**: confere rastreabilidade, oráculos, lacunas e redundâncias candidatas. É estrutural e não afirma que executou algo.
- **executar_validacao**: executa uma capacidade do contrato depois de autenticação humana no Windows.
- **consultar_evidencias**: devolve resultados e logs reais, preservando PASS, FAIL, BLOCKED e NOT_RUN.

O Prumo não inventa regras de negócio. Quando falta requisito, registra a lacuna e indica o que precisa ser esclarecido. Esta janela só consulta os dados; o detalhe técnico de cada operação está em **Integrações técnicas**.
