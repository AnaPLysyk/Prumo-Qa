---
name: acessibilidade
description: Avaliar teclado, foco, nomes acessíveis, erros, contraste, zoom e reflow em interfaces reais. Usar em revisão de acessibilidade ou mudanças relevantes de interação e layout; complementar qa e Playwright quando aplicável.
---

# Acessibilidade e responsividade

Consulte a interface e os requisitos autorizados. Relacione cada achado a um elemento, interação, viewport e critério relevante da [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Não conclua conformidade completa por um scanner aprovado.

Avalie fluxos pelo teclado: Tab e Shift+Tab, Enter/Espaço, escape de sobreposições, ordem de foco, ausência de armadilha e foco visível. Confira papel, nome acessível e estado dos controles; campos precisam de rótulo associado, erros precisam indicar o campo e como corrigir. Use `id` único quando a associação por `for` ou referência ARIA precisar dele; rótulo envolvendo o campo pode dispensar `id`.

Confira contraste de texto e estados relevantes (WCAG 1.4.3 e 1.4.11). Registre cores calculadas e razão medida; screenshot sozinho não mede contraste. Teste texto a 200% e interface a 400%, verificando leitura, ação e reflow, inclusive largura equivalente a 320 CSS px. Conteúdo tabular pode exigir rolagem bidimensional; isso não autoriza overflow da página inteira. Referência: [reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

Teste resoluções pequenas e amplas, conteúdo longo e mensagens de erro. Verifique se leitor de tela anuncia nomes, estados e mensagens; sem leitor realmente utilizado, marque essa parte como NOT_RUN.

Com Playwright confirmado, use locators por papel/rótulo e assertions do estado acessível. Ferramentas como axe ajudam a encontrar parte dos problemas; combine com teclado, zoom, contraste e avaliação manual conforme [documentação oficial](https://playwright.dev/docs/accessibility-testing). Não instale ferramenta ou altere a aplicação só para produzir uma pontuação.

Entregue passos de reprodução, resultado esperado, observado, evidência e limitações. Separe achado confirmado, suspeita e verificação não executada. Preserve as permissões e a distinção entre análise e execução da Skill qa.

Para varredura com axe-core, exclusões pontuais documentadas e checagens de teclado, diálogo e foco, consulte [práticas abertas](references/praticas-abertas.md).

Gatilhos: aplique esta Skill quando a mudança tocar formulário, diálogo, menu, navegação, cor, tamanho de texto ou mensagem de erro. Para os critérios novos da WCAG 2.2 e armadilhas comuns, consulte o [checklist](references/wcag-22-checklist.md).
