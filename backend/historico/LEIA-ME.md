# historico — backend

Histórico: operações do projeto consolidadas (início e término).

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `projetoHistorico.ts` | Canal projeto:historico: Operações consolidadas com achados e recomendações padronizadas. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `listarHistoricoDoProjeto.ts` | Lista as operações do projeto já consolidadas (início + término) para a tela Histórico. |
