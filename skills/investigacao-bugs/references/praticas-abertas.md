# Investigação de falhas: método

Adaptado de `qa-investigation` (fugazi/test-automation-skills-agents, MIT; ver `skills/TERCEIROS.md`) e ajustado às regras do Prumo QA.

## Classifique só depois de reproduzir

Um rótulo dado cedo demais contamina a investigação. Primeiro reproduza, depois classifique:

- **Intermitente:** falha às vezes, em rodadas idênticas. Isole variando repetição, paralelismo e ambiente.
- **Determinística:** falha sempre nas mesmas condições. Isole a entrada ou o estado que a dispara.
- **Não reproduzível:** não volta a falhar dentro de um número limitado de tentativas. Registre assim, com a evidência parcial e a suspeita (infraestrutura, lógica do produto ou tempo do teste). Não force um rótulo.

No Prumo, cada nova rodada só acontece por uma capability declarada e autorizada. Não peça execuções repetidas só para "conseguir PASS": a falha é o resultado.

## Evidência antes de hipótese

- Leia `consultar_evidencias`: estado, cenários, saída mascarada, escopo e horário.
- Registre ambiente, versão, dados usados e quantidade de execuções.
- Nunca copie tokens, cookies, credenciais, e-mails ou dados pessoais para o relato. Resuma o artefato com as partes sensíveis mascaradas.

## Hipótese que pode ser derrubada

- Candidatas comuns: condição de corrida, tempo de espera, seletor ou tela errada, defeito do produto, ambiente, estado compartilhado e dados instáveis.
- Para cada hipótese, diga que observação a derrubaria. Só aceite a hipótese depois que uma verificação não conseguiu derrubá-la.
- Compare rodada aprovada e reprovada (local e integração contínua, quando houver as duas).

## Correção e prevenção

- Decida se a correção é no teste ou no produto, e registre as alternativas descartadas e por quê.
- Uma correção só é estável depois de repetidas rodadas consistentes.
- Proponha prevenção: helper compartilhado, regra de lint, documentação ou teste de regressão.

## Antipadrões

- Classificar antes de reproduzir.
- Deixar o teste verde sem entender a causa (retry ou espera fixa não é correção).
- Guardar artefatos brutos com dados sensíveis.
- Omitir as alternativas descartadas.

O bug, quando confirmado, vira rascunho com `propor_bug`. Abrir no Jira continua sendo decisão da pessoa.
