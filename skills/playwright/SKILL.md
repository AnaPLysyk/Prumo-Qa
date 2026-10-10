---
name: playwright
description: Revisar e orientar testes Playwright (TypeScript/JavaScript): locators, assertions, isolamento, esperas, retentativas, testes de API e E2E. Usar só quando o Prumo confirmar Playwright no projeto. Complementa a Skill qa; não a substitui.
---

# Playwright — conhecimento especializado

**Objetivo.** Ajudar a IA a avaliar testes Playwright que realmente existem no projeto, apontando problemas reais e justificando cada recomendação com a documentação oficial. Não é um gerador de testes, não impõe uma arquitetura única e nunca altera testes sem pedido e autorização.

**Quando aplicar.** Somente se `contexto_projeto` trouxer `frameworks` com `playwright` em estado `CONFIRMADO` (dependência `@playwright/test` mais configuração ou teste que a importa). Em `PROVAVEL` ou `INCERTO`, registre a incerteza e peça confirmação em vez de assumir. Não invente configuração, comando ou dependência.

**Como usar com o Prumo.**
1. Leia os requisitos **aprovados** do projeto (`contextos`); rascunho não é regra confirmada e conflito deve ser esclarecido, não resolvido por você.
2. Chame `contexto_projeto` (frameworks e fontes) e `revisar_cobertura` informando `existingTests` com `testPath`; o Prumo devolve achados `PW_*` do arquivo realmente lido.
3. Para cada achado, confira no código se procede (a análise é textual e pode errar) e só então recomende. Cada recomendação traz o requisito ou risco que a justifica.
4. Prefira poucos cenários úteis a dezenas de repetições. Não proponha Page Object Model como regra geral: use-o quando a duplicação de lógica de página realmente existir.

## Boas práticas (e a fonte)

- **Teste comportamento visível ao usuário e mantenha os testes isolados.** Cada teste roda em um contexto novo de navegador; dados de servidor não são isolados automaticamente: prepare e limpe a massa. ([best-practices](https://playwright.dev/docs/best-practices), [writing-tests](https://playwright.dev/docs/writing-tests))
- **Locators por atributos voltados ao usuário** (`getByRole`, `getByLabel`, `getByText`, `getByTestId`) em vez de CSS/XPath presos à estrutura do DOM; locators são estritos e `first()/last()/nth()` desligam essa checagem. ([locators](https://playwright.dev/docs/locators))
- **Assertions que repetem** (`await expect(locator).toBeVisible()`) em vez de ler o valor uma vez. Asserções não repetidas (`toBe`, `toBeTruthy` sobre valor lido) podem gerar teste instável. ([test-assertions](https://playwright.dev/docs/test-assertions), [best-practices](https://playwright.dev/docs/best-practices))
- **Auto-waiting:** ações esperam a elementos estarem acionáveis; não é preciso espera manual. Evite `force: true`, que desliga verificações. ([actionability](https://playwright.dev/docs/actionability))
- **Retentativas e modo serial:** retentativas classificam o teste como "flaky" em vez de aprovado limpo; serial pula os seguintes após uma falha. Prefira testes isolados e investigue instabilidade em vez de mascará-la. ([test-retries](https://playwright.dev/docs/test-retries))
- **Testes de API:** a fixture `request` serve para testar a API, preparar estado e conferir o estado do servidor depois de uma ação de interface. Valide o corpo, não só o sucesso. ([api-testing](https://playwright.dev/docs/api-testing))
- **Diagnóstico:** use o trace viewer na CI; não grave trace em todos os testes. ([best-practices](https://playwright.dev/docs/best-practices))

## Antipadrões que o Prumo reconhece (regra `PW_*`)

| Regra | O que indica | Cuidado com falso positivo |
|---|---|---|
| `PW_ESPERA_FIXA` | `waitForTimeout`/`setTimeout` | Raro uso legítimo (depuração); justifique |
| `PW_SELETOR_FRAGIL` | XPath, `:nth-child`, classes geradas, cadeia de `div`, `first/last/nth` | Um `nth` pode ser inevitável em listas idênticas |
| `PW_SEM_ASSERTION` | corpo do teste sem `expect` nem verificação | A verificação pode estar em função auxiliar |
| `PW_ASSERTION_FRACA` | `toBeTruthy/toBeDefined`, `expect(true)` | Em respostas de API a checagem de sucesso é comum; veja `PW_API_SO_STATUS` |
| `PW_ASSERTION_SEM_AWAIT` | assertion que repete sem `await` | O teste pode passar sem verificar |
| `PW_ASSERTION_NAO_REPETE` | `expect(await x.isVisible()).toBe(true)` | Leitura única do valor |
| `PW_TESTE_IGNORADO`, `PW_TEST_ONLY` | `skip/fixme`, `only` | `skip` condicional por ambiente pode ser legítimo |
| `PW_FORCE` | `{ force: true }` | Às vezes para elemento sobreposto conhecido; investigar |
| `PW_DEPENDENCIA_ENTRE_TESTES` | `describe.serial` / `mode: 'serial'` | Fluxos realmente sequenciais |
| `PW_RETRY_ESCONDE_FALHA` | `retries > 0` | Aceitável com relatório de flaky monitorado |
| `PW_TESTE_DUPLICADO` | corpos idênticos | Parametrizações geradas |
| `PW_API_SO_STATUS` | teste de API sem validar corpo | Pode haver validação em helper |

O Prumo **não** consegue, só pelo texto, saber se há validação de persistência, cobertura negativa suficiente ou se um teste é redundante semanticamente: isso é julgamento seu, sempre fundamentado no requisito aprovado.

## Exemplos pequenos

Ruim (instável e fraco):
```ts
await page.click('div > div > button.css-1x2y3');
await page.waitForTimeout(2000);
expect(await page.title()).toBeTruthy();
```
Melhor (requisito: "o botão Salvar confirma a gravação"):
```ts
await page.getByRole('button', { name: 'Salvar' }).click();
await expect(page.getByRole('status')).toHaveText('Gravado');
// e, quando o requisito é persistência, confira o servidor:
const r = await request.get(`/pedidos/${id}`); expect(await r.json()).toMatchObject({ status: 'ABERTO' });
```

## Avaliação

O laboratório (`Prumo-QA-Lab`) mantém casos com testes Playwright estáticos (locator frágil, espera fixa, sem assertion, ignorado, duplicado, falso positivo) e critérios objetivos. Resultados reais, não suposições, indicam se estas orientações melhoram a análise de uma IA.
