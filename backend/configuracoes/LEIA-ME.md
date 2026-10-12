# configuracoes — backend

Configurações (Ajustes): preferências da pessoa — tema, idioma, avisos e som.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `preferenciasObter.ts` | Canal preferencias:obter: Ler as preferências de notificação e o aviso de atualização pendente. |
| `preferenciasSalvar.ts` | Canal preferencias:salvar: Alterar verificar ao iniciar, som, silenciar, tema, idioma, iniciar com o Windows e avisos de agenda. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `arquivoDePreferencias.ts` | Caminho de preferencias.json na pasta de dados. |
| `gravarPreferencias.ts` | Grava as preferências da pessoa com segurança (cópia temporária e troca). |
| `lerPreferencias.ts` | Lê as preferências da pessoa; se faltarem ou estiverem inválidas, usa o padrão seguro. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `alterarPreferencias.ts` | Altera as preferências pedidas pela tela (tema, idioma, som, avisos...) sem mexer na autorização de IA. |
| `idiomaAtual.ts` | Idioma escolhido pela pessoa (pt-BR ou en). |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `configuracoes.ts` | Formato das preferências da pessoa (tema, idioma, avisos, IA) e seus valores padrão. |
