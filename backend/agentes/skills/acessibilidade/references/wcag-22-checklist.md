# Checklist rápido: critérios novos da WCAG 2.2 e armadilhas comuns

Texto original do Prumo, que apenas aponta critérios da [WCAG 2.2](https://www.w3.org/TR/WCAG22/) pelo número; o texto normativo é consultado na fonte oficial. Cada item exige observação real em tela, teclado ou zoom; sem observação, é NOT_RUN.

## Critérios novos na 2.2 que costumam ser esquecidos

- **2.4.11 Foco não encoberto:** ao navegar por Tab, o elemento focado não fica escondido atrás de cabeçalho fixo, banner de cookies ou chat.
- **2.5.7 Movimentos de arrastar:** toda ação de arrastar tem alternativa por clique ou teclado.
- **2.5.8 Tamanho do alvo:** alvos de toque com pelo menos 24 por 24 CSS px, ou espaçamento que compense.
- **3.2.6 Ajuda consistente:** o mecanismo de ajuda fica no mesmo lugar nas telas.
- **3.3.7 Entrada redundante:** não pedir de novo dado já informado na mesma sequência.
- **3.3.8 Autenticação acessível:** login sem exigir memorizar, transcrever ou resolver quebra-cabeça; colar senha deve funcionar.

## Armadilhas frequentes em interfaces

- Mensagem de erro só em cor, ou fora do campo sem ligação programática.
- Placeholder usado no lugar de rótulo.
- Ícone sem nome acessível; link "clique aqui" sem contexto.
- Alteração de estado (toast, carregamento, resultado de busca) sem região anunciada.
- Modal sem foco inicial, sem retorno do foco ou que permite Tab para o fundo.
- Tempo limite sem aviso ou extensão.
- Contraste insuficiente nos estados de foco, desabilitado e erro, além do estado normal.

## Registro

Para cada achado: critério pelo número, elemento, viewport, passos, esperado, observado e evidência. Ferramenta automática limpa não encerra a revisão.
