# suporte — backend

Suporte: relato de bug, melhoria ou sugestão revisado localmente e consulta de chamados.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `suporteAbrir.ts` | Canal suporte:abrir: Abrir o formulário oficial de GitHub Issues já preenchido, depois de revisado e confirmado. |
| `suporteAnexar.ts` | Canal suporte:anexar: Escolher imagens (até 3) ou um vídeo para o chamado, no diálogo do sistema; a janela recebe só id, nome, tipo e tamanho. |
| `suporteChamado.ts` | Canal suporte:chamado: Abrir a página oficial de um chamado para ler ou responder pelo GitHub. |
| `suporteConsultar.ts` | Canal suporte:consultar: Consultar estado e histórico público de um chamado oficial por ação explícita. |
| `suporteEnviar.ts` | Canal suporte:enviar: Enviar o chamado revisado (e os anexos) pelo serviço do Prumo, sem precisar de conta no GitHub. |
| `suporteExportar.ts` | Canal suporte:exportar: Salvar o relato em um arquivo local (Markdown), sem usar o GitHub. |
| `suporteMeu.ts` | Canal suporte:meu: Ver um chamado da pessoa da sessão com as respostas da equipe. |
| `suporteMeus.ts` | Canal suporte:meus: Listar os chamados que a pessoa da sessão abriu, com o estado atual. |
| `suportePreparar.ts` | Canal suporte:preparar: Montar localmente o relato (bug, melhoria ou sugestão) e revisar a privacidade antes de qualquer envio. |

## banco/

Onde os dados são lidos e gravados neste computador (arquivos JSON e SQLite na pasta de dados do Prumo).

| Arquivo | O que faz |
| --- | --- |
| `meusChamados.ts` | Lê e grava os chamados abertos neste computador (chamados-de-suporte.json): número, título e a chave de acompanhamento protegida pelo cofre do sistema. |

## integracoes/

Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.

| Arquivo | O que faz |
| --- | --- |
| `buscarDadosDoChamado.ts` | Busca no GitHub os dados públicos de uma issue, com limite de resposta, sem credencial nem redirecionamento. |
| `consultarChamado.ts` | Consulta no GitHub, a pedido, o estado de uma issue oficial do Prumo (rótulos e eventos), sem credencial. |
| `servicoDeChamados.ts` | Fala com o serviço do Prumo sobre chamados: abrir, mandar anexo e acompanhar (com a chave do chamado) e, na Administração, ler, responder e mudar o estado (com a chave de administração). |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `anexosDoChamado.ts` | Anexos do chamado (imagem e vídeo): escolhidos no diálogo do sistema, conferidos pela assinatura do arquivo e pelos limites do serviço. |
| `chamadosDaAdministracao.ts` | Administração › Chamados: lê todos os chamados e anexos, responde e muda o estado, com a chave de administração guardada no cofre. |
| `chamadosDaPessoa.ts` | Chamados da pessoa da sessão: enviar pelo serviço do Prumo (sem GitHub) e acompanhar estado e respostas. |
| `enderecoOficialDoRelato.ts` | Confere que o endereço é exatamente o formulário oficial de issues do Prumo no GitHub. |
| `linkDeIssueValido.ts` | Confere que um link aponta para uma issue do repositório oficial do Prumo. |
| `montarEnderecoDoRelato.ts` | Monta o endereço do formulário do GitHub Issues já preenchido, encurtando o texto se não couber. |
| `montarTextoDoRelato.ts` | Escreve o texto do relato em Markdown com id LOCAL e, só se marcado, versão, sistema e diagnóstico. |
| `prepararRelato.ts` | Prepara o relato: valida, revisa a privacidade (segredo bloqueia, dado pessoal avisa) e monta texto e endereço. |
| `prepararRelatoDaJanela.ts` | Prepara o relato de suporte com a versão instalada e, se marcado, o diagnóstico. |
| `resumoDoDiagnosticoParaRelato.ts` | Resume os 20 últimos registros do diagnóstico da janela para anexar ao relato, se a pessoa marcar. |
| `revisarPrivacidadeDoRelato.ts` | Procura no relato segredos (bloqueiam) e dados pessoais ou caminhos locais (avisam), sem repetir o segredo. |

## servidor/

Rotas HTTP desta área que rodam no Render; login e suporte continuam nas suas próprias pastas. Diferente dos canais IPC do Electron.

| Arquivo | O que faz |
| --- | --- |
| `chamados.mjs` | Rotas dos chamados de suporte. Quem abre não precisa de conta no GitHub: o serviço grava cada chamado como issue no |
| `github.mjs` | Cliente do GitHub usado só pelo serviço, só no repositório PRIVADO dos chamados (PRUMO_SUPORTE_REPOSITORIO), com um token |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `chamados.ts` | Chamados enviados pelo serviço do Prumo: tipos de anexo e limites (os mesmos do serviço), estados e o formato do que fica guardado neste computador. |
| `suporte.ts` | Categorias, modelos e limites do relato de suporte, o formato da solicitação e o de uma issue consultada no GitHub. |
