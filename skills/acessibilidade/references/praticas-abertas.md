# Acessibilidade automatizada com Playwright e axe-core

Adaptado de `a11y-playwright-testing` (fugazi/test-automation-skills-agents, MIT; ver `skills/TERCEIROS.md`) e ajustado às regras do Prumo QA. Só aplique quando o projeto já usa Playwright; não instale ferramentas para gerar pontuação.

## Varredura com axe

- Alvo: WCAG 2.2 nível AA, que inclui a 2.1 AA. Etiquetas usuais: `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22a`, `wcag22aa`; `best-practice` é complementar.
- Espere a página ficar estável antes de varrer. Conteúdo carregado depois produz "0 violações" falso.
- Varra a página inteira ou um componente específico, e espere `violations` vazio.
- Nunca desligue uma regra no projeto todo. Exclusão só pontual, com motivo, critério WCAG afetado, impacto, responsável, prazo e ticket.
- Contraste sobre imagem ou degradê pode dar falso positivo: trate com exclusão pontual documentada e meça manualmente.

## O que o axe não substitui

A própria fonte estima que a automação cobre só uma parte dos problemas (cerca de 30 a 40%). Varredura limpa não é conformidade. Continue exigindo:

- **Teclado:** todo controle alcançável por Tab, ordem lógica, Enter envia formulário, teclas esperadas funcionam.
- **Diálogos:** o foco entra ao abrir, fica preso dentro, Escape fecha e o foco volta ao elemento que abriu.
- **Link "pular para o conteúdo":** é o primeiro Tab e leva o foco ao conteúdo principal (o destino precisa de `tabindex="-1"`).
- **Foco visível:** ausência de estilo de foco é defeito.
- **WCAG 2.2:** foco não encoberto, alternativa a movimentos de arrastar e tamanho mínimo de alvo.

## Semântica

- Prefira HTML nativo a ARIA: `<button>` real em vez de `<div role="button">`.
- Se um elemento não é encontrado por papel ou rótulo (`getByRole`, `getByLabel`), isso é um sinal de nome acessível ausente, não motivo para trocar o locator.
- Confira landmarks, títulos, rótulos, mensagens de erro e instruções.

## Limites

Leitor de tela real, texto alternativo significativo e ordem de leitura exigem avaliação humana. Sem esse teste feito, marque como NOT_RUN.
