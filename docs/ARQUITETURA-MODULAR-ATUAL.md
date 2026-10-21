# Arquitetura e manutenção — Prumo QA

**Versão do projeto:** 2.18.0. Este documento descreve a organização da branch de trabalho. Para navegar pelos arquivos, telas, canais IPC e dependências realmente presentes, use o mapa gerado pela **Documentação Viva** no build, em vez de uma lista manual de cada arquivo.

## 1. Comece pela funcionalidade

A organização é por tela ou domínio. Cada mudança deve começar na pasta com o mesmo nome:

| Funcionalidade | Interface | Backend |
| --- | --- | --- |
| Início | `frontend/inicio/` | `backend/inicio/` |
| Projetos (inclui conexões) | `frontend/projetos/` | `backend/projetos/` |
| Tickets | `frontend/tickets/` | `backend/tickets/` |
| Testes, Runs e Evidências | `frontend/testes/` | `backend/testes/` |
| Agendamentos | `frontend/agendamentos/` | `backend/agendamentos/` |
| Métricas | `frontend/metricas/` | `backend/metricas/` |
| Logs | `frontend/logs/` | `backend/logs/` |
| Agentes e Contextos | `frontend/agentes/` | `backend/agentes/` |
| Configurações | `frontend/configuracoes/` | `backend/configuracoes/` |
| Administração | `frontend/administracao/` | `backend/administracao/` |
| Ajuda e Suporte | `frontend/ajuda/`, `frontend/suporte/` | `backend/ajuda/`, `backend/suporte/` |
| Login | `frontend/login/` | `backend/login/` |

As pastas `compartilhado/` guardam funções realmente utilizadas por mais de uma funcionalidade. O `frontend/design-system/` guarda componentes, temas e estilos comuns. `backend/aplicativo/` cuida da janela Electron e dos canais; `backend/terminal/` e as entradas `backend/cli.ts`, `backend/mcp.ts` pertencem ao CLI e ao MCP. `frontend/construcao/` contém apenas os geradores da interface.

## 2. Responsabilidade de cada arquivo

No backend, a regra é **um arquivo por lógica ou entidade**, e não um arquivo para cada função pequena:

- `banco/`: operações relacionadas de persistência — criar, ler, alterar e excluir dados. Ex.: `backend/projetos/banco/projetos.ts`.
- `servico*.ts`: regras de negócio e orquestração da funcionalidade. Ex.: `backend/projetos/servicoProjetos.ts`.
- `controlador*.ts`: entrada das chamadas autorizadas da interface; delega ao serviço ou à persistência conforme o contrato.
- `integracoes/` ou módulos do serviço externo: consultas e envios a GitHub, Jira, Qase ou outro provedor. **Não confundir API externa com banco local.**
- `contratos.ts` ou `tipos/`: estrutura e validação dos dados, quando reutilizadas.
- `regras/`, `chat/`, `mcp/`, `worker/`: subdomínios com responsabilidade própria; só existem quando simplificam a manutenção.

Nem toda pasta precisa de todos esses arquivos. Evite níveis com um único arquivo quando ele puder ficar identificado na pasta da funcionalidade. Preserve arquivos independentes quando uma união provocar ciclos, misturar credenciais com regras, quebrar contratos ou prejudicar o isolamento dos testes.

## 3. Exemplo real: salvar um projeto

```text
frontend/projetos/
  tela-projetos.js                          tela, formulários, vínculos e pastas locais
       ↓
backend/aplicativo/preload.cjs              ponte Electron (IPC)
backend/aplicativo/api/                     registro e validação dos canais
       ↓
backend/projetos/controlador.ts             entrada da funcionalidade
       ↓
backend/projetos/servicoProjetos.ts         regras e validações de projeto
       ↓
backend/projetos/banco/projetos.ts          leitura e gravação de dados
```

A fronteira local Electron usa **IPC**, não endpoints HTTP. Existem serviços HTTP específicos, como o login remoto em `backend/login/servidor/` e o suporte; eles devem permanecer separados do IPC. A persistência local e o servidor PostgreSQL de autenticação também têm responsabilidades diferentes.

