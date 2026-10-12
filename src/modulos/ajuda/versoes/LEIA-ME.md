# Ajuda → Histórico de versões

- `definirFormatoVersao.ts`: define os dados que uma versão pode conter.
- `analisarNumeroVersao.ts`: separa o número maior, menor e correção.
- `compararNumerosVersao.ts`: identifica qual versão é mais recente.
- `montarLinkRelease.ts`: monta o link da versão publicada no GitHub.
- `carregarHistoricoVersoes.ts`: lê o arquivo com o histórico.
- `validarHistoricoVersoes.ts`: verifica ordem, datas e links.
- `conferirVersaoInstalada.ts`: verifica se a versão do aplicativo está registrada.
- `mostrarHistoricoVersoes.ts`: marca a versão instalada para exibição.
- `gerarNotasDeRelease.ts`: gera o texto das novidades da versão.

O arquivo `src/versoes.ts` continua como entrada de compatibilidade enquanto o restante da aplicação é reorganizado. A fonte do histórico permanece em `app/versoes.json`.
