# Perguntas frequentes

## O Prumo é uma IA?
Não. O Prumo confere as regras do projeto, aplica permissões, executa o que você autorizou e guarda evidências. Você pode conectá-lo ao Claude Code ou ao Codex para pedir ajuda, mas isso é opcional.

## O Prumo precisa de internet?
Não para trabalhar com dados locais: projetos, métricas, logs e ajuda funcionam sem internet. É necessária conexão para consultar ou publicar no Jira, Qase ou GitHub e para verificar atualizações (ao abrir, a cada 6 horas e quando você pede a verificação).

## O Prumo altera o meu projeto?
Só depois da sua confirmação. Ele lê os arquivos permitidos pelo contrato. Na pasta do projeto, grava apenas o contrato aprovado, os arquivos salvos na IDE e as evidências em `.prumo`. Veja **Ajuda › Como vincular um projeto**.

## Por que a execução pede a minha senha?
Um teste pode alterar dados ou usar recursos do computador. Por isso, o sistema pede sua autenticação: no Windows, macOS ou Linux (polkit). Assim, a IA não pode aprovar por você.

## O que significa `NOT_VERIFIED`?
O Prumo analisou os arquivos, mas não executou nada para confirmar o resultado. Para obter `PASS`, é preciso executar os testes.

## As métricas mostram tokens ou custos?
Não. O Prumo mostra apenas dados que consegue medir, como operações, achados, lacunas, resultados e duração.

## O Prumo vê as minhas conversas com a IA?
Não. Ele só vê as chamadas que chegam às ferramentas MCP dele.

## Como sei se há uma versão nova?
O sino avisa quando há uma versão nova. Em **Ajuda › Atualizações**, clique em **Atualizar agora** para baixar e instalar. O Prumo confere o SHA-256 e reabre ao terminar. A atualização só começa quando você pedir; seus dados ficam no computador.

## Como apago meus dados?
Em **Ajuda › Privacidade e dados**. Cada exclusão é separada, pede confirmação e nunca toca no código do projeto.

## Como confiro o instalador?
O instalador ainda não tem assinatura digital. Compare o SHA-256 do arquivo com o valor na release oficial. Se forem iguais, o arquivo corresponde ao publicado; isso não confirma quem o criou. Baixe-o apenas do site ou repositório oficial.
