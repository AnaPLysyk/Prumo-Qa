# Suporte — o que faz cada arquivo

**Passo 1:** `definirSolicitacao.ts` estabelece os campos aceitos, como título, descrição, categoria e consentimento.

**Passo 2:** `revisarPrivacidadeRelato.ts` bloqueia segredos e avisa sobre possíveis dados pessoais.

**Passo 3:** `montarTextoRelato.ts` prepara a descrição em Markdown para revisão.

**Passo 4:** `gerarLinkGithubRelato.ts` monta o endereço do formulário público do GitHub e confere sua origem.

**Passo 5:** `prepararRelato.ts` reúne as verificações e devolve a prévia, sem publicar nada automaticamente.

**Entrada existente:** `src/suporte.ts` encaminha essas ações ao módulo correto. **Tela:** `app/renderer/telas/suporte/mostrarSuporte.js`.

## Acompanhar um chamado já enviado

`definirFormatoChamado.ts` valida o número e os estados publicados no GitHub.

`buscarDadosDoChamado.ts` consulta a API pública com limite de tamanho e sem tokens.

`consultarChamadoGithub.ts` organiza o estado atual e os últimos eventos do chamado.

A tela `mostrarSuporte.js` chama a ponte `src/chamados.ts`, que encaminha para essas funções.
