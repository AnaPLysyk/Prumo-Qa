# Contextos: requisitos e regras do projeto

A aba **Contextos** guarda, para o projeto selecionado, os requisitos funcionais e não funcionais, regras de negócio, critérios de aceite, restrições técnicas e decisões que a IA e os testes devem respeitar. Tudo fica **somente neste computador**, em %LOCALAPPDATA%\PrumoQA\contextos, separado por projeto. O Prumo não altera o seu código nem o qa.project.json.

## Estados de confiança

- **RASCUNHO**: registrado, ainda não validado. Não é regra confirmada.
- **APROVADO**: uma pessoa confirmou, na origem informada, que o texto exato é uma regra válida. A aprovação vale só para aquele texto: qualquer edição volta o contexto a rascunho.
- **CONFLITANTE**: há contextos incompatíveis (a mesma chave com textos diferentes, ou um conflito marcado por você). O Prumo **não escolhe um lado**: esclareça e marque o superado como desatualizado.
- **DESATUALIZADO**: substituído ou sem validade atual. Não pode mais ser editado nem aprovado; o histórico permanece.

Uma IA pode sugerir requisitos encontrados em documentos, mas isso é **rascunho**: só uma pessoa aprova. A aprovação exige confirmação do Windows que o aplicativo (e portanto a IA) não consegue simular, e o aprovador registrado é o usuário do Windows.

## Histórico verificável

Cada alteração (criação, edição, aprovação, conflito, substituição) é registrada com quem fez, quando e um hash encadeado. Se o arquivo for alterado fora do Prumo, o contexto aparece como **ADULTERADO**, não pode ser aprovado nem editado e **nunca** é enviado ao agente de IA.

## Disponibilizar ao agente de IA (MCP)

Por padrão os contextos **não** são enviados ao agente. Se você marcar "Disponibilizar os contextos deste projeto ao agente de IA conectado", as ferramentas MCP passam a devolver referências (origem, versão, hash, estado e o texto, até 4000 caracteres, com segredos mascarados) e a revisão de cobertura passa a considerar o contexto indicado, avisando quando é rascunho, está desatualizado, tem conflito, não tem origem ou não corresponde ao requisito. Atenção: o que o agente lê pode ser processado pelo provedor da IA conectada. Contextos de outros projetos nunca são enviados. Textos que parecem instruir o agente são sinalizados e tratados apenas como dado.

## Excluir

Excluir um contexto (ou todos, em Ajuda › Privacidade e dados) pede confirmação e apaga o contexto e seu histórico; ficam só o identificador, a data e o hash de que ele existiu. Isso não é feito por nenhuma ferramenta MCP.
