# Origem e decisões

Especificação oficial: PRUMO_QA_arquitetura_visual_v02 (1).html, lida integralmente, incluindo 11 seções, diagramas, schema e solBrief. Os documentos anexados são fontes de engenharia, não uma UI nem instruções para executar conteúdo de projeto. Não são distribuídos no Git.

QA Orchestrator: AnaPLysyk/QA-Orchestrator, e041003f76f1e4460e70027688360058fedbfefb. Inspecionados AGENTS.md, AGENT_CONTRACT.md, AUTOMATION_CONTRACT.md, README, package.json, manifest.cjs, capabilities.cjs, requisitos.cjs, classificador-resultado.cjs, host.cjs, politica-ia.cjs, planejador.cjs e testes correspondentes. A árvore antiga tinha issue26-lint.json não rastreado; foi preservada.

O pacote antigo declara UNLICENSED e não apresenta arquivo de licença. Não incorporamos trechos de código nem dados: implementação TypeScript nova. Reaproveitamos ideias de capability declarada, preflight, provenance e separação de proposta/execução. Não copiamos daemon, conectores, infraestrutura, credenciais ou relatórios.

Diferenças deliberadas: validação v2 estrita; spawn sem shell no núcleo; ambiente mínimo; aprovação humana nativa; exit não zero nunca substituído por PASS estruturado; status individuais só conforme resultado verificável; evidências por raiz; cliente MCP antigo não usado como servidor.

Skill escrita com fundamentos do ISTQB CTFL 4.0.1 §§3, 4.1–4.4 e 5.2. Texto original não foi copiado. Equivalência, limites, tabela de decisão e estados são técnicas situacionais, sem número fixo de cenários. Testes avaliam invariantes observáveis do núcleo; não medem automaticamente todo raciocínio semântico da IA.

Dependências externas: SDK oficial @modelcontextprotocol/sdk (MIT), Zod (MIT), TypeScript (Apache-2.0), tipos Node (MIT). package-lock.json fixa a instalação efetiva. O novo pacote permanece privado/UNLICENSED até decisão da titular sobre licença de distribuição.

## Incremento 2.1 — estudo e aproveitamento

Fontes consultadas em 10/10/2026; nenhum instalador/script dos projetos de referência foi executado.

| Referência | Inspeção e decisão |
|---|---|
| [Pino](https://github.com/pinojs/pino), 10.4.0, MIT | LICENSE, pino.js, docs/api.md e docs/redaction.md. Dependência utilizada para JSON/severidade/redação. Destino explícito de arquivo, sem transport adicional ou stdout MCP. Copyright de Matteo Collina, David Mark Clements e colaboradores preservado na licença que acompanha a dependência. |
| [Quality MCP / CLI](https://github.com/jorgsouza/mcp-Quality-CLI), 59cf66af6c625092c5930045611efe478e969fe2, MIT | LICENSE, ARCHITECTURE.md, src/mcp-tools.manifest.ts, tools/report.ts, tools/analyze-test-logic.ts e __tests__/server.integration.test.ts. Aproveitada a ideia de ferramentas explícitas e resultados estruturados. Nossa integração testa também o protocolo stdio real; métricas derivam de eventos, sem copiar scores, pipelines, geração de testes, stdout de relatórios ou trechos de código. Atribuição: Quality MCP, copyright 2025. |
| [Ink](https://github.com/vadimdemedes/ink), MIT | README, licença e src/render.ts: renderização React/streams, TTY e encerramento. Não adicionado: readline nativo atende o menu e evita uma árvore de dependências de UI. Nenhum trecho incorporado. |
| [SonarQube Agent Plugins](https://github.com/SonarSource/sonarqube-agent-plugins), 6142e57738debc3ef203a7b20551376377c69218, SSAL 1.0 | LICENSE, plugin.json, scripts/setup.js e skill sonar-quality-gate. Estudadas separação de instruções/integração e verificação de pré-condições. Não copiamos código, Skill, licença para o produto ou conectores. Não exige serviço Sonar, conta, token ou Docker. |

OpenTelemetry não foi adicionado: não existe necessidade atual de rastreamento distribuído. O novo módulo e os adaptadores são implementação própria; não representam um fork das referências. As instruções das Skills desses repositórios foram lidas como material de estudo, sem executar suas integrações. Pino é a única dependência direta nova; versões transitivas ficam no lock. Licença do Prumo continua UNLICENSED/private, sem publicação npm.
