# Seleção de regressão e saúde da suíte

Adaptado de `playwright-regression-testing` (fugazi/test-automation-skills-agents, MIT; ver `backend/agentes/skills/TERCEIROS.md`) e ajustado às regras do Prumo QA: o Prumo só executa capabilities declaradas no contrato e autorizadas pela pessoa.

## Camadas de execução (referência, não obrigação)

| Camada | Quando | Orçamento de tempo sugerido pela fonte |
| --- | --- | --- |
| Smoke | cada commit | até 2 min |
| Sanidade | cada PR | até 10 min |
| Seletiva | merge | até 30 min |
| Completa | noturna ou pré-release | até 60 min |

Rodar a suíte completa a cada mudança é desperdício. Recomende a camada pelo risco e pela mudança, e diga qual capability declarada corresponde a cada camada. Se não houver capability para a camada desejada, isso é lacuna do contrato, não algo a improvisar.

## Como escolher

- **Pela mudança:** o que os commits e tickets trazidos ao contexto afetam.
- **Pelo risco:** áreas críticas, falhas recentes e histórico do projeto.
- **Pelo tempo disponível:** o que cabe no orçamento sem perder o que é crítico.
- Cada cenário é testado uma vez, no nível certo; marcadores de execução (`@smoke`, `@regression`, `@api`, ...) ajudam a filtrar sem duplicar.

## Testes instáveis

- Retry ou espera fixa não corrigem instabilidade: isolam o sintoma.
- Quarentena só temporária, com responsável e ticket. Quarentena silenciosa é sinal de alerta.
- O teste deve dar o mesmo resultado em ordem aleatória e sequencial.
- A fonte sugere considerar um teste confiável só depois de 5 rodadas seguidas consistentes.

## Saúde da suíte

Acompanhe duração, taxa de instabilidade e capacidade de detectar regressões. Duração subindo e instabilidade crescendo são alertas precoces; não espere bloquearem a release.

## Matriz de impacto

Antes de escolher a camada, cruze a mudança com o que ela pode afetar: dados e migrações, permissões, integrações externas, telas que usam o mesmo componente e fluxos críticos. Cada linha da matriz aponta o cenário ou a capability que a cobre, ou declara a lacuna. Mudança só de documentação pede apenas conferência dos links e do conteúdo.

## Teste que acompanha uma correção

Todo defeito corrigido pede um teste que reproduza o sintoma. Ele só prova algo se falhou antes da correção e passa depois, e essa comparação precisa de duas execuções autorizadas reais. Sem as duas, registre o teste como proposto e a prova como NOT_RUN.

## Resultado só com execução

Não escreva "deve passar" nem estime resultado de camada que não rodou. Relate por camada o que foi executado, o estado real e o que ficou de fora, com o motivo.