## 4. Como editar o frontend sem duplicá-lo

- **Fonte:** `frontend/<tela>/` e `frontend/compartilhado/`; não edite os compilados em `dist/renderer/`.
- **Scripts da janela:** `frontend/compartilhado/runtime/index.html` define os caminhos e a ordem de carregamento. Ao mover um script independente, atualize a referência e os testes que conferem o caminho.
- **Navegação entre telas:** `frontend/compartilhado/runtime/app.js` escolhe a tela inicial indicada pelo login e renderiza cada tela isoladamente. Se a montagem lançar uma exceção, mostra um estado de erro com **Tentar novamente**, sem deixar uma tela parcial.
- **Menu e preferências:** `frontend/compartilhado/navegacaoDaJanela.js` cuida do menu lateral, do seletor de projetos e dos atalhos globais; `frontend/configuracoes/preferenciasDaJanela.js` mantém tema, cor e idioma. O estilo global do menu fica em `frontend/design-system/estilos-das-telas.parte.css`, e não na pasta da tela Configurações.
- **Partes de telas:** `*.parte.js` e `*.parte.css` são concatenados, na ordem de `frontend/construcao/telas-modulares.json`, nos bundles do renderer. Essas partes não devem ser carregadas individualmente pelo HTML.
- **Recursos comuns:** `frontend/recursos.json` mapeia estilos, login, traduções, identidade visual e recursos de terceiros para os caminhos distribuídos; não crie cópias editáveis adicionais.
- **Formulários e componentes:** o estilo e o componente visual reutilizável ficam em `frontend/design-system/`; a montagem dos dados e as decisões da tela permanecem no arquivo de sua própria tela. Evite criar subpastas para funções pequenas.
- **Falhas de consulta:** não transforme `null` (erro ou consulta não concluída) em `[]` (lista realmente vazia). Projetos exibe um estado de erro quando a consulta de projetos ou contas autorizadas falha. Em Projetos, a lista gerenciada já consultada é repassada para `mostrarPastasLocais`, evitando a segunda chamada. Em Agentes, a falha de leitura não esconde o Orchestrator e oferece nova tentativa. Em Testes, resultados locais indisponíveis geram um aviso explícito, em vez de serem apresentados como uma consulta vazia. Nas subabas Runs e Planos, um erro de consulta não deve ser tratado como lista vazia; os dados parciais recebem aviso, e a pessoa pode atualizar. Em Evidências, a nova tentativa mantém o identificador da evidência consultada.

Exemplos atuais: `frontend/agendamentos/tela-agendamentos.js`, `frontend/projetos/tela-projetos.js`, `frontend/projetos/tela-projetos.js`, `frontend/agentes/tela-agentes.parte.js` e `frontend/testes/propostas.js`.

A tela de Evidências apresenta dados e resultados da funcionalidade Testes, por isso compartilha `frontend/testes/`. O modal de Contextos pertence a Agentes, e não a uma tela independente. O desenho do painel de atividades dos agentes fica em `frontend/design-system/painel-atividades.js`; as consultas e decisões pertencem à tela Agentes.

## 5. Como validar uma manutenção

No Windows, a partir da raiz do projeto:

```powershell
npm.cmd run frontend:sync
node frontend/construcao/gerar-telas-modulares.mjs
npm.cmd run frontend:check
node frontend/construcao/gerar-telas-modulares.mjs --check
npm.cmd run check:isolado
```

O `build` já executa a sincronização do frontend, a geração dos bundles, a documentação de canais e a compilação TypeScript. O comando `check:isolado` também executa os testes **unitários**, sem acessar o perfil instalado e sem abrir o Electron real. Ele **não** comprova comportamento E2E, disponibilidade das APIs externas ou a publicação de uma release.

O inventário e as dependências são produzidos por `docs/geradores/` e consultáveis na Documentação Viva. As referências a caminhos deste arquivo explicam o padrão; para conferir se algo foi movido, consulte sempre o código e o catálogo gerado.

### Projetos por origem

