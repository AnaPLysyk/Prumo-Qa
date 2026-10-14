# Plataforma manual, Jira, Qase e GitHub

Em Projetos, escolha Novo projeto Prumo. Nome e descrição bastam: pasta local e IA são opcionais. O projeto recebe identidade própria e contextos separados. Pastas antigas continuam disponíveis; Vincular pasta de automação exige contrato v2 existente e mantém os arquivos como estão.

## Conectar um serviço

Em Conexões, configure Jira, Qase ou GitHub com sua própria credencial de leitura. Uma conexão do ChatGPT não autentica o desktop. Jira exige instância Cloud, e-mail e token de API sem escopos; Qase exige token v1; GitHub exige token de leitura dos recursos necessários. O Windows protege a credencial; sem proteção, o Prumo recusa salvar.

Selecione um projeto Prumo. Use Listar recursos disponíveis na conexão, confira chave, ID, instância e conta e clique Vincular. A seleção vem da API, com paginação. O diálogo nativo confirma o destino. Não há associação por nomes iguais. Para trocar o recurso, remova o vínculo anterior em Projetos e selecione novamente. Para trocar o token, remova a conexão, configure outra e selecione novamente; o histórico continua identificado.

## Consultas manuais

Tickets consulta Jira; Testes mostra suites, casos e planos Qase; Testes › Runs mostra execuções, runs preparadas e runs do Qase; Automações apresenta o contrato local opcional e consultas GitHub. Escolha a operação e clique Consultar API. IDs exigidos devem vir dos dados consultados. Cada resposta mostra fonte e data, sem cache persistido. Erro é exibido como erro, nunca como lista vazia bem-sucedida.

Para critérios de aceite Jira, escolha Descobrir campos e selecione um customfield retornado. Não há campo deduzido automaticamente. Detalhes mostram estados, passos e relações tal como o serviço retornou. Sem relação disponível, aparece Vínculo ainda não definido. Resultado de run externo não é evidência local ou cobertura verificada. Dados extras ficam no detalhe expansível.

Em Testes › Repositório (vínculos declarados), informe ticket, ID do caso e justificativa. O Prumo consulta os dois no projeto selecionado antes de registrar sua associação como DECLARADO PELO USUÁRIO. Isso não comprova cobertura. Remover um vínculo conserva a relação anterior como desatualizada; não transfere para o recurso novo.

Importar descrição de ticket exige prévia e confirmação nativa. O contexto entra como RASCUNHO. Aprovação e disponibilização ao MCP continuam decisões separadas. Agentes mantém configuração e teste das ferramentas MCP existentes; a IA não é necessária para usar estas telas.

## Limites da versão

Jira com token com escopos/OAuth gateway não está implementado. Qase v1 não informa identidade da conta: o projeto é identificado por código dentro da conexão validada. No laboratório, CID-QA é título e CQA é código. GitHub mostra check runs; status legados de commit não estão incluídos. Autenticação de produção depende de credenciais configuradas pela pessoa e não é comprovada pelas simulações.

As três integrações são de leitura. Desde a 2.8 existe uma única escrita: o comentário de resultado de QA em um ticket Jira (veja Agendamentos, bandeja e execuções), com prévia e confirmação ou política aprovada, sem mudar o status. Não há publicação de casos Qase, edição de tickets, mudança de status, clone privado ou transferência automática de resposta para a IA. Consulte [os contratos e endpoints](../../docs/SERVICOS.md) para os detalhes técnicos.
