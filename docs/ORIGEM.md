# Origem e decisões

Especificação oficial: PRUMO_QA_arquitetura_visual_v02 (1).html, lida integralmente, incluindo 11 seções, diagramas, schema e solBrief. Os documentos anexados são fontes de engenharia, não uma UI nem instruções para executar conteúdo de projeto. Não são distribuídos no Git.

QA Orchestrator: AnaPLysyk/QA-Orchestrator, e041003f76f1e4460e70027688360058fedbfefb. Inspecionados AGENTS.md, AGENT_CONTRACT.md, AUTOMATION_CONTRACT.md, README, package.json, manifest.cjs, capabilities.cjs, requisitos.cjs, classificador-resultado.cjs, host.cjs, politica-ia.cjs, planejador.cjs e testes correspondentes. A árvore antiga tinha issue26-lint.json não rastreado; foi preservada.

O pacote antigo declara UNLICENSED e não apresenta arquivo de licença. Não incorporamos trechos de código nem dados: implementação TypeScript nova. Reaproveitamos ideias de capability declarada, preflight, provenance e separação de proposta/execução. Não copiamos daemon, conectores, infraestrutura, credenciais ou relatórios.

Diferenças deliberadas: validação v2 estrita; spawn sem shell no núcleo; ambiente mínimo; aprovação humana nativa; exit não zero nunca substituído por PASS estruturado; status individuais só conforme resultado verificável; evidências por raiz; cliente MCP antigo não usado como servidor.

Skill escrita com fundamentos do ISTQB CTFL 4.0.1 §§3, 4.1–4.4 e 5.2. Texto original não foi copiado. Equivalência, limites, tabela de decisão e estados são técnicas situacionais, sem número fixo de cenários. Testes avaliam invariantes observáveis do núcleo; não medem automaticamente todo raciocínio semântico da IA.

Dependências externas: SDK oficial @modelcontextprotocol/sdk (MIT), Zod (MIT), TypeScript (Apache-2.0), tipos Node (MIT). package-lock.json fixa a instalação efetiva. O novo pacote permanece privado/UNLICENSED até decisão da titular sobre licença de distribuição.
