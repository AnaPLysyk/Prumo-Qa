# Prumo QA — fontes oficiais por projeto

## Regra de produto
O projeto selecionado é o escopo de todas as consultas, escritas, casos, tickets, pastas e rastreabilidade. Não inferir relações por semelhança de nomes. Nenhuma conexão de leitura concede permissão de escrita. Operações externas exigem habilitação por serviço, confirmação nativa e conferência posterior.

## Jira — tickets
- Com vínculo Jira, a lista é consultada no projeto remoto vinculado. O botão principal abre o fluxo de criação no Jira; não oferece a criação de outro ticket local.
- Sem vínculo Jira, a pessoa pode criar tickets locais.
- Tickets locais antigos permanecem disponíveis como histórico/propostas; não substituem o registro remoto.
- A criação, atualização, comentário e transição remotos usam o catálogo de operações e o livro-razão existente.

## Qase — casos
- Com vínculo Qase, a fonte dos casos e suites é o Qase. O botão principal 'Novo caso no Qase' consulta suites e usa a operação qase.criar_caso, exigindo escrita habilitada e confirmação nativa.
- Repositório remoto: a consulta pode ser paginada. A lista exibe 'casos carregados do Qase', e 'Carregar mais casos' acumula páginas sem duplicar IDs.
- Sem vínculo Qase, a pessoa pode criar e editar casos e suítes locais no repositório independente (`repositorio-testes-local.json`). Casos antigos de origem PESSOA em `propostas.json` são lidos sem duplicação e migrados ao editar. Propostas da IA continuam em revisão, separadas dos casos oficiais.
- Nenhum caso remoto é copiado para o cadastro local como segunda fonte oficial. O catálogo estático dos testes no código é separado do cadastro manual.

## Rastreabilidade
- As referências 'caso-local' apontam para IDs de casos independentes ou legados do mesmo projeto. 'ticket-local' ainda aponta para tickets locais no fluxo de propostas. O backend recusa ID ausente, tipo trocado, referência de outro projeto e origem externa falsificada.
- Quando existe Jira vinculado, a pessoa pode declarar vínculo do caso local com a chave Jira do projeto. O vínculo declarado não comprova sozinho a existência nem a aprovação do ticket externo.
- O mapa de vínculos registra esses recursos e distingue referências declaradas de evidências observadas. Vínculo não equivale a teste executado ou cobertura aprovada.

## GitHub, IDE, pipelines e agentes — próximas etapas
- Projeto pode ter pasta local ou repositório remoto GitHub; a leitura remota funciona em modo somente leitura e o clone exige confirmação. A IDE ainda prioriza catálogo de testes quando existe pasta local, não toda a árvore do repositório.
- Arquivos de workflow em .github/workflows podem ser criados/editados localmente; publicação remota de workflow ainda não é autorizada pelo catálogo de escrita do GitHub.
- Vincular projeto/repositório ainda não inicia automaticamente uma inspeção completa dos agentes. A vistoria inicial deve começar em modo somente leitura, com aprovação específica para qualquer execução.

## Evidências e limites
- Builds TypeScript e bundle frontend foram aprovados nas validações direcionadas da rodada de implementação.
- Testes de regressão das regras UI, escrita simulada Jira/Qase/GitHub e associações locais com módulos simulados foram executados sem tocar serviços externos.
- Não há aprovação ponta a ponta no Electron desta jornada, nem comprovação de persistência com projeto real, nem validação de criação Qase real nesta rodada.
- Não fazer release até concluir E2E isolado, testes manuais e verificação explícita das conexões e escopos remotos.

## Evolução do núcleo offline (15/10/2026)
- Núcleo independente preparado em `backend/testes/tipos/repositorioLocal.ts`, `banco/lerRepositorioLocal.ts`, `banco/gravarRepositorioLocal.ts` e regras `listarRepositorioLocal`, `salvarCasoLocal`, `salvarSuiteLocal`.
- Arquivo próprio: `repositorio-testes-local.json`. O esquema exige UUID, projeto correto, dados de caso validados e suíte pertencente ao projeto. Recusa criação local quando Qase está vinculado.
- Consulta agrega casos antigos de origem PESSOA salvos em `propostas.json` sem alterar esse arquivo. Ao editar um caso antigo pela nova regra, cria uma cópia no cadastro novo preservando o ID; a leitura passa a priorizar o registro novo e mantém o original como histórico/rollback.
- O mapa de vínculos identifica casos do novo repositório e antigos. A associação exige que a referência pertença ao mesmo projeto e tenha tipo válido.
- **Integração Electron implementada:** os canais `repositorio:listar`, `repositorio:caso` e `repositorio:suite` estão registrados no catálogo, no preload e no processo principal, com permissões Testes: VER/USAR e contratos estritos. A aba Repositório usa os novos canais para casos e suítes locais; os rascunhos de agentes permanecem em propostas. Testes estruturais e de contrato passaram; o E2E manual do Electron segue pendente.
- Os testes novos usam diretórios temporários isolados e mocks; não realizam chamadas aos serviços Jira/Qase/GitHub nem acessam projeto externo.

