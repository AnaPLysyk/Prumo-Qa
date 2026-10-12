# suporte — backend

Suporte: relato de bug, melhoria ou sugestão revisado localmente e consulta de chamados.

Arquivo gerado por `npm run leia-me`. Não edite à mão.

## api/

Portas da tela: cada arquivo atende um pedido da janela (um canal IPC, com o mesmo nome). Recebe os dados já validados, pede confirmação no Windows quando precisa e chama as regras.

| Arquivo | O que faz |
| --- | --- |
| `suporteAbrir.ts` | Canal suporte:abrir: Abrir o formulário oficial de GitHub Issues já preenchido, depois de revisado e confirmado. |
| `suporteChamado.ts` | Canal suporte:chamado: Abrir a página oficial de um chamado para ler ou responder pelo GitHub. |
| `suporteConsultar.ts` | Canal suporte:consultar: Consultar estado e histórico público de um chamado oficial por ação explícita. |
| `suporteExportar.ts` | Canal suporte:exportar: Salvar o relato em um arquivo local (Markdown), sem usar o GitHub. |
| `suportePreparar.ts` | Canal suporte:preparar: Montar localmente o relato (bug, melhoria ou sugestão) e revisar a privacidade antes de qualquer envio. |

## integracoes/

Conversa com serviços de fora (Jira, Qase, GitHub ou IA), sempre pelos endereços oficiais.

| Arquivo | O que faz |
| --- | --- |
| `buscarDadosDoChamado.ts` | Busca no GitHub os dados públicos de uma issue, com limite de resposta, sem credencial nem redirecionamento. |
| `consultarChamado.ts` | Consulta no GitHub, a pedido, o estado de uma issue oficial do Prumo (rótulos e eventos), sem credencial. |

## regras/

O que a tela decide: validações, cálculos e os passos de cada ação.

| Arquivo | O que faz |
| --- | --- |
| `enderecoOficialDoRelato.ts` | Confere que o endereço é exatamente o formulário oficial de issues do Prumo no GitHub. |
| `linkDeIssueValido.ts` | Confere que um link aponta para uma issue do repositório oficial do Prumo. |
| `montarEnderecoDoRelato.ts` | Monta o endereço do formulário do GitHub Issues já preenchido, encurtando o texto se não couber. |
| `montarTextoDoRelato.ts` | Escreve o texto do relato em Markdown com id LOCAL e, só se marcado, versão, sistema e diagnóstico. |
| `prepararRelato.ts` | Prepara o relato: valida, revisa a privacidade (segredo bloqueia, dado pessoal avisa) e monta texto e endereço. |
| `prepararRelatoDaJanela.ts` | Prepara o relato de suporte com a versão instalada e, se marcado, o diagnóstico. |
| `resumoDoDiagnosticoParaRelato.ts` | Resume os 20 últimos registros do diagnóstico da janela para anexar ao relato, se a pessoa marcar. |
| `revisarPrivacidadeDoRelato.ts` | Procura no relato segredos (bloqueiam) e dados pessoais ou caminhos locais (avisam), sem repetir o segredo. |

## tipos/

Formato dos dados, listas fixas e limites. Não tem funções.

| Arquivo | O que faz |
| --- | --- |
| `suporte.ts` | Categorias, modelos e limites do relato de suporte, o formato da solicitação e o de uma issue consultada no GitHub. |