Cada recurso selecionado no Jira, Qase ou GitHub origina um espaço Prumo com ID próprio e um único vínculo externo inicial. A opção manual não vincula serviços. Associações entre fornecedores exigem ação explícita dentro do mesmo projeto, com confirmação e validação de identidade; nomes semelhantes não criam vínculos. O backend usa `backend/projetos/servicoProjetos.ts` e `backend/conexoes/regras/nucleoServicos.ts`; a tela tem uma única fonte de comportamento em `frontend/projetos/tela-projetos.js`; o visual é exclusivo de `frontend/design-system/`.

## Mapa visual de conexões por projeto

A tela **Projetos** apresenta uma lista compacta. Abrir um projeto mostra um **mapa de origem**, com um núcleo Prumo QA e cinco ramificações independentes:

- **Manual / Prumo:** casos, tickets e propostas mantidos no próprio Prumo, sem fornecedor obrigatório.
- **Jira:** projeto externo de gestão/requisitos. Mostra a chave efetivamente vinculada e o estado de validação.
- **Qase:** projeto externo de casos e gestão de qualidade. Mostra a identidade específica da conta vinculada.
- **GitHub:** repositório de código. Mostra o repositório escolhido e oferece trazer a cópia para o computador quando ainda não há pasta local.
- **Pasta local:** diretório vinculado para a IDE e automações. Pode ser escolhido ou trocado pela confirmação nativa.

Cada ramificação exibe a condição real **vinculado/não vinculado**, o identificador de origem e comandos adequados: **Conectar**, **Verificar**, **Remover**, **Escolher pasta** ou **Trocar pasta**. O desenho não pressupõe equivalência entre projetos de serviços diferentes e não cria vínculos apenas pelo nome. **Conectar** abre a lista real da conta e exige confirmação antes de persistir. **Remover** usa o contrato existente e não exclui dados remotos. Os metadados completos ficam recolhidos em *Detalhes técnicos* para a tela permanecer limpa.

O mapa é só uma **representação dos vínculos**: não é o orquestrador de testes, não executa pipelines e não transfere dados entre fornecedores. O isolamento continua garantido por ID de projeto e por ID da conta/recurso. Alterar os vínculos de um projeto só reflete naquele projeto, inclusive ao abrir a IDE e os fluxos de Testes/Tickets.

**Para fazer manutenção:** a regra de cada botão, a seleção de conta, os IDs e o estado do projeto ficam em `frontend/projetos/tela-projetos.js`. O componente visual reutilizável `DS.fluxoProjeto` fica em `frontend/design-system/ds.js`, e **todos** os seus estilos, linhas, estados, tamanhos e comportamento responsivo ficam em `frontend/design-system/ds.css`. Não crie outro componente por fornecedor, nem folha de estilo na pasta da tela. O seletor GitHub usa o mesmo fluxo de importação de Jira/Qase, com uma opção extra de clonagem local.

## Conexões dentro de cada projeto

A tela independente **Conexões** foi incorporada a **Projetos**. Cada projeto de qualidade tem o painel expansível **Configurar contas, vínculos e permissões deste projeto**. A autorização de conta do Jira, Qase ou GitHub continua armazenada no cofre e pode ser reutilizada, mas a escolha do recurso, os vínculos, o histórico de operações, a pasta local e a permissão de escrita são **por projeto**. Remover uma credencial compartilhada pode afetar outros projetos; remover um vínculo não remove a credencial nem modifica o recurso remoto.

É possível autorizar uma conta antes de importar o primeiro projeto em **Projetos > Autorizar contas para importar projetos**. A integração Qase por token e sua prévia permanecem nessa área. O painel externo não é mais uma tela ou entrada do menu. A apresentação foi consolidada em frontend/projetos/tela-projetos.js, sem acrescentar arquivos.

O seletor lateral troca o ID do projeto ativo, atualiza o nome e renova o conteúdo dos módulos pela navegação comum. No menu, as legendas de Tickets e Testes mostram as fontes habilitadas para o projeto atual. Funcionalidades manuais continuam disponíveis independentemente das conexões. O contexto visual do menu fica em frontend/compartilhado/navegacaoDaJanela.js; sua aparência em frontend/design-system/ds.css. Credenciais e validações de API permanecem no backend de conexões por segurança.
