# administracao — backend

Administração: configurações gerais, usuários, permissões, monitoramento e documentação técnica.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `administracaoMapa.ts` | Canal administracao:mapa: Mostrar a documentação viva desta versão: tela, interface, canais, backend e testes. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `lerMapaDoAplicativo.ts` | Lê o mapa da Documentação viva que o build gerou em app/documentacao/mapa.json, com limite de tamanho e formato conferido. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `mapaDoAplicativo.ts` | Formato do mapa da Documentação viva: telas com interface, canais IPC, backend por papel e testes, gerado do código no build. |
