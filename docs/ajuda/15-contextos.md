# Contextos: requisitos e regras do projeto

Eu criei os contextos para o que o time sabe não se perder: requisitos, regras de negócio, critérios de aceite, restrições e decisões que testes e IA devem respeitar.

Em **Agentes**, o botão **Contextos** abre os do projeto selecionado. Ficam só neste computador, na pasta contextos dos dados do Prumo, separados por projeto. O Prumo não mexe no seu código nem no qa.project.json.

## Estados

- **RASCUNHO**: registrado, ainda não validado.
- **APROVADO**: uma pessoa confirmou que aquele texto exato vale. Qualquer edição volta a rascunho.
- **CONFLITANTE**: há contextos incompatíveis. O Prumo não escolhe um lado: esclareça e marque o superado como desatualizado.
- **DESATUALIZADO**: substituído. Não se edita nem aprova; o histórico fica.

O que a IA sugere nasce rascunho. Só uma pessoa aprova, com a confirmação do sistema, que a IA não consegue simular. Em Tickets, **Importar como contexto** traz a descrição de um ticket como rascunho, depois de prévia e confirmação.

## Histórico

Cada mudança fica registrada com quem fez, quando e um hash encadeado. Se o arquivo for alterado fora do Prumo, o contexto vira **ADULTERADO**: não se edita, não se aprova e nunca vai para a IA.

## Enviar à IA (MCP)

Por padrão, nada vai. Se você marcar **Disponibilizar os contextos deste projeto ao agente de IA conectado**, as ferramentas MCP passam a devolver os contextos (até 4000 caracteres cada, com segredos mascarados) e a revisão de cobertura passa a usá-los, avisando quando algo é rascunho, desatualizado, conflitante ou sem origem.

- O provedor da IA pode processar esse texto.
- Contextos de outros projetos nunca vão.
- Texto que parece dar ordem à IA é sinalizado e tratado como dado.

## Excluir

Excluir um contexto (ou todos, em **Ajuda › Privacidade e dados**) pede confirmação e apaga o texto e o histórico; fica só o registro de que ele existiu. Nenhuma ferramenta MCP faz isso.
