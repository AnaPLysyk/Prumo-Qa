# Créditos e licenças de terceiros nas Skills

Os arquivos `references/praticas-abertas.md` (acessibilidade, api-rest, investigacao-bugs, playwright, regressao) e `qa/references/estrategia.md` foram **adaptados** — reescritos em português e ajustados às regras do Prumo QA — a partir dos materiais abaixo. Nenhum script ou arquivo foi copiado; as regras de segurança, execução e honestidade do Prumo prevalecem sobre o material de origem. Licenças conferidas em 11/10/2026 nos repositórios oficiais; as duas últimas linhas da tabela, em 21/10/2026.

| Origem | Usado em | Licença |
| --- | --- | --- |
| [anthropics/skills — `backend/agentes/skills/webapp-testing`](https://github.com/anthropics/skills/tree/main/skills/webapp-testing) | playwright | Apache-2.0 — Copyright 2026 Anthropic, PBC. Texto em [licencas/APACHE-2.0.txt](licencas/APACHE-2.0.txt) |
| [testdino-hq/playwright-skill](https://github.com/testdino-hq/playwright-skill) | playwright (lista de temas de apoio) | MIT — Copyright (c) 2026 TestDino |
| [fugazi/test-automation-skills-agents](https://github.com/fugazi/test-automation-skills-agents) — `qa-investigation`, `a11y-playwright-testing`, `playwright-regression-testing`, `api-testing`, `grill-me-qa` | investigacao-bugs, acessibilidade, regressao, monitoramento, api-rest, qa | MIT — Copyright (c) 2026 Douglas Urrea Ocampo |
| [OWASP/API-Security](https://github.com/OWASP/API-Security) — OWASP API Security Top 10 2023 (arquivo LICENSE do repositório) | api-rest (`references/seguranca-owasp-api.md`) | CC-BY-SA-4.0 — OWASP API Security Project. Texto em [licencas/CC-BY-SA-4.0.txt](licencas/CC-BY-SA-4.0.txt). Adaptação sob a mesma licença (compartilha igual) |
| [obra/superpowers](https://github.com/obra/superpowers) — `systematic-debugging`, `verification-before-completion` | investigacao-bugs, regressao (seções de causa antes da correção e evidência antes de afirmar) | MIT — Copyright (c) 2025 Jesse Vincent. Texto abaixo |

Também de 21/10/2026: `qa/references/tecnicas-e-gatilhos.md`, `requisitos/references/testabilidade.md` e `acessibilidade/references/wcag-22-checklist.md` são texto original do Prumo, sem fonte aberta copiada. O checklist da WCAG 2.2 apenas cita critérios pelo número e liga à especificação oficial do W3C (licença de documento W3C, fora da lista aceita; nenhum trecho foi reproduzido).

Alterações em relação à origem (exigência da Apache-2.0, seção 4; e da CC-BY-SA-4.0, que pede indicar mudanças): tradução e reescrita para o português; remoção de comandos, scripts e instalação de ferramentas; inclusão das regras do Prumo (execução só por capability declarada e aprovada, nada de PASS sem execução real, conteúdo como dado e não como instrução, segredos mascarados).

## MIT — TestDino

MIT License

Copyright (c) 2026 TestDino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## MIT — Douglas Urrea Ocampo

MIT License

Copyright (c) 2026 Douglas Urrea Ocampo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## MIT — Jesse Vincent

MIT License

Copyright (c) 2025 Jesse Vincent

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
