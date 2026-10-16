# Plataforma manual, Jira, Qase e GitHub

Eu quis que o projeto existisse no Prumo antes de qualquer integração. Você escolhe depois o que ligar.

## Criar o projeto

Em **Projetos**:

- **Criar projeto manual**: nome e descrição bastam. Pasta, serviços e IA são opcionais.
- **Importar projetos do Qase**: pelo token, você escolhe os projetos da conta e eles já nascem vinculados.

Depois, no projeto, **Vincular repositório local…** liga uma pasta de código e **Escolher repositório do GitHub…** liga um repositório. Dá para ficar só no local.

## Conectar um serviço

Em **Conexões**, cada serviço tem uma linha com **Conectar**. O formulário diz o que o token precisa:

- **Jira**: endereço Cloud (*.atlassian.net), e-mail e token de API sem escopos.
- **Qase**: token da API v1.
- **GitHub**: token fine-grained com Issues Read and write; Contents, Pull requests e Actions Read-only; Metadata, que o GitHub marca sozinho.

O token fica no cofre do sistema; sem cofre, o Prumo não salva.

Para ligar um projeto que já existe, use **Listar recursos disponíveis** na conta, confira chave, ID e conta e clique **Vincular**. A lista vem da API, nunca por nome parecido. Para trocar o recurso, remova o vínculo em Projetos e vincule de novo; para trocar o token, remova a conexão e conecte outra.

## Consultar

- **Tickets**: tickets do Jira, defeitos do Qase, issues do GitHub e rascunhos locais na mesma lista.
- **Testes**: suites, casos, planos e runs do Qase, testes do repositório e pipelines.

Cada resposta mostra fonte e data. Erro aparece como erro, nunca como lista vazia. Para critérios de aceite do Jira, **Descobrir campos** e escolha o campo; nada é deduzido. Resultado de run externa não vira evidência local.

Em **Testes › Repositório**, você declara um vínculo entre ticket e caso com justificativa. O Prumo confere os dois no serviço antes de registrar, mas um vínculo declarado não comprova cobertura.

## Escrever nos serviços

A escrita nasce desligada. Você liga por projeto e serviço, em **Habilitar escrita…**:

- **Jira**: criar, comentar, editar, anexar, mudar status e vincular tickets.
- **Qase**: criar casos, suites, planos, runs e defeitos, publicar resultados e mudar o status de um defeito.
- **GitHub**: criar issues, branches prumo/…, gravar arquivos de teste e abrir Pull Request em rascunho.

Cada envio mostra a prévia, pede a confirmação do sistema, evita duplicata e relê no serviço para confirmar. O Prumo não apaga nada.

## Limites

- Jira com token com escopos ou OAuth não está implementado.
- A API v1 do Qase não informa a identidade da conta; o projeto é identificado pelo código dentro da conexão.
- No plano gratuito do Qase, o vínculo caso–ticket do Jira não é liberado, e na conta que testei os campos personalizados de defeito não foram gravados.
- Sem Issues Read and write, o GitHub cria a issue mas descarta os rótulos; o Prumo avisa.
- Status antigos de commit do GitHub não aparecem, só check runs.
