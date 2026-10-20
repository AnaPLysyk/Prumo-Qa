# Arquitetura e manutenção — Prumo QA

**Versão do projeto:** 2.18.0. Este documento descreve a organização da branch de trabalho. Para navegar pelos arquivos, telas, canais IPC e dependências realmente presentes, use o mapa gerado pela **Documentação Viva** no build, em vez de uma lista manual de cada arquivo.

## 1. Comece pela funcionalidade

A organização é por tela ou domínio. Cada mudança deve começar na pasta com o mesmo nome:

| Funcionalidade | Interface | Backend |
| --- | --- | --- |
| Início | `frontend/inicio/` | `backend/inicio/` |
| Projetos | `frontend/projetos/` | `backend/projetos/` |
| Tickets | `frontend/tickets/` | `backend/tickets/` |
| Testes, Runs e Evidências | `frontend/testes/` | `backend/testes/` |
| Agendamentos | `frontend/agendamentos/` | `backend/agendamentos/` |
| Métricas | `frontend/metricas/` | `backend/metricas/` |
| Logs | `frontend/logs/` | `backend/logs/` |
| Conexões | `frontend/conexoes/` | `backend/conexoes/` |
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
  mostrarProjetos.js                        tela e ações de usuário
  modais/abrirFormularioProjeto.js          formulário de criação/edição
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
- **Menu e preferências:** `frontend/compartilhado/navegacaoDaJanela.js` cuida do menu lateral, do seletor de projetos e dos atalhos globais; `frontend/configuracoes/preferenciasDaJanela.js` mantém tema, cor e idioma. O estilo global do menu fica em `frontend/compartilhado/menuLateral.parte.css`, e não na pasta da tela Configurações.
- **Partes de telas:** `*.parte.js` e `*.parte.css` são concatenados, na ordem de `frontend/construcao/telas-modulares.json`, nos bundles do renderer. Essas partes não devem ser carregadas individualmente pelo HTML.
- **Recursos comuns:** `frontend/recursos.json` mapeia estilos, login, traduções, identidade visual e recursos de terceiros para os caminhos distribuídos; não crie cópias editáveis adicionais.
- **Formulários e componentes:** mantenha-os na pasta da tela. Use `componentes/` ou `modais/` somente quando houver mais de uma responsabilidade que justifique a subpasta.

Exemplos atuais: `frontend/agendamentos/montarFormularioRotina.js`, `frontend/conexoes/abrirFormularioConexao.js`, `frontend/projetos/modais/abrirRepositoriosGithub.js`, `frontend/agentes/abrirContextos.js` e `frontend/testes/montarFormularioProposta.js`.

A tela de Evidências apresenta dados e resultados da funcionalidade Testes, por isso compartilha `frontend/testes/`. O modal de Contextos pertence a Agentes, e não a uma tela independente. O painel de atividades dos agentes conserva seus próprios módulos em `frontend/agentes/atividades/`.

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
