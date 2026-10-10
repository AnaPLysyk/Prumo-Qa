# Revisão de código, arquitetura e manutenção

Use quando o pedido envolve qualidade estrutural, revisão de código ou manutenção. Complemente a metodologia da Skill qa; não inicie refatoração apenas por consultar este roteiro.

Antes de recomendar, identifique stack e arquitetura pela configuração e pelos imports reais. Localize implementação equivalente, contratos de entrada/saída, chamadores e testes. Documente o escopo lido e os arquivos omitidos. Nome parecido não prova responsabilidade duplicada; ausência numa busca não prova arquivo sem uso (considere carregamento dinâmico, geração, configuração e empacotamento).

Para cada achado, registre arquivo/linha ou contrato, fato observado, hipótese quando aplicável, risco, justificativa e impacto esperado da menor mudança. Confira coesão, fronteiras frontend/núcleo, validação de entradas, tipagem, tratamento de erros e permissões. Uma camada extra só se justifica por responsabilidade ou reutilização demonstrada. Não delete arquivos nem dependências sem confirmar seus consumidores e o escopo autorizado.

Duplicação de texto ou corpo de função é candidata: compare dados, domínio, estados e oráculo antes de consolidar. Testes de API, UI e integração podem repetir uma regra e cobrir riscos diferentes. Helpers e Page Objects devem reduzir manutenção observável; não imponha um padrão por preferência.

Compare documentação com contratos e comportamento realmente executado. Código não aprova regra de negócio. Quando requisito e implementação divergem, registre a divergência; não altere o resultado esperado para aceitar o defeito.

Teste a recomendação contra pelo menos um controle: uma implementação semelhante com responsabilidade legítima ou um teste curto com assertion relevante deve permanecer sem acusação de redundância. Análise de imports, AST ou ferramenta especializada pode sustentar um achado; uma expressão regular isolada não comprova erro de arquitetura.
