# Contextos: requisitos e regras do projeto

Use os contextos para guardar informações importantes do projeto: requisitos, regras de negócio, critérios de aceite, restrições e decisões que os testes e a IA devem seguir.

Em **Agentes**, clique em **Contextos** para ver os dados do projeto selecionado. Eles ficam neste computador, separados por projeto, na pasta de dados do Prumo. O Prumo não altera o código nem o arquivo `qa.project.json`.

## Estados

- **RASCUNHO**: salvo, mas ainda não revisado e aprovado.
- **APROVADO**: uma pessoa confirmou que aquele texto está correto. Se o texto mudar, volta a ser rascunho.
- **CONFLITANTE**: dois ou mais contextos não concordam. O Prumo não escolhe qual está certo; esclareça a diferença e marque o contexto antigo como desatualizado.
- **DESATUALIZADO**: substituído por outra informação. Não pode ser editado ou aprovado, mas continua no histórico.

As sugestões da IA começam como rascunho. Só uma pessoa pode aprová-las, depois de confirmar no sistema. A IA não pode simular essa confirmação. Em **Tickets**, **Importar como contexto** copia a descrição de um ticket como rascunho, após mostrar uma prévia e pedir sua confirmação.

## Histórico

O Prumo registra quem fez cada mudança e quando, junto com um código que liga os registros. Se o arquivo for alterado fora do Prumo, o contexto fica **ADULTERADO**: não pode ser editado nem aprovado e não é enviado à IA.

## Enviar à IA (MCP)

Por padrão, os contextos não são enviados à IA. Se você marcar **Disponibilizar os contextos deste projeto ao agente de IA conectado**, as ferramentas MCP podem incluí-los (até 4.000 caracteres cada, com segredos ocultos). A revisão de cobertura também passa a usá-los e avisa quando um contexto é rascunho, antigo, conflitante ou sem origem.

- O serviço de IA conectado pode processar esse texto.
- Contextos de outros projetos nunca vão.
- Se um texto parecer dar ordens à IA, ele será sinalizado e tratado apenas como conteúdo.

## Excluir

Para excluir um contexto ou todos eles, use **Ajuda › Privacidade e dados** e confirme a ação. O texto e o histórico serão apagados; ficará apenas um registro de que o contexto existiu. Nenhuma ferramenta MCP pode excluir contextos.
