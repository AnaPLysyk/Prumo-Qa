# Homologação — duas experiências essenciais do Prumo QA

**Data da preparação:** 15/10/2026  
**Situação:** roteiro pronto; **não executado no Electron com serviços reais**. Não é evidência de aprovação.
**Ambiente de referência:** Jira `KAN` (Qa), Qase `PQ` (PRUMO QA). Os serviços devem ser previamente autorizados e conectados ao mesmo projeto do Prumo.

## Regras de fonte oficial
- Jira vinculado: tickets, comentários, estado e histórico têm como origem o Jira. Não criar segundo ticket local concorrente; mostrar falhas e confirmar a operação com leitura posterior.
- Qase vinculado: casos, suítes e runs são consultados e gravados no projeto Qase vinculado. Rascunhos de agentes ficam separados, não equivalem a casos oficiais.
- Sem serviço vinculado: o respectivo módulo usa sua fonte local. Dados locais históricos não são apagados ou transformados silenciosamente em dados remotos.
- Mesmo projeto: vínculos são registrados por IDs reais (Jira KAN-XX, Qase PQ-NN ou UUID local), nunca inferidos por título semelhante.
- Escrita externa requer permissão da conexão, prévia e confirmação nativa; cancelar não pode provocar POST/PUT.

## Preparação e isolamento
1. Abrir uma **instalação de desenvolvimento/teste com perfil independente** do aplicativo instalado. Confirmar que dados, login, banco interno do Electron, credenciais e pasta de trabalho não apontam para o perfil de produção.
2. No Prumo QA, criar ou selecionar um projeto **de homologação**, com vínculo Jira KAN e Qase PQ. Conferir que as duas conexões estão ativas, com permissão de leitura. Só habilitar escrita para o teste autorizado.
3. Usar credenciais guardadas no cofre do aplicativo ou ambiente autorizado. **Não copiar tokens para logs, tickets ou casos**. Como tokens foram expostos numa conversa, substituí-los antes de homologação real.
4. Identificar um ticket e uma suíte/caso exclusivos da homologação, com prefixo `[PRUMO-TESTE]`. Capturar horário, projeto, identificador, executor e evidência por operação. O ticket KAN-2, anteriormente criado pelo conector Atlassian do chat, **não comprova operação pelo Prumo**.

## Jornada A — Jira (fonte de tickets)
| Etapa | Ação no Prumo | Evidência necessária |
| --- | --- | --- |
| A1 | Selecionar projeto vinculado a KAN | Projeto, instância Jira e vínculo exibidos; sem criação local concorrente |
| A2 | Consultar lista, abrir ticket e consultar detalhes | Mesmo ID e estado conferidos no Jira |
| A3 | Criar ticket de teste no Prumo, com escrita previamente autorizada | Prévia/consentimento, ID retornado e GET posterior do mesmo ticket no Jira |
| A4 | Editar título/descrição e acrescentar comentário | Confirmar cada campo no Jira, inclusive após atualizar tela |
| A5 | Testar transição de estado disponível, quando autorizada | Status remoto efetivo e histórico; não considerar apenas HTTP 2xx |
| A6 | Cancelar uma operação antes do envio | Ausência de escrita no Jira |
| A7 | Desconectar Jira e verificar fallback local | Criação local possível somente no modo sem Jira; ticket remoto histórico não é convertido em cópia local |

**Critério:** aprovação somente com execução pelo Prumo e verificação remota posterior. Se a API não oferecer determinada transição ou a conta não tiver permissão, registrar bloqueio, nunca PASS.

## Jornada B — Qase (fonte de testes)
| Etapa | Ação no Prumo | Evidência necessária |
| --- | --- | --- |
| B1 | Selecionar projeto PQ vinculado ao mesmo projeto Prumo | Nome e código Qase coerentes; repositório local não compete com fonte remota |
| B2 | Consultar suítes e casos, paginar quando necessário | IDs e totais de **casos carregados** conferidos no Qase |
| B3 | Criar uma suíte de teste, após prévia e consentimento | Novo ID de suíte confirmado por leitura no Qase |
| B4 | Criar caso com título, descrição, pré-condição e passos (ação, dados, resultado) | Caso e campos conferidos no Qase por GET após a criação |
| B5 | Editar caso pelo Prumo e recarregar | Campos efetivamente persistidos no Qase, sem “CONFIRMADA” falsa |
| B6 | Relacionar caso Qase a ticket KAN da mesma homologação | Associação confirmada no Qase quando suportada; mapa de rastreabilidade no Prumo contém IDs corretos |
| B7 | Testar recusa/cancelamento da confirmação de escrita | Nenhuma nova suíte ou caso remoto |
| B8 | Desconectar Qase e verificar modo local independente | Criar suíte/caso local no arquivo próprio do Prumo, sem POST para Qase; vínculos históricos permanecem auditáveis |

**Critério:** aprovação somente com execução pelo Prumo e leitura posterior da API Qase. Uma proposta salva localmente **não** comprova B3–B5.

## Rastreabilidade cruzada
Após A3 e B4, relacionar o **ticket Jira real** e o **caso Qase real** pelo Prumo. Verificar ambos os identificadores, a origem do vínculo e o mapa. Teste executado, cobertura aprovada e associação declarada são conceitos diferentes. Não classificar nenhum cenário como PASS sem resultado/evidência da execução.

## Encerramento
- Reverter a escrita permitida em Conexões ao estado desligado.
- Arquivar/excluir os registros de homologação remotos **somente com confirmação explícita**, e registrar os IDs e destinos afetados.
- Guardar relatório PASS/FAIL/BLOCKED/NOT_RUN por etapa com evidências, não apenas resumo agregado.
- **Bloqueio atual:** o repositório `AGENTS.md` proíbe qualquer teste tocar banco ou projeto externo. Os testes automatizados executados nesta rodada usam módulos em memória e JSON temporário; a jornada real requer ambiente de homologação isolado e autorização compatível com essa política.
