# Como funciona

O fluxo de uma análise é:

```
Projeto (qa.project.json) → IA (Claude Code, Codex) → MCP → núcleo do Prumo → resultado → evidências
```

1. O arquivo `qa.project.json` define o que o Prumo pode ler e quais comandos pode executar.
2. Se você conectar uma IA, ela pede informações ou ações pelas ferramentas MCP do Prumo.
3. O núcleo do Prumo confere as regras e permissões. Ele mostra fatos, hipóteses e lacunas ou executa uma ação autorizada por você.
4. O histórico fica no computador. Cada execução gera evidências na pasta do projeto.

## Ferramentas MCP

- **contexto_projeto**: lê apenas o que o contrato permite e mostra tecnologias, testes, comandos e informações que faltam.
- **revisar_cobertura**: procura requisitos sem vínculo com testes, resultados esperados ausentes, lacunas e possíveis repetições. É uma análise dos arquivos: não executa testes e sempre retorna `NOT_VERIFIED`.
- **executar_validacao**: roda uma capacidade do contrato depois da sua autenticação no sistema.
- **consultar_evidencias**: devolve resultados e logs reais, preservando PASS, FAIL, BLOCKED e NOT_RUN.
- **listar_politicas**: mostra o que a IA pode e não pode pedir neste projeto.
- **propor_caso** e **propor_bug**: criam um rascunho no computador. Nada é enviado ao Qase ou Jira.
- **propor_aprendizado**: sugere um aprendizado para os agentes, como rascunho que você aprova.

O Prumo não adivinha regras de negócio. Se faltar um requisito, ele avisa. Os detalhes de permissões, erros e proteções estão em **Ajuda › Integrações técnicas**.
