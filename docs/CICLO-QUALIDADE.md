# Ciclo de qualidade e agentes

O projeto Prumo tem identidade própria e pode vincular uma pasta local, um repositório GitHub e uma conexão Qase. Nomes parecidos não fazem associações: cada vínculo pertence ao projeto selecionado. O perfil local permite informar nome e papel (QA, desenvolvimento, produto ou análise); não é uma autenticação de conta remota. Os dados ficam no perfil do Windows desta instalação.

## Fluxo de trabalho

1. Vincule o projeto e registre requisitos, riscos e critérios com a origem. Uma proposta de IA continua sendo rascunho.
2. Em Testes, consulte casos manuais/Qase e a automação encontrada no repositório. O catálogo apresenta features, cenários, arquivo, linha e classificação com motivo/confiança.
3. Associe o caso ao cenário por anotação Qase explícita no próprio cenário, ou relação declarada com o identificador `arquivo:linha`. Prefixos Qase pertencem ao projeto conectado; nomes semelhantes não provam vínculo.
4. Prepare uma run. Registre resultados manuais com evidência ou execute uma capability autorizada. O resultado de uma rodada inteira não é automaticamente o resultado de cada caso.
5. Consulte Execuções, Evidências e Rastreabilidade. PASS, FAIL, BLOCKED e NOT_RUN conservam seu significado. Os links estáticos não comprovam execução nem cobertura.
6. Revise as propostas e, com a escrita habilitada e a confirmação do produto, publique no Qase. A operação precisa reler o serviço para confirmar; falhas permanecem visíveis.
7. Agende rotinas existentes com escopo, validade e limites. Sem autorização a execução é bloqueada. Computador desligado ou suspenso não executa trabalho.

## Ciclo do assistente

Início e chat flutuante usam o mesmo orquestrador e as mesmas especializações da tela Agentes. A sessão preserva até seis turnos e é separada por projeto. O roteamento considera palavras inteiras, menção explícita e seguimento; a pessoa pode escolher o agente e corrigir o roteamento.

O modo local é determinístico: consulta dados, apresenta fontes e próximos passos. Claude/Codex são provedores opcionais que exigem autorização do produto e identificação explícita da origem. O chat não transforma uma resposta em teste executado.

Perfil, conhecimentos e metadados de atendimento ficam no arquivo local `conhecimento.db`. O chat novo não persiste perguntas nem respostas completas. Conversas antigas permanecem consultáveis pela compatibilidade existente. Aprendizados de conversa ou IA nascem RASCUNHO: a pessoa aprova ou descarta no chat ou no Cérebro do agente. A avaliação útil/não ajudou registra feedback; a correção explícita de agente ensina vocabulário, sem validar automaticamente uma regra de negócio.

As Skills dos agentes ficam em outro arquivo local, `skills.db`, dividido em trechos. A IA externa recebe só os trechos aprovados que combinam com a pergunta (até 8 KB), e não o arquivo inteiro. A equipe pode acrescentar trechos (já aprovados) e importar uma pasta de Skill aberta de outro repositório, com fonte e licença registradas; o importado nasce RASCUNHO. Canais: `skills:listar`, `skills:criar`, `skills:decidir` e `skills:importar` (código em `backend/agentes/banco/` e `backend/agentes/regras/`). Na interface: Agentes › configuração do agente › **Skills** (`frontend/agentes/tela-agentes.parte.js`, função `secaoSkills`).

O MCP compartilha o núcleo da CLI e oferece prompts de especialização e `propor_aprendizado`. A ferramenta cria rascunho com política e limite; não oferece aprovação humana. O envio de conhecimento ao contexto externo respeita a permissão de compartilhamento do projeto. Documentos e conhecimentos são dados, nunca ordens executáveis.

## Limites da entrega

Qase/Jira/GitHub são verificados com serviços simulados nos testes, sem credenciais reais. Autenticação e publicação reais dependem de uma conta configurada. O reaproveitamento de Quality Control (portfólio) e QA-Orchestrator já foi documentado em [REAPROVEITAMENTO-2.8.md](REAPROVEITAMENTO-2.8.md): identidade visual, agenda, fila e worker foram adaptados ao núcleo único. Esta entrega completa os vínculos de teste e o ciclo do assistente sobre esses módulos; não inicia um segundo daemon nem transfere dados de outros repositórios.

A pasta de automação é necessária para ler arquivos locais; conectar o GitHub não equivale a baixar código privado. A cobertura de sistemas web, mobile e outros depende de capabilities e runners declarados pelo projeto, não de detecção universal.

## Orquestração observável

Quando uma pergunta do chat envolve duas ou mais especialidades com sinal forte no roteamento (pelo menos 3 pontos cada, no máximo 3 especialistas) e a pessoa não escolheu um agente, o orquestrador consulta cada especialista, um de cada vez, e junta as respostas (`backend/agentes/chat/planejarOrquestracao.ts` e `orquestrar.ts`). Cada etapa registra ordem, início, fim, duração, fontes consultadas e estado (concluída, sem dados ou falhou, com o motivo mascarado); a falha de um não interrompe os outros. O registro fica em `orquestracoes.jsonl` na pasta de dados, só com metadados (sem a pergunta e sem as respostas), até 500 registros, e aparece em Agentes › Painel de atividades › Orquestrações recentes (canal `agentes:orquestracoes`). As etapas são independentes: nenhuma usa o resultado de outra. Isso é orquestração local e sequencial; distribuir tarefas em paralelo para IAs externas ainda não existe.