### Integridade adicional do núcleo offline
- Os campos `ticket` (Jira) e `suiteId` (Qase) presentes no cadastro antigo são preservados em `referenciasLegadas` ao consultar/migrar um caso. São referências históricas **não verificadas**: não substituem vínculo formal nem identidade de suíte local. O dado original em `propostas.json` não é apagado.
- Edição sem novos valores de requisito e risco preserva os anteriores. Caso um UUID existente pertença a outro projeto, a gravação é recusada (`LOCAL_CASE_SCOPE`), sem sobrescrever seus dados.
- Antes de gravar, textos de casos e suítes passam pelo mascarador existente de segredos. A verificação considera o arquivo inteiro e gravação atômica do Prumo; não grava credenciais em novo formato.
- A camada independente foi testada por funções Node com diretórios temporários; a interface, ponte e contratos foram compilados e inspecionados por testes de integração estrutural. **Ainda faltam** execução de jornadas reais da tela Electron em perfil de teste autorizado, migração com dados reais e validação visual/acessibilidade. Nenhuma release foi publicada.

### Verificação dinâmica dos formulários (15/10/2026)
- A interface de casos locais possui validações dinâmicas em Node VM com DOM sintético, sem Chromium, SQLite, projetos externos ou credenciais: novo caso com suíte e passos, edição legado, separação de proposta do Qase, erro de IPC e prevenção de envio duplicado.
- O formulário de suítes locais foi exercitado com criação, edição e falha de IPC. A montagem da lista local também foi executada em memória: casos e suítes do projeto, supressão da lista local quando há vínculo Qase e exibição explícita de erro IPC. São 11 testes dinâmicos dessa interface, além dos testes estáticos. Nenhum teste da rodada prova funcionamento real da janela Electron, login de pessoa ou confirmação nativa.
- Ajustado o formulário para exibir, editar e preservar **Dados de teste** em cada passo (`passos[].dados`), que já faz parte do contrato oficial do caso e antes não era incluído na gravação ao editar.

### Rastreabilidade local e Jira (validação em memória)
- O mapa atualiza os títulos de casos e tickets locais mesmo quando a declaração de vínculo criou o nó primeiro; preserva o identificador e a origem da relação.
- Um ticket Jira vinculado a um caso **local** não recebe lacuna falsa de 'ticket sem caso'; ticket Jira realmente sem caso Qase/local mantém a lacuna.
- O detalhe do caso local apresenta Ação, Dados de teste e Resultado esperado. Quatro testes de mapa com mocks e a regressão de interface exercitam os novos contratos, sem banco ou rede.

### Conferência de vínculo Jira antes da associação (15/10/2026)
- Para associar um caso local a um ticket Jira, o renderer exige primeiro GET autenticado de `ticket` dentro do recurso Jira vinculado ao projeto. O backend `planoDaConsultaJira` confere o ID do projeto retornado. Se a consulta falhar, a interface não chama `espacoAssociar`.
- Chave de outro projeto é recusada localmente sem consulta externa. A associação bem-sucedida continua marcada `DECLARADO_PELO_USUARIO`: a leitura confirma que o ticket existia e pertencia ao projeto naquele momento, mas não comprova cobertura, aprovação ou execução de teste.
- Lacunas de tickets sem casos agora contemplam tanto tickets Jira quanto tickets locais. Declarações entre caso e ticket não fabricam evidência de execução.
- Regressões dinâmicas usam consultas Jira simuladas sem rede; para comprovar operações reais no KAN/PQ, executar o roteiro `docs/auditorias/2026-10-15-roteiro-homologacao-jira-qase.md` em ambiente isolado e autorizado.
