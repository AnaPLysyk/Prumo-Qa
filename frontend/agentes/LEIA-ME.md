# Agentes (interface)

**O que a tela faz:** mostra o orquestrador, os clientes de IA conectados por MCP e as oito especializações do projeto. Em cada agente: configuração (disponibilidade e permissões), **Skills** (trechos de instrução do banco `skills.db`), Cérebro (o que o agente consulta) e o Painel de atividades.

| Arquivo | O que tem dentro |
| --- | --- |
| `interfaces-v36-trecho-11.parte.js` | A tela Agentes: lista, configuração (`detail`), seção Skills (`secaoSkills`), Cérebro (`brain`) e Painel de atividades (`activity`). |
| `interfaces-v36-trecho-02.parte.js` | Retrato, paralaxe e fundo neural usados pelos agentes. |
| `interfaces-v36-trecho-04.parte.js` | Bolhas, digitação, voz e sugestões do chat dos agentes. |
| `interfaces-v36-trecho-06.parte.js` | Assistente flutuante (abrir, encaixar, mover, dicas). |
| `interfaces-v36-trecho-02/06/08/10.parte.css` | Estilos da tela: retratos, cérebro, tema claro e escuro, cartões de Skill. |
| `atividades/painel-atividades-v41.js` e `.css` | Painel de atividades montado a partir dos registros locais. |
| `usarTelaAgentes.js` | Guarda a tela anterior antes do carregamento de Conexões. |
| `mostrarAgentesIntegrados.js` | Lista de agentes integrados com profissão, especialidade e permissão efetiva. |
| `abrirModalContextos.js` | Modal de Contextos aberto a partir desta tela. |

Os arquivos `.parte.js/.css` são juntados, na ordem de `ferramentas/frontend/telas-modulares.json`, em `app/renderer/interfaces-v36.js` e `.css` durante o build. Edite só aqui; `app/renderer/` é gerado.

**De onde vêm os dados:** a tela chama `window.prumo` (`app/preload.cjs`), cujos canais IPC são validados em `backend/aplicativo/api/catalogoDeContratos.ts` e atendidos em `backend/agentes/api/` (por exemplo `skillsListar.ts`, `skillsCriar.ts`, `skillsDecidir.ts`, `skillsImportar.ts`). São canais IPC da janela, não endpoints HTTP.

**Skills:** só trechos APROVADOS vão para a IA externa. O que a equipe escreve nasce aprovado; pasta importada (licença aberta) e sugestão de IA nascem rascunho e esperam a decisão da pessoa. Detalhes em `docs/SKILLS.md`.
