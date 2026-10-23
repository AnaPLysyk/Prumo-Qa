# Sobre

Prumo QA, versão {{VERSAO}}, criado por Ana P. Lysyk (AnaPLysyk).

O código-fonte está no repositório [AnaPLysyk/Prumo-Qa](https://github.com/AnaPLysyk/Prumo-Qa) no GitHub. Para pedir ajuda, use a tela **Suporte** (não precisa de conta no GitHub) ou abra uma issue pública. A documentação oficial fica na **Ajuda**, na **Documentação Viva** (Administração) e no **site público**.

## Administração › Documentação viva

Contas com a marca admin veem em **Administração › Documentação viva** o código desta versão, gerado na compilação:

- à esquerda, a lista de arquivos;
- no meio, o caminho que o aplicativo percorre para atender à tela;
- à direita, o código, as funções e os canais de cada arquivo.

Você pode procurar por tela, arquivo, função ou canal. As colunas de arquivos e de código **recolhem** pela seta no topo (viram uma faixa que reabre com um clique). As divisórias entre as colunas se **arrastam** para ajustar a largura; duplo clique volta ao padrão. O painel de código tem **ampliar** e **fechar**. As medidas ficam guardadas neste computador.

Para fazer manutenção, selecione primeiro a tela. A interface fica em `frontend/<tela>/`; as regras ficam em `backend/<tela>/` (`api/`, `regras/`, `banco/`, `integracoes/`, `tipos/` e, quando necessário, `servidor/`). A consulta não executa o código nem envia dados para fora do computador.

Os arquivos em `dist/renderer/` são gerados na compilação: edite sempre a fonte da tela, não o resultado. Bibliotecas de terceiros ficam em `vendor/`.
