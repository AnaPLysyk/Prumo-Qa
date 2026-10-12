# contextos — backend

Contextos: requisitos, regras, critérios e decisões do projeto, com aprovação humana e histórico verificável.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `contextosAprovar.ts` | Canal contextos:aprovar: Aprovar explicitamente o conteúdo atual de um contexto. |
| `contextosConflito.ts` | Canal contextos:conflito: Marcar ou resolver explicitamente um conflito entre contextos. |
| `contextosDesatualizar.ts` | Canal contextos:desatualizar: Marcar um contexto como desatualizado (sem validade atual). |
| `contextosExcluir.ts` | Canal contextos:excluir: Excluir definitivamente um contexto. |
| `contextosListar.ts` | Canal contextos:listar: Listar e pesquisar os contextos do projeto (requisitos, regras, critérios, restrições, decisões). |
| `contextosMcp.ts` | Canal contextos:mcp: Escolher se os contextos do projeto são disponibilizados ao agente de IA conectado por MCP. |
| `contextosObter.ts` | Canal contextos:obter: Ver um contexto com seu histórico completo de alterações. |
| `contextosSalvar.ts` | Canal contextos:salvar: Criar um contexto, editá-lo (nova versão em rascunho) ou substituí-lo por uma versão posterior. |
| `servicosImportar.ts` | Canal servicos:importar: Importa a descrição de um ticket do Jira como contexto em rascunho, depois da confirmação. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `carregarContexto.ts` | Abre um contexto deste projeto pelo id, recusando contextos de outro projeto. |
| `carregarTodosOsContextos.ts` | Lê todos os contextos do projeto e anota os arquivos com problema. |
| `excluirContexto.ts` | Apaga um contexto e anota em excluidos.jsonl só o id, a data e o hash. |
| `excluirTodosContextos.ts` | Apaga todos os contextos do projeto (Ajuda › Privacidade e dados), informando falhas. |
| `gravarArquivoDeContexto.ts` | Grava um arquivo de contexto com segurança: cópia temporária e troca no final. |
| `gravarPermissaoDeContextosNoMcp.ts` | Grava se a pessoa permitiu enviar os contextos à IA. |
| `lerArquivoDeContexto.ts` | Lê o arquivo de um contexto e confere se o histórico está íntegro (nenhuma versão alterada fora do Prumo). |
| `lerPermissaoDeContextosNoMcp.ts` | Lê se a pessoa permitiu enviar os contextos à IA (padrão: não). |
| `mudarContexto.ts` | Aplica uma mudança a um contexto e grava a nova versão, recusando históricos adulterados ou cheios. |
| `pastaContextos.ts` | Devolve a pasta onde ficam os contextos deste projeto (fora da pasta do projeto, na pasta de dados do usuário). |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `aprovarContexto.ts` | Aprova um contexto: exige origem informada e grava quem aprovou. |
| `aprovarContextoDaPasta.ts` | Aprova um contexto em nome da pessoa (depois da confirmação nativa). |
| `conflitoDeContextoDaPasta.ts` | Marca um conflito entre dois contextos ou resolve o conflito marcado. |
| `contextoParaRevisao.ts` | Busca um contexto para a revisão de cobertura da IA, respeitando a permissão da pessoa. |
| `contextosParaMcp.ts` | Prepara os contextos que podem ir para a IA (se permitido), com texto limitado, segredos mascarados e aviso de que são dados, não ordens. |
| `criarContexto.ts` | Cria um contexto novo em rascunho. |
| `desatualizarContexto.ts` | Marca um contexto como desatualizado. |
| `desatualizarContextoDaPasta.ts` | Marca um contexto como desatualizado (deixa de valer). |
| `editarContexto.ts` | Edita um contexto criando uma nova versão em rascunho (a aprovação anterior deixa de valer). |
| `excluirContextoDaPasta.ts` | Exclui um contexto de vez (fica só o registro de que existiu). |
| `hashDoConteudoDoContexto.ts` | Calcula a impressão digital do conteúdo de um contexto (tipo, título, texto, chave e origem). |
| `idDeContextoValido.ts` | Diz se o identificador de um contexto é um UUID válido. |
| `listarContextos.ts` | Lista os contextos do projeto com busca e filtro por tipo e estado. |
| `listarContextosDaPasta.ts` | Lista os contextos de uma pasta vinculada para a tela Contextos. |
| `marcarConflito.ts` | Marca que um contexto conflita com outro. |
| `novaVersaoDoContexto.ts` | Cria a próxima versão do histórico de um contexto (quem, quando, ação, estado e selo). |
| `obterContexto.ts` | Abre um contexto com todas as versões do histórico. |
| `obterContextoDaPasta.ts` | Abre um contexto com o histórico completo para a tela Contextos. |
| `permitirContextosNoMcp.ts` | Liga ou desliga o envio dos contextos do projeto para a IA conectada por MCP. |
| `resolverConflito.ts` | Resolve o conflito marcado, voltando o contexto para rascunho. |
| `resumirContextos.ts` | Monta o resumo de cada contexto para a lista, apontando conflitos (mesma chave ou marcados pela pessoa) e alterações suspeitas. |
| `salvarContextoDaPasta.ts` | Salva um contexto: cria, edita (nova versão em rascunho) ou substitui por outro. |
| `seloDaVersaoDoContexto.ts` | Calcula o selo de uma versão do contexto, encadeado com a versão anterior, para detectar edições fora do Prumo. |
| `substituirContexto.ts` | Cria um contexto novo que substitui o antigo, e marca o antigo como desatualizado. |
| `suspeitaDeInstrucao.ts` | Avisa quando o texto de um contexto parece uma ordem para a IA (ex.: "ignore as instruções"), para não ser tratado como regra. |
| `ultimaVersaoDoContexto.ts` | Devolve a versão mais recente de um contexto. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `contexto.ts` | Formato de um contexto (requisito, regra, critério, restrição, decisão), seus estados, limites e histórico encadeado. |
