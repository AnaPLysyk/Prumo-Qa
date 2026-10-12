# tickets — backend

Tickets: tickets do Jira e propostas de caso e de bug em rascunho, publicadas só com confirmação.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `propostasCriar.ts` | Canal propostas:criar: Criar uma proposta de caso de teste ou de bug em rascunho. |
| `propostasDescartar.ts` | Canal propostas:descartar: Descartar uma proposta. |
| `propostasEditar.ts` | Canal propostas:editar: Editar uma proposta; invalida a revisão anterior. |
| `propostasListar.ts` | Canal propostas:listar: Listar propostas de casos e bugs (da pessoa, do Prumo ou de uma IA). |
| `propostasPublicar.ts` | Canal propostas:publicar: Publicar uma proposta (caso no Qase ou bug no Jira). |
| `propostasRevisar.ts` | Canal propostas:revisar: Registrar a revisão (duplicidade, requisito, risco e cobertura) de uma proposta. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `alterarProposta.ts` | Abre uma proposta, aplica uma alteração, confere e grava. |
| `gravarPropostas.ts` | Grava as propostas em propostas.json depois de conferir o formato. |
| `lerPropostas.ts` | Lê as propostas de caso e de bug gravadas em propostas.json. |
| `listarPropostas.ts` | Lista as propostas de um projeto, da mais nova para a mais antiga. |
| `obterProposta.ts` | Busca uma proposta pelo id; se não existe, avisa PROPOSAL_NOT_FOUND. |

## integracoes/

Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.

| Arquivo | O que faz |
| --- | --- |
| `acharComentarioDoPrumo.ts` | Procura um comentário já publicado pelo Prumo (pelo marcador), para não publicar duas vezes. |
| `acharTicketCriadoPeloPrumo.ts` | Procura no Jira um ticket já criado pelo Prumo (pelo rótulo-marcador), para não criar duas vezes. |
| `anexarArquivo.ts` | Operação "Anexar arquivo a ticket do Jira": prévia, envio e conferência pelo nome do anexo. |
| `camposDoTipo.ts` | Consulta no Jira os campos de um tipo de ticket (quais são obrigatórios). |
| `comentariosDoTicket.ts` | Lê os 100 comentários mais recentes de um ticket. |
| `comentarTicket.ts` | Operação "Comentar em ticket do Jira": só texto; não muda status, campos nem anexos. |
| `criarTicket.ts` | Operação "Criar ticket no Jira": prévia, envio e conferência; liga ao ticket de origem se informado. |
| `editarTicket.ts` | Operação "Atualizar campos de ticket do Jira": altera resumo, descrição ou acrescenta rótulos; não remove nada. |
| `enderecoDoTicket.ts` | Monta o endereço do ticket no Jira (…/browse/CHAVE). |
| `jqlDeTickets.ts` | Monta a busca JQL dos tickets do projeto Jira com os filtros da tela (texto, status, tipo, responsável, datas). |
| `lerAnexo.ts` | Lê o arquivo a anexar só se for evidência do projeto ou escolhido pela pessoa; textos têm segredos mascarados. |
| `marcadorNoComentario.ts` | Escreve o marcador [prumo-…] colocado no comentário para reconhecê-lo depois. |
| `operacoesJira.ts` | Lista das operações de escrita no Jira que o Prumo conhece. |
| `projetoDoTicket.ts` | Confere que o ticket pertence ao projeto Jira vinculado antes de qualquer escrita. |
| `textoParaAdf.ts` | Converte texto simples no formato de documento do Jira (ADF), só com parágrafos, sem HTML. |
| `tiposDeCriacao.ts` | Consulta no Jira os tipos de ticket que podem ser criados no projeto vinculado. |
| `transicionarTicket.ts` | Operação "Mudar o status de ticket do Jira" por uma transição disponível. |
| `transicoesDoTicket.ts` | Consulta as mudanças de status disponíveis para um ticket do projeto vinculado. |
| `vincularTickets.ts` | Operação "Vincular tickets do Jira" (ex.: defeito ↔ história). |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `criarProposta.ts` | Cria uma proposta em rascunho, apontando semelhantes e limitando quantas a IA pode criar por hora. |
| `descartarProposta.ts` | Descarta uma proposta ainda não publicada. |
| `editarProposta.ts` | Edita uma proposta aberta; a revisão anterior deixa de valer. |
| `marcarPublicada.ts` | Marca a proposta como publicada e guarda o endereço do item criado no Jira ou Qase. |
| `palavrasDoTexto.ts` | Separa as palavras importantes (mais de 2 letras) de um texto. |
| `podePublicar.ts` | Confere se a proposta pode ser publicada: não pode estar fechada e, se veio da IA, precisa ter sido revisada. |
| `publicarProposta.ts` | Publica uma proposta: cria o caso no Qase ou o bug no Jira (com vínculo ao ticket de origem) e marca como publicada. |
| `resolverAnexo.ts` | Decide qual arquivo pode ser anexado: uma evidência do projeto ou o arquivo escolhido pela pessoa na janela do Windows. |
| `revisarProposta.ts` | Registra a revisão da pessoa (duplicidade, requisito, risco e cobertura) e quem revisou. |
| `semelhancaEntrePalavras.ts` | Mede de 0 a 1 o quanto dois conjuntos de palavras se parecem, para achar propostas repetidas. |
| `textoComparavel.ts` | Simplifica um texto (minúsculas, sem acentos e sem pontuação) para comparar propostas. |
| `validarDadosDaProposta.ts` | Confere os dados de uma proposta: caso de teste no formato do Qase ou bug no formato do Jira. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `escritaJira.ts` | Formatos aceitos nas operações de escrita no Jira (criar, anexar, editar, transicionar, vincular, comentar). |
| `proposta.ts` | Formato das propostas de caso e de bug, da revisão e os limites (300 propostas, 20 da IA por hora). |
