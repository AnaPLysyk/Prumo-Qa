# Como funciona

Eu quis que o caminho de uma análise fosse sempre o mesmo:

```
Projeto (qa.project.json) → IA (Claude Code, Codex) → MCP → núcleo do Prumo → resultado → evidências
```

1. O contrato qa.project.json diz o que pode ser lido e quais comandos podem rodar.
2. A IA chama as ferramentas MCP do Prumo.
3. O núcleo confere contrato e permissões e devolve fatos, hipóteses e lacunas, ou executa uma capacidade que você aprovou.
4. Cada chamada fica no histórico local; cada execução gera evidência no projeto.

## Ferramentas MCP

- **contexto_projeto**: lê só o que o contrato autoriza e descreve tecnologias, testes, comandos e o que falta.
- **revisar_cobertura**: confere rastreabilidade, oráculos, lacunas e redundâncias candidatas. É estrutural (sempre NOT_VERIFIED) e não executa nada.
- **executar_validacao**: roda uma capacidade do contrato depois da sua autenticação no sistema.
- **consultar_evidencias**: devolve resultados e logs reais, preservando PASS, FAIL, BLOCKED e NOT_RUN.
- **listar_politicas**: mostra o que a IA pode e não pode pedir neste projeto.
- **propor_caso** e **propor_bug**: criam um rascunho local; nada vai para o Qase ou o Jira.
- **propor_aprendizado**: sugere um aprendizado para os agentes, como rascunho que você aprova.

O Prumo não inventa regra de negócio: quando falta requisito, registra a lacuna. Permissões, erros e proteções de cada operação estão em **Ajuda › Integrações técnicas**.
