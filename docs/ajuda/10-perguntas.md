# Perguntas frequentes

## O Prumo é uma IA?
Não. Eu fiz o Prumo como um conjunto de verificações determinísticas: ele valida contratos, aplica permissões, executa o que você autorizou e guarda evidências. O raciocínio fica com você ou com a IA que você conectar (Claude Code ou Codex), se quiser.

## O Prumo precisa de internet?
Não para o uso local. Projetos, métricas, logs e ajuda funcionam offline. A internet entra quando você consulta ou publica no Jira, Qase ou GitHub, e na verificação de versão nova (ao abrir, a cada 6 horas e quando você clica).

## O Prumo altera o meu projeto?
Só com a sua confirmação. Ele lê o que o contrato autoriza e grava na pasta apenas o contrato que você aprovou, os arquivos salvos na IDE e as evidências em .prumo. Veja **Ajuda › Como vincular um projeto**.

## Por que a execução pede a minha senha?
Executar um teste pode ter efeitos reais. A autenticação do sistema (Windows, senha ou Touch ID no macOS, polkit no Linux) garante que a decisão é sua, não da IA.

## O que significa NOT_VERIFIED?
A análise foi estrutural; nada foi comprovado por execução. PASS exige execução real.

## As métricas mostram tokens ou custos?
Não. Eu só mostro o que o Prumo mede de verdade: operações, achados, lacunas, estados e durações.

## O Prumo vê as minhas conversas com a IA?
Não. Ele só vê as chamadas que chegam às ferramentas MCP dele.

## Como sei se há uma versão nova?
O sino acende uma vez por versão. Em **Ajuda › Atualizações**, **Atualizar agora** baixa, confere o SHA-256, instala e reabre. Nada é instalado sem você pedir, e seus dados ficam.

## Como apago meus dados?
Em **Ajuda › Privacidade e dados**. Cada exclusão é separada, pede confirmação e nunca toca no código do projeto.

## O instalador é seguro?
Ele não tem assinatura digital. O Prumo confere o SHA-256 antes de atualizar; se baixar à mão, confira você e baixe só do repositório oficial. O SHA-256 prova que o arquivo é o publicado, não quem publicou.
