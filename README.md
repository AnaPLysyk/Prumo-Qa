# Prumo QA

Prumo QA é um aplicativo desktop para gestão local de projetos, integrações, testes, agendamentos, agentes e evidências. O código está organizado para separar interface e regras de negócio por tela, mantendo o fluxo principal explícito e fácil de rastrear.

## Visão geral

- `frontend/`: telas, componentes visuais e interações da interface.
- `backend/`: regras, APIs IPC, persistência local e lógica de negócio.
- `testes/`: testes automáticos, fixtures e cenários de regressão.
- `frontend/construcao/`: geração e sincronização da interface. Scripts de apoio estão organizados em `testes/apoio/`, `docs/geradores/` e `site/release/`.
- `docs/`: documentação oficial, origem do projeto e arquitetura.
- `site/`: geração do site público e documentação estatica.
- `assets/`: ativos visuais e imagens de apoio.

## Arquitetura por tela

A regra principal do projeto é simples: cada funcionalidade de tela fica em uma pasta de responsabilidade e a interface conversa com o backend por canais IPC bem definidos.

- `frontend/<tela>/` — interface e comportamento da tela.
- `backend/<tela>/` — regras, APIs, persistência e integrações correspondentes.
- `backend/aplicativo/` — entrada da aplicação, IPC, janela, bandeja e contratos compartilhados.
- `backend/compartilhado/` — utilidades transversais.
- `backend/terminal/` — CLI e execução local por terminal.

Isso reduz acoplamento e facilita manutenção: para alterar uma área, a pessoa procura a pasta da tela correspondente e não atravessa o sistema inteiro.

## Como a aplicação se comunica

O fluxo mais comum é:

1. A interface em `frontend/` renderiza a tela e dispara uma ação.
2. Um canal IPC em `backend/aplicativo/api/` recebe a chamada.
3. A API da tela em `backend/<tela>/api/` valida e delega.
4. Regras e banco local em `backend/<tela>/regras/` e `backend/<tela>/banco/` executam a ação.
5. O resultado volta para a UI, com os eventos e registros necessários.

Essa separação torna o comportamento previsível e ajuda a localizar a origem de regressões.

## Onde revisar cada área

- `frontend/inicio/` e `backend/inicio/` — tela inicial e ações de abertura.
- `frontend/projetos/` e `backend/projetos/` — espaços, vínculos e gestão de projetos.
- `frontend/testes/` e `backend/testes/` — casos, execução e evidências.
- `frontend/agendamentos/` e `backend/agendamentos/` — agendamento e worker.
- `frontend/agentes/` e `backend/agentes/` — chat, orchestration, skills e contexto.
- `frontend/conexoes/` e `backend/conexoes/` — integrações com Jira, Qase, GitHub e serviços.
- `frontend/configuracoes/` e `backend/configuracoes/` — ajustes do usuário.
- `frontend/administracao/` e `backend/administracao/` — contas, permissões e administração.
- `frontend/suporte/` e `backend/suporte/` — chamados e suporte interno.

## Convenção de navegação

No estilo Qase, o `Repositório` é o lugar dos casos, suítes e rastreabilidade dos testes; a aba `Runs` é a visão de execução, com filtros por situação e acompanhamento do que está em andamento ou já concluiu. Portanto, o filtro de andamento pertence a `Runs`, não ao repositório de testes. Ao abrir uma run, a interface deve listar os testes daquela execução e permitir abrir cada caso diretamente.

## Documentação e manutenção

A documentação oficial está em `docs/` e inclui:

- `docs/ORIGEM.md` — origem do projeto e decisões de arquitetura.
- `docs/ARQUITETURA-MODULAR-ATUAL.md` — visão modular e padrões de organização.
- `docs/SEGURANCA.md` — limites e regras de segurança.
- `docs/TESTES.md` — critérios e execução de testes.

Para validação local, use os comandos definidos em `package.json`:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run typecheck
npm run test
```

Ou, quando necessária, a checagem mais completa:

```powershell
npm run check
```

## Checklist rápido antes do PR

- Revise a arquitetura e os limites do projeto em `docs/ARQUITETURA-MODULAR-ATUAL.md` e `docs/SEGURANCA.md`.
- Mantenha alteração local e por tela, sem misturar lógica de UI com regras de negócio.
- Valide com `npm run typecheck` e, quando a mudança for relevante, `npm run test` ou `npm run check`.

## Regra de contribuição

- Mantenha a separação por tela.
- Não altere arquivos gerados em `dist/` ou `site/public/` manualmente.
- Prefira ajustes pequenos e bem localizados.
- Antes de remover ou mover código, confirme se há referências válidas em backend, frontend, testes e geração.
- Documente o comportamento em `docs/` quando a alteração mudar a arquitetura ou a operação.

Esse repositório busca ser simples, explícito e fácil de manter: arquitetura por tela, contratos de comunicação bem definidos e documentação viva para reduzir ruído e ambiguidade.
