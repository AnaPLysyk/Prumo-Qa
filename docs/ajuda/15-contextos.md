# Contextos: requisitos e regras do projeto

Contextos guardam o que os testes e a IA devem seguir: requisitos, regras de negócio, critérios de aceite, restrições e decisões do projeto.

Em **Agentes**, clique em **Contextos** para ver os do projeto selecionado. Eles ficam neste computador, na pasta de dados do Prumo, separados por projeto. O Prumo não altera o código nem o `qa.project.json`.

## Estados

- **RASCUNHO**: salvo, mas ainda não revisado nem aprovado.
- **APROVADO**: uma pessoa confirmou que o texto está correto. Se o texto mudar, volta a ser rascunho.
- **CONFLITANTE**: dois ou mais contextos não concordam. O Prumo não escolhe qual está certo; esclareça a diferença e marque o antigo como desatualizado.
- **DESATUALIZADO**: substituído por outra informação. Não pode ser editado nem aprovado, mas continua no histórico.

As sugestões da IA começam como rascunho. Só uma pessoa pode aprová-las, confirmando no sistema; a IA não consegue simular essa confirmação. Em **Tickets**, **Importar como contexto** copia a descrição de um ticket como rascunho, depois de mostrar uma prévia e pedir sua confirmação.

## Histórico

O Prumo registra quem mudou cada contexto e quando, com um código que liga os registros. Se o arquivo for alterado fora do Prumo, o contexto fica **ADULTERADO**: não pode ser editado nem aprovado e não é enviado à IA.

## Enviar à IA (MCP)

Por padrão, os contextos não vão para a IA. Se você marcar **Disponibilizar os contextos deste projeto ao agente de IA conectado**, as ferramentas MCP podem incluí-los (até 4.000 caracteres cada, com segredos ocultos). A revisão de cobertura também passa a usá-los e avisa quando um contexto é rascunho, antigo, conflitante ou sem origem.

- O serviço de IA conectado pode processar esse texto.
- Contextos de outros projetos nunca vão.
- Um texto que pareça dar ordens à IA é sinalizado e tratado só como conteúdo.

## Excluir

Para excluir um contexto ou todos, use **Ajuda › Privacidade e dados** e confirme. O texto e o histórico são apagados; fica só o registro de que o contexto existiu. Nenhuma ferramenta MCP exclui contextos.
