# atualizacoes — backend

Atualizações (sino): consulta de versão nova, aviso automático e atualização com um clique.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `atualizacaoAbrir.ts` | Canal atualizacao:abrir: Abrir no navegador a página oficial da release encontrada. |
| `atualizacaoInstalar.ts` | Canal atualizacao:instalar: Atualizar com um clique para a versão encontrada pela consulta (2.10.2). |
| `atualizacaoVerificar.ts` | Canal atualizacao:verificar: Consultar a release oficial mais recente (somente quando a pessoa clica). |
| `preferenciasVisualizada.ts` | Canal preferencias:visualizada: Marcar a versão disponível como vista (o indicador some até haver versão mais nova). |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `avisoAutomaticoDeVersao.ts` | Aviso automático de versão nova (ao abrir e a cada 6 horas): acende o sino e mostra notificação do Windows uma vez por versão. |
| `avisoDeVersaoPendente.ts` | Diz se o sino deve acender: há versão mais nova que a instalada e ainda não vista. |
| `baixarAtualizacao.ts` | Baixa o instalador e o .sha256 da release oficial e confere o SHA-256 antes de aceitar. |
| `baixarComRedirecionamentoSeguro.ts` | Baixa seguindo só redirecionamentos permitidos. |
| `consultarAtualizacao.ts` | Consulta se há versão nova (no teste, só no servidor local) e atualiza o aviso do sino. |
| `destinoAutorizado.ts` | Confere que a consulta vai só ao endereço fixo das releases do Prumo (ou ao servidor local de teste). |
| `downloadPermitido.ts` | Diz se um endereço de download é permitido (só GitHub oficial, ou 127.0.0.1 em teste). |
| `enderecoDoInstalador.ts` | Endereço oficial do instalador de uma versão no GitHub. |
| `entregarInstalador.ts` | Fora do Windows o instalador não roda sozinho: o arquivo conferido vai para a pasta Downloads e a pessoa o abre. |
| `limparTextoDaRelease.ts` | Tira caracteres de controle e limita o texto vindo da release. |
| `marcarVersaoVista.ts` | Marca a versão nova como vista: o ponto do sino apaga até sair outra mais nova. |
| `nomeDoInstalador.ts` | Nome do arquivo do instalador de uma versão, no mesmo padrão do electron-builder (electron-builder.yml) para cada sistema. |
| `plataformaDoInstalador.ts` | Qual instalador serve a este computador: Windows, macOS (Apple Silicon ou Intel) ou Linux (AppImage ou .deb). |
| `registrarConsultaDeVersao.ts` | Guarda o resultado da consulta de versão e decide se toca o som e se avisa (uma vez por versão). |
| `verificarAtualizacao.ts` | Consulta a última versão no GitHub e diz se há atualização; quando não conclui, diz o motivo (sem conexão, limite, recusa...). |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `consulta.ts` | Endereço fixo da consulta de versão, formato da resposta do GitHub e do resultado. |
| `instalador.ts` | Endereços permitidos, limites e argumentos do instalador baixado na atualização. |
