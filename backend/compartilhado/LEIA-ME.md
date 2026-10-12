# compartilhado — backend

Compartilhado: só o que várias telas usam de verdade — segurança, erros, textos, contrato do projeto e pasta de dados.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## Nesta pasta

| Arquivo | O que faz |
| --- | --- |
| `raizDoAplicativo.ts` | Pasta raiz do aplicativo instalado. |
| `versaoDoPacote.ts` | Versão instalada do Prumo, lida do package.json. |

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `interfaceExportar.ts` | Canal interface:exportar: Exportar uma prévia de agente, métricas ou evidências consultadas, sem executar o conteúdo. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `arquivoLocal.ts` | Devolve o caminho de um arquivo de dados do Prumo na pasta do usuário (LOCALAPPDATA\PrumoQA\plataforma), recusando nomes estranhos. |
| `diretorioDados.ts` | Pasta de dados do Prumo neste computador (LOCALAPPDATA\PrumoQA ou PRUMO_DATA_DIR), sempre absoluta e sem atalhos. |
| `gravarLocal.ts` | Grava um arquivo de dados JSON do Prumo de forma segura: escreve numa cópia temporária e só então substitui o original. |
| `lerLocal.ts` | Lê um arquivo de dados JSON do Prumo e confere o formato; se ainda não existe, devolve o valor inicial. |
| `pastaDeDadosEscolhida.ts` | Pasta de dados escolhida pela variável PRUMO_DATA_DIR (vazia = pasta padrão do usuário). |

## erros/

Erros com código fixo e jeitos seguros de tratar falhas.

| Arquivo | O que faz |
| --- | --- |
| `ErroQa.ts` | Erro do Prumo com um código fixo (ex.: PATH_FORBIDDEN) para a tela e a IA saberem exatamente o que aconteceu. |
| `falharCom.ts` | Interrompe com um código de erro. |
| `tentarOuPadrao.ts` | Executa uma consulta e, se der erro, usa o valor padrão (a conversa não quebra por uma consulta). |

## projeto/

Leitura e validação do contrato qa.project.json de uma pasta.

| Arquivo | O que faz |
| --- | --- |
| `carregarProjeto.ts` | Abre a pasta de um projeto, lê e valida o qa.project.json e devolve o contrato com sua impressão digital. |
| `contextoProjeto.ts` | Resume o projeto para a IA: tecnologias encontradas, scripts, arquivos consultados com hash e o que ficou de fora. |
| `inventariar.ts` | Percorre as pastas de documentação, testes e código declaradas no contrato e lista os arquivos que podem ser lidos, com limites. |
| `normalizarComando.ts` | Transforma um comando escrito como texto no contrato (ex.: "npm run test") no formato estruturado, recusando operadores de shell. |
| `validarComando.ts` | Confere se um comando do contrato é permitido: só "npm run <script>" ou "node <arquivo local>", sem variáveis secretas. |

## seguranca/

Proteções usadas por todas as telas: caminhos seguros, sem atalhos, segredos mascarados.

| Arquivo | O que faz |
| --- | --- |
| `caminhoDentroDe.ts` | Diz se um caminho fica dentro de outra pasta. |
| `caminhoSeguro.ts` | Monta o caminho completo de um arquivo do projeto conferindo, pasta por pasta, que ele fica dentro da raiz e não passa por atalhos (links). |
| `eAtalho.ts` | Diz se um caminho é um atalho (link). |
| `hash.ts` | Calcula a impressão digital SHA-256 de um texto ou arquivo, usada para detectar alterações. |
| `lerSeguro.ts` | Lê um arquivo de texto do projeto com limite de tamanho, recusando arquivos binários e caminhos proibidos. |
| `mascarar.ts` | Esconde segredos num texto (tokens, senhas, chaves privadas, URLs com senha) trocando-os por [REDACTED]. |
| `mascararObjeto.ts` | Mascara segredos em qualquer objeto antes de mostrá-lo. |
| `semLinks.ts` | Recusa caminhos que passam por atalhos (links simbólicos ou junctions) em qualquer pasta do caminho. |
| `sensivel.ts` | Diz se um caminho aponta para algo que nunca deve ser lido: senhas, chaves, .env, .git, node_modules, builds. |
| `validarRelativo.ts` | Recusa caminhos absolutos, com "..", unidades de disco ou caracteres de controle: o caminho tem de ficar dentro da pasta do projeto. |

## texto/

Pequenas funções de texto usadas em várias telas.

| Arquivo | O que faz |
| --- | --- |
| `codificarParaUrl.ts` | Codifica um texto para ir dentro de um endereço (URL). |
| `comoLista.ts` | Trata um valor como lista (ou lista vazia se não for). |
| `comoObjeto.ts` | Trata um valor como objeto (ou objeto vazio se não for). |
| `dataEmPortugues.ts` | Escreve uma data em formato brasileiro, ou "—" quando não há data. |
| `novoIdentificador.ts` | Gera um identificador único novo. |
| `numeroDoId.ts` | Converte um id de texto em número inteiro positivo (ou nada). |
| `parametrosDaUrl.ts` | Monta os parâmetros de consulta de uma URL, ignorando os vazios. |
| `semAcentos.ts` | Deixa o texto em minúsculas e sem acentos para comparar palavras. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `projeto.ts` | Formato do contrato qa.project.json (schema v2), dos comandos permitidos e do projeto carregado. |
