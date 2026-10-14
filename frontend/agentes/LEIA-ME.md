# Agentes (interface)

**O que a tela faz:** mostra o orquestrador, os clientes de IA conectados por MCP e as oito especializações do projeto. Em cada agente: configuração (disponibilidade e permissões), **Skills** (trechos de instrução do banco `skills.db`), Cérebro (o que o agente consulta) e o Painel de atividades.

| Arquivo | O que tem dentro |
| --- | --- |
| `tela-agentes.parte.js` | A tela Agentes: lista, configuração (`detail`), seção Skills (`secaoSkills`), Cérebro (`brain`) e Painel de atividades (`activity`). |
| `retratos-dos-agentes.parte.js` | Retrato, paralaxe e fundo neural usados pelos agentes. |
| `conversa-do-orchestrator.parte.js` | Bolhas, digitação, voz e sugestões do chat dos agentes. |
| `orchestrator-flutuante.parte.js` | Assistente flutuante (abrir, encaixar, mover, dicas). |
| `interfaces-v36-trecho-02/06/08/10.parte.css` | Estilos da tela: retratos, cérebro, tema claro e escuro, cartões de Skill. |
| `atividades/painel-atividades-v41.js` e `.css` | Painel de atividades montado a partir dos registros locais. |
| `usarTelaAgentes.js` | Guarda a tela anterior antes do carregamento de Conexões. |
| `mostrarAgentesIntegrados.js` | Lista de agentes integrados com profissão, especialidade e permissão efetiva. |
| `abrirModalContextos.js` | Modal de Contextos aberto a partir desta tela. |

Os arquivos `.parte.js/.css` são juntados, na ordem de `ferramentas/frontend/telas-modulares.json`, em `dist/renderer/interfaces-v36.js` e `.css` durante o build. Edite só aqui; `dist/renderer/` é gerado.

**De onde vêm os dados:** a tela chama `window.prumo` (`backend/aplicativo/preload.cjs`), cujos canais IPC são validados em `backend/aplicativo/api/catalogoDeContratos.ts` e atendidos em `backend/agentes/api/` (por exemplo `skillsListar.ts`, `skillsCriar.ts`, `skillsDecidir.ts`, `skillsImportar.ts`). São canais IPC da janela, não endpoints HTTP.

**Skills:** só trechos APROVADOS vão para a IA externa. O que a equipe escreve nasce aprovado; pasta importada (licença aberta) e sugestão de IA nascem rascunho e esperam a decisão da pessoa. Detalhes em `docs/SKILLS.md`.
