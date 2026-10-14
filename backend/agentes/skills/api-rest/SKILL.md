---
name: api-rest
description: "Fundamentos para revisar testes de API REST: contrato, status, corpo, autorização (positivo e negativo), idempotência, persistência após a operação e massa de dados. Usar quando o projeto tiver testes que chamam endpoints reais declarados nos requisitos."
---

# Testes de API REST — fundamentos

**Objetivo.** Dar à IA um roteiro de análise de testes de API que parte de requisitos aprovados e de endpoints **realmente documentados no projeto**. Não invente endpoints, métodos, campos, códigos de status nem massas.

**Quando aplica.** `contexto_projeto` pode listar `api-rest` em `frameworks` (PROVAVEL, inferido de chamadas HTTP em testes). Sem requisito ou contrato de API no contexto autorizado, registre a lacuna e peça o requisito.

## Critérios de análise

1. **Contrato.** O requisito define método, caminho, entradas, saídas e erros? Se não, é lacuna (não deduza do código).
2. **Status e corpo.** Verificar só "sucesso" não prova o comportamento: confira o corpo esperado (campos relevantes) e o status específico exigido pelo requisito.
3. **Persistência.** Depois de uma gravação, consulte o estado no servidor (um `GET` posterior ou verificação equivalente). Depois de uma operação **recusada**, confirme que o dado permaneceu inalterado.
4. **Autorização.** Cubra o perfil permitido **e** os negados (sem credencial, perfil insuficiente), com resultado esperado e oráculo de cada um.
5. **Entradas inválidas e limites.** Partições válidas/inválidas e valores-limite do requisito (técnicas do ISTQB), sem repetir classes equivalentes.
6. **Isolamento e massa.** Cada teste prepara e limpa seus dados; não depender da ordem de execução; nunca usar banco ou ambiente reais.
7. **Idempotência e repetição.** Quando o requisito exigir (ex.: repetir uma criação), teste o comportamento declarado.

## Antipadrões

- Confiar em `ok()`/`2xx` como única verificação (o Prumo marca `PW_API_SO_STATUS` em testes Playwright de API).
- Teste que depende de dados deixados por outro teste.
- Dados e credenciais reais ou de produção.
- Afirmar PASS sem execução real e evidência.

## Com Playwright

A fixture `request` do Playwright permite testar a API, preparar estado antes de testes de interface e conferir o estado depois de uma ação de interface ([api-testing](https://playwright.dev/docs/api-testing)). A orientação específica de Playwright está em `backend/agentes/skills/playwright/SKILL.md`.

## Fonte

Documentação oficial do Playwright para testes de API e as técnicas de teste do ISTQB CTFL já aplicadas na Skill `qa`. Outras ferramentas (Postman/Newman, Cypress, testes de contrato) ainda **não** têm conhecimento especializado neste produto.

Para o checklist por resposta (esquema, 401/403, idempotência, paginação, limites) e dados de teste, consulte [práticas abertas](references/praticas-abertas.md).
