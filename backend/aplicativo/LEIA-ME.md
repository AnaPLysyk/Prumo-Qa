# aplicativo — backend

Aplicativo: a janela do Windows, a bandeja, os avisos e o registro de todos os canais da janela (IPC).

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## Nesta pasta

| Arquivo | O que faz |
| --- | --- |
| `estadoDoAplicativo.ts` | O que muda enquanto o aplicativo está aberto: janela, ícone da bandeja, encerramento, último aviso e a última versão verificada. |

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `appInfo.ts` | Canal app:info: Informar versão, pasta de dados e se o app está empacotado. |
| `arquivosDosCanais.ts` | Onde cada canal da janela é atendido: o arquivo da tela e as funções que ele chama. Gerado do código pela reorganização. |
| `catalogoDeContratos.ts` | Lista oficial do que a janela (IPC) e os agentes de IA (MCP) podem pedir ao Prumo, com o formato de cada pedido e sua explicação. |
| `mensagemComCodigo.ts` | Prepara a mensagem de erro para a janela: segredos mascarados e o código do erro na frente. |
| `registrarCanaisIpc.ts` | Liga cada canal da janela (IPC) à função da tela que o atende. |
| `registrarCanal.ts` | Registra um canal da janela: só aceita a própria página, valida os dados pelo contrato, registra diagnóstico e nunca vaza detalhes internos. |
| `TratadorDoCanal.ts` | Formato da função que atende um canal da janela: recebe os dados já validados pelo contrato e a janela que pediu. |

## avisos/

Avisos enviados à janela (eventos do worker e pedidos para abrir uma tela).

| Arquivo | O que faz |
| --- | --- |
| `avisosDaJanela.ts` | Fila dos últimos 100 avisos para a janela (eventos do worker e pedidos de navegação). |
| `empilharAviso.ts` | Põe um aviso na fila da janela, numerado, guardando os 100 últimos. |
| `publicarEventoDoWorker.ts` | Transforma um evento do worker em aviso da janela e, se a pessoa quiser, em notificação do Windows. |

## bandeja/

O ícone do Prumo na bandeja do Windows e seu menu.

| Arquivo | O que faz |
| --- | --- |
| `acaoDoMenuDaBandeja.ts` | Executa o item escolhido no menu da bandeja (abrir, agenda, pausar, estado, sair). |
| `atualizarBandeja.ts` | Atualiza o menu e a dica do ícone da bandeja com o estado do worker. |
| `criarBandeja.ts` | Cria o ícone do Prumo na bandeja do Windows e vigia o worker a cada 15 segundos. |
| `dicaDaBandeja.ts` | Texto que aparece ao passar o mouse no ícone da bandeja. |
| `itensDoMenuDaBandeja.ts` | Monta os itens do menu da bandeja conforme o estado do worker. |
| `menuDaBandeja.ts` | Monta o menu da bandeja do Windows. |
| `resumoDoWorker.ts` | Escreve numa frase o estado do worker (parado, pausado, executando, ativo). |
| `textoNoIdioma.ts` | Devolve um texto da bandeja/avisos no idioma escolhido, preenchendo os valores {x}. |

## janela/

A janela do aplicativo e a confirmação nativa do Windows.

| Arquivo | O que faz |
| --- | --- |
| `confirmarNoWindows.ts` | Mostra a caixa de confirmação NATIVA do Windows (que a página não consegue simular) e diz se a pessoa confirmou. |
| `criarJanela.ts` | Cria a janela segura do Prumo (sem Node na página, sem navegação, sem novas janelas); fechar só esconde. |
| `mostrarJanela.ts` | Mostra a janela (cria se foi fechada) e traz para a frente. |
| `navegarPara.ts` | Pede à janela que abra uma tela (ex.: Execuções) e mostra a janela. |
| `usuarioDoWindows.ts` | Nome do usuário do Windows, lido aqui (nunca informado pela página), usado como aprovador. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `aplicativo.ts` | Caminhos e constantes do processo principal: pasta da página, origem permitida, versão instalada e textos de exclusão. |
| `textosDaBandeja.ts` | Textos em português e inglês da bandeja do Windows, das notificações e das confirmações nativas. |
