# inicio — backend

Início: o painel do projeto e o assistente local que responde com os dados deste computador, sem IA.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `assistenteAbertura.ts` | Canal assistente:abertura: Abrir a conversa: cumprimentar pelo nome, resumir a situação do projeto e, se ainda não souber, perguntar como chamar a pessoa e o papel dela. |
| `assistentePerguntar.ts` | Canal assistente:perguntar: Responder uma pergunta com os dados locais do projeto (contextos aprovados, propostas, execuções, agenda). Não usa modelo de IA nem rede. |
| `assistenteSituacao.ts` | Canal assistente:situacao: Resumir o que está acontecendo agora no projeto para o painel inicial. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `perguntarAoAssistenteLocal.ts` | Responde uma pergunta do Início com os dados locais do projeto (contextos, propostas, execuções, agenda), sem IA e sem internet. |
| `perguntaTemPalavra.ts` | Diz se a pergunta contém alguma das palavras-chave. |
| `situacaoDoProjeto.ts` | Escreve até cinco linhas sobre o que está acontecendo no projeto agora (propostas, runs, execuções, agenda) para o painel do Início. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `assistenteLocal.ts` | Formato da resposta do assistente local do Início (linhas e fontes) e as palavras ignoradas nas perguntas. |
