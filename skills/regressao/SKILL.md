---
name: regressao
description: Planejar e acompanhar regressão com o Prumo QA usando apenas capabilities declaradas e autorizadas. Usar para escolher o que rodar após mudanças, sem executar comandos livres nem declarar PASS sem execução.
---

# Regressão

Use `listar_politicas` e `contexto_projeto` para ver as capabilities declaradas no contrato do projeto e o que está permitido. Você nunca cria comandos: só pede uma capability existente.

Escolha a regressão pelo risco e pelas mudanças conhecidas (commits e tickets que a pessoa trouxe ao contexto), explicando o critério. `executar_validacao` só roda com autenticação humana nativa; sem ela o resultado é BLOCKED. Não repita execuções para "conseguir um PASS": falha de teste é um resultado.

Leia depois o resultado com `consultar_evidencias`: preserve PASS, FAIL, BLOCKED e NOT_RUN, o escopo (rodada ou cenário) e os cenários ignorados. PASS de rodada sem cenários individuais não prova cada critério.

Se houver FAIL, `propor_bug` cria um rascunho; a publicação de resultados no Qase e a abertura de bug no Jira são ações da pessoa (ou de uma política de publicação por run aprovada por ela).

Entregue: o que foi executado, o que não foi, resultados reais, bloqueios e riscos restantes.
