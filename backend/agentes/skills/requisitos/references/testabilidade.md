# Testabilidade de requisitos

Texto original do Prumo. Use ao revisar se um requisito ou critério de aceite pode virar teste. Não substitui a aprovação humana do requisito.

## Perguntas de testabilidade

- Qual é a condição de partida, o gatilho e o resultado observável? Sem os três, é lacuna.
- Quem pode fazer a ação, e o que muda para os demais perfis?
- Há limites, formatos ou estados anteriores que alteram o resultado?
- O que acontece em erro: mensagem, estado final, dado gravado ou não?
- Como alguém confere o resultado sem olhar o código?

## Palavras que escondem ambiguidade

"Rápido", "adequado", "amigável", "quando necessário", "etc.", "normalmente", "se possível", "deve ser seguro". Cada uma pede um número, uma lista ou uma decisão humana. Registre a pergunta exata; não escolha a interpretação.

## Rascunho no formato Dado, Quando, Então

Use só para tornar o critério verificável e deixe claro que é rascunho. Um comportamento por cenário: se aparecer "e" no Então com dois resultados independentes, divida. Não invente dados, perfis ou telas que o requisito não cita.

## Rastreabilidade honesta

Relacionar ticket e caso mostra intenção, não cobertura. Cobertura de um critério exige ler o teste e achar a verificação que prova aquele critério. Critério sem teste é lacuna; teste sem critério é candidato a revisão, não a remoção.

## Sinais de conflito

Dois requisitos que pedem resultados diferentes para a mesma condição, versão antiga e nova convivendo, ticket que contradiz o contexto APROVADO. Todos são lacunas bloqueantes: descreva os dois lados e peça decisão.
