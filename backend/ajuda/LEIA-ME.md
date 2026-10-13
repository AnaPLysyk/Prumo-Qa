# ajuda — backend

Ajuda: documentos, versões, integrações técnicas e privacidade dos dados.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `ajudaDocumentos.ts` | Canal ajuda:documentos: Documentos da Central de ajuda. |
| `ajudaIntegracoes.ts` | Canal ajuda:integracoes: Catálogo técnico das operações IPC e das ferramentas MCP. |
| `ajudaVersoes.ts` | Canal ajuda:versoes: Histórico de versões e versão instalada. |
| `dadosExcluir.ts` | Canal dados:excluir: Excluir histórico operacional, evidências de um projeto ou diagnósticos do aplicativo. |
| `dadosResumo.ts` | Canal dados:resumo: Mostrar onde ficam os dados locais e quanto espaço ocupam. |
| `siteAbrir.ts` | Canal site:abrir: Abrir o site oficial do Prumo QA no navegador, depois de confirmar. |

## privacidade/

Quanto espaço os dados ocupam e o que fica só neste computador.

| Arquivo | O que faz |
| --- | --- |
| `medirPasta.ts` | Mede quanto espaço uma pasta de dados ocupa (com limite de arquivos). |
| `resumirDados.ts` | Resume os dados do Prumo neste computador por categoria (tamanho e arquivos), para Ajuda › Privacidade e dados. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `lerDocumentosDaAjuda.ts` | Lê os documentos da Ajuda (Markdown) e troca {{VERSAO}} pela versão instalada. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `privacidade.ts` | Textos de privacidade (retenção, o que não é transmitido, limites) e as categorias da pasta de dados. |
| `versoes.ts` | Formato do histórico de versões (app/versoes.json), o padrão de número de versão e o repositório oficial. |

## versoes/

Histórico de versões do Prumo.

| Arquivo | O que faz |
| --- | --- |
| `analisarVersao.ts` | Lê uma versão no formato 2.10.2 (aceita "v" na frente). |
| `apresentarVersoes.ts` | Prepara a lista de versões para a Ajuda, marcando a instalada. |
| `carregarVersoes.ts` | Lê e valida o histórico de versões (app/versoes.json). |
| `compararVersoes.ts` | Compara duas versões: negativo se a primeira é mais antiga. |
| `conferirInstalada.ts` | Confere que a versão instalada consta no histórico. |
| `enderecoDaVersao.ts` | Endereço da página da versão no GitHub. |
| `notasDaVersao.ts` | Escreve as notas de uma versão em Markdown (usadas na release do GitHub). |
| `validarVersoes.ts` | Confere o histórico de versões: ordem decrescente, sem repetição, datas e campos obrigatórios. |
