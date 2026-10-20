# Sobre

Prumo QA, versão {{VERSAO}}, criado por Ana P. Lysyk (AnaPLysyk).

O código-fonte está no repositório [AnaPLysyk/Prumo-Qa](https://github.com/AnaPLysyk/Prumo-Qa) no GitHub. Para pedir ajuda, use a tela **Suporte** (não precisa de conta no GitHub) ou, se preferir, abra uma issue pública. A documentação oficial fica na **Ajuda do Prumo**, na **Documentação Viva** (Administração) e no **site público**. Os arquivos `README` e `LEIA-ME` por pasta não são mais mantidos.

## Administração › Documentação viva

Para contas com a marca admin, **Administração › Documentação viva** mostra informações sobre o código desta versão, geradas durante a compilação:

- à esquerda, a lista de arquivos;
- no meio, o caminho que o aplicativo percorre para atender à tela;
- à direita, o código, as funções e os canais usados por cada arquivo.

Você pode procurar por tela, arquivo, função ou canal. Para realizar manutenção, selecione primeiro a tela: o que aparece fica em `frontend/<tela>/`; o que executa as regras fica em `backend/<tela>/` (`api/`, `regras/`, `banco/`, `integracoes/`, `tipos/` e, quando necessário, `servidor/`). A Documentação Viva mostra o arquivo, sua responsabilidade e o código. Essa consulta não executa o código nem envia dados para fora do computador.

**Importante:** arquivos em `dist/renderer/` são compilados. Alguns ainda possuem nomes históricos `v36`/`v40`, mas são montados automaticamente a partir dos fragmentos em `frontend/`; edite sempre a fonte da tela, não o bundle. Bibliotecas de terceiros ficam em `vendor/` e não devem ser confundidas com código próprio.
