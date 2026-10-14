# Auditoria da refatoração

Checkpoint inicial: `245710462ee4859f3740807bb5bb85ec04b71478`, branch `simplificacao-didatica-prumo-qa`, versão `2.10.2`, árvore inicialmente limpa. O pedido foi confrontado com fontes, contratos e testes; a existência de um arquivo não foi contada como validação funcional.

## Implementado e funcionando

CLI e MCP compartilham o núcleo; `qa.project.json` vincula o próprio Prumo. A autoinspeção real da CLI (`doctor`, `context`, `evidence`) e do MCP (`tools/list`, `contexto_projeto`, `consultar_evidencias`) concluiu. `run build` sem aprovação retornou `BLOCKED` e não executou o comando. Essa recusa é comportamento verificado, não execução autorizada nem aprovação humana.

Modularização por tela, geradores de cópias/bundles, catálogo IPC/MCP, Electron e suíte de testes existem. Validações completas e de empacotamento devem ser consultadas no relatório da rodada atual; esta auditoria não substitui suas evidências.

## Implementado parcialmente

Design System já possui componentes e tokens, agora com fonte oficial e correções de teclado/ARIA. Oito especializações têm profissões/áreas declaradas e políticas efetivas. O painel de atividades v41 já representa operações MCP/CLI, conversas roteadas e execuções do worker a partir de registros locais, sem inferir vínculos ausentes; isso não equivale a um runtime de tarefas paralelas com múltiplos agentes. Documentação viva gera fluxos e dependências, mas não oferece toda a administração institucional solicitada.

Testes têm catálogo por camada/natureza/funcionalidade e seleção combinável. Arquivos mistos ainda não foram divididos por responsabilidade. Serviços externos são simulados nas regressões; resultados de fixtures não comprovam credenciais reais. Site tem geração modular e configuração de prévia manual; implantação dessa revisão não foi comprovada.

## Existente, mas necessitando refatoração

`frontend/` mantém fragmentos `.parte.js/.css` cuja ordem compõe IIFEs e escopos compartilhados. Sua consolidação exige preservar esses consumidores. `backend/` contém 816 fontes no checkpoint e ampla fragmentação; remover wrappers exige investigar contratos, geradores e imports. `scripts/` foi eliminada: as entradas de build, broker, release e migração passaram para `ferramentas/<finalidade>/` com os consumidores (package.json, CI, Render, electron-builder) atualizados. `app/` reúne runtime, preload, conteúdo público, vendor e arquivos gerados. `reporters/` contém o adaptador público de Playwright utilizado em projetos vinculados.

A validação IPC foi endurecida para página exata/frame principal/janela registrada. O verificador de dependências agora identifica imports ausentes antes de compilar, incluindo todos os consumidores de um helper removido.

## Ainda não implementado

Autenticação remota, sessão, logout/expiração, recuperação de acesso, gestão de usuários, RBAC multiusuário e PostgreSQL não existem no produto. `perfil.papel` não é autorização. Não foi entregue a refatoração completa de todas as telas, subfluxos e pastas solicitados, nem revisão humana com leitor de tela, comparação visual completa antes/depois ou painel de orquestração multiagente. Essas são pendências de implementação/validação, não bloqueios externos inventados.

## Evidências e limitações

`node ferramentas/arquitetura/inventario.mjs` produz contagens antes/depois a partir de arquivos reais. `npm run dependencias` verifica imports locais; `npm run arquitetura` gera o mapa navegável; `testes/catalogo.json` e `backend/agentes/skills/manifesto.json` são conferidos por testes estruturais. `tmp/evidencias/refatoracao/autoinspecao.json` contém respostas reais da autoinspeção, com dados de atividade isolados do perfil.

Nenhuma versão foi subida, publicada ou marcada como aprovada. Instalação/migração/desinstalação e publicação continuam exigindo evidências próprias. O relatório consolidado deve distinguir atividades concluídas e pendentes, falhas e skips, sem porcentagem de qualidade.
