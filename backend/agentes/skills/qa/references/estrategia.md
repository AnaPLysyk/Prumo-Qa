# Revisão de estratégia de teste (entrevista guiada)

Adaptado de `grill-me-qa` (fugazi/test-automation-skills-agents, MIT; ver `backend/agentes/skills/TERCEIROS.md`) e ajustado às regras do Prumo QA. Use quando a pessoa pedir para revisar um plano de automação, estratégia de teste ou adoção de IA nos testes, antes de implementar.

## Como conduzir

- Uma pergunta por vez, sempre com uma resposta recomendada e o porquê.
- Leia antes o contexto autorizado, os testes e a configuração de integração contínua; não pergunte o que já está documentado.
- Não aceite "depende": peça uma decisão concreta ou registre como pendente.
- Prefira profundidade a quantidade: 10 a 15 perguntas no total.

## Cinco dimensões, nesta ordem

1. **Estratégia e cobertura:** formato da pirâmide, prioridades por risco, fronteira entre automatizado e exploratório, testes não funcionais (desempenho, segurança, acessibilidade).
2. **Ferramentas:** por que este framework, linguagem, padrão (Page Object, Screenplay, híbrido), relatórios.
3. **Arquitetura de teste:** isolamento, massa de dados (criação, limpeza, fábricas), ambientes, paralelismo, política de retry e instabilidade.
4. **IA nos testes:** onde entra (geração, correção, análise, triagem), como o teste gerado é validado, onde a pessoa decide, como lidar com alucinação e custo. Se não há uso de IA, marque como não aplicável após uma ou duas checagens.
5. **Integração contínua:** etapas e portões de qualidade, orçamento de tempo, seleção de testes, falhar cedo ou relatar no fim, tratamento de instáveis.

## Antipadrões a contestar

Espera fixa em vez de condição; seletores frágeis; testes dependentes de ordem; pirâmide invertida; assertion sobre detalhe de implementação; ausência de estratégia de dados; login completo repetido; nenhuma medida de instabilidade; cobertura em porcentagem como vaidade; suíte acima do orçamento sem sharding; teste gerado por IA sem revisão; instabilidade tolerada.

## Resultado

Um registro de decisão com, por dimensão, o estado (resolvido, adiado, aberto), a pergunta, a recomendação, a escolha e o motivo, mais os pendentes e próximos passos. Itens adiados ficam explícitos com o impacto.
