# logs — backend

Logs: diário de operações do CLI e do MCP e o diagnóstico técnico da janela.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `diagnosticoListar.ts` | Canal diagnostico:listar: Listar o diagnóstico técnico das chamadas da interface. |
| `logsExportar.ts` | Canal logs:exportar: Exportar o histórico bruto do projeto para um arquivo escolhido pela pessoa. |
| `projetoLogs.ts` | Canal projeto:logs: Eventos de início e término das operações, com filtros. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `arquivosDoDiario.ts` | Lista os arquivos do diário de uma pasta, com limite de 10.000. |
| `consultarAtividades.ts` | Lê o diário do projeto conferindo formato e integridade; arquivos inválidos ficam de fora com aviso. |
| `excluirAtividades.ts` | Apaga o diário de operações do projeto (Ajuda › Privacidade e dados), informando falhas. |
| `excluirDiagnostico.ts` | Apaga o diagnóstico da janela, informando falhas. |
| `gravarNoDiario.ts` | Grava o início ou o término de uma operação no arquivo próprio dela, com nível, impressão digital e fsync. |
| `lerDiagnostico.ts` | Lê os registros mais recentes do diagnóstico da janela. |
| `pastaAtividades.ts` | Pasta do diário de operações do projeto (fora da pasta do projeto). |
| `pastaDoDiagnostico.ts` | Pasta do diagnóstico da janela (LOCALAPPDATA\PrumoQA\diagnostico). |
| `registrarDiagnostico.ts` | Registra uma chamada da janela (canal, estado, duração, código), só metadados e com limite por dia. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `achadoELacuna.ts` | Diz se um tipo de achado é uma lacuna (requisito faltando, cobertura, rastreabilidade...). |
| `acompanharLogs.ts` | Acompanha o diário ao vivo (prumo logs --follow) até a pessoa interromper. |
| `apresentarRegistroDoDiario.ts` | Prepara um registro do diário de operações para a tela, com o texto dos achados e "sem término observado" quando a operação não terminou. |
| `avisarFalhaDoDiario.ts` | Avisa no stderr quando o diário não pôde ser gravado, sem perder o resultado da operação. |
| `descreverAchados.ts` | Escreve em texto as orientações dos achados de uma operação. |
| `exportarLogs.ts` | Gera o texto JSON com todos os registros do diário do projeto para salvar em arquivo. |
| `filtrarRegistrosDoDiario.ts` | Filtra registros do diário por ferramenta, estado e período. |
| `iniciarAtividade.ts` | Registra o início de uma operação (ferramenta, origem, contagens da entrada) e devolve como registrar o término. |
| `listarLogsDoProjeto.ts` | Lista os registros do diário de operações do projeto para a tela Logs, com filtro. |
| `observar.ts` | Executa uma operação registrando início e término no diário, mesmo quando ela falha. |
| `resumoVazio.ts` | Resumo vazio de achados (tudo zero). |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `atividade.ts` | Formato de um registro do diário de operações, ferramentas conhecidas, orientações dos achados e limites do histórico. |
| `diagnostico.ts` | Formato de um registro do diagnóstico da janela (só metadados) e seus limites. |
