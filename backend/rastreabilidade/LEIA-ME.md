# rastreabilidade — backend

Rastreabilidade: o mapa de ligações entre tickets, casos, runs, execuções e evidências.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `vinculosMapa.ts` | Canal vinculos:mapa: Mapa de vínculos entre projeto, Jira, Qase, repositório, tickets, casos, runs, execuções e evidências, com lacunas de cadastro. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `mapaDeVinculos.ts` | Desenha o mapa de ligações do projeto (Jira, Qase, repositório, tickets, casos, runs, execuções e evidências) e mostra o que falta ligar. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `mapaDeVinculos.ts` | Formato dos nós e ligações do mapa de rastreabilidade. |
