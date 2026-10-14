# Marcos de entrega e critérios de aceite

Cada marco é publicado separadamente (tag própria, nunca reutilizada) e só quando o CI de distribuição passa.

## 2.3.1 — Estabilização e instalação segura

**Escopo:** correções posteriores à release 2.3.0 e preparação da instalação segura. Sem funcionalidade nova para o usuário final.

| Critério de aceite | Evidência |
|---|---|
| `WEAK_TEST` distingue o cenário associado a um teste ignorado do teste válido no mesmo arquivo, e nenhum dos dois conta como cobertura comprovada | `testes/qualidade.test.mjs` ("WEAK_TEST distingue…"); no laboratório, a 2.2.0 e a release 2.3.0 reprovam o critério de severidade do caso 7 e a correção o atende (`Prumo-QA-Lab/docs/RELATORIO-ENGENHARIA.md`) |
| Opções de assinatura investigadas com fontes oficiais, sem comprar nada nem usar certificado falso | `docs/ASSINATURA.md` |
| Build assina com credencial legítima quando existir e nunca finge assinatura; falha de assinatura interrompe o build; nenhuma credencial no Git | `scripts/assinar-windows.cjs`, `testes/assinatura.test.mjs` |
| Notas de release só dizem "assinado" depois de verificação Authenticode válida | `scripts/notas-versao.mjs`, etapa "Estado da assinatura" do workflow, `testes/versoes.test.mjs` |
| Roteiro de instalação e de autenticação humana para a titular; verificação do SHA-256 sem executar | `docs/INSTALACAO-MANUAL.md`, `scripts/verificar-download.ps1` |
| CI de distribuição (instalação 2.2.0 → atual sobre dados reais) passa | workflow `windows.yml` |

**Limites declarados:** o instalador continua não assinado; a instalação local e a autenticação humana ponta a ponta dependem da titular e do Windows (veja `docs/INSTALACAO-MANUAL.md`).

## 2.4.0 — Contextos e conhecimento de QA

Critérios definidos antes da implementação. Evidências: `testes/contextos.test.mjs`, `testes/frameworks.test.mjs`, `testes/desktop-contextos.test.mjs`, casos 9 a 14 do laboratório e o relatório de entrega.

- Contextos por projeto: cadastro, edição, aprovação humana explícita, conflito, desatualização, substituição, histórico verificável (hash encadeado), exclusão com confirmação, isolamento entre projetos, limites e proteção contra conteúdo malicioso.
- Disponibilização ao MCP **somente** se a pessoa habilitar, com referências estruturadas (fonte, versão, hash, estado); `revisar_cobertura` considera o contexto e acusa rascunho, desatualizado, conflito e origem ausente.
- Detecção de framework por evidências reais e especialização em Playwright e fundamentos de API (Skill, antipadrões, fontes oficiais, avaliação no laboratório).
- As quatro ferramentas MCP e os contratos existentes permanecem compatíveis.

## 2.5.0 — Suporte e notificações

Evidências: `testes/suporte.test.mjs`, `testes/preferencias.test.mjs`, `testes/desktop-suporte.test.mjs`, `docs/SUPORTE.md`.

- Central de suporte (bug, melhoria, sugestão) que prepara a solicitação localmente, mostra aviso de privacidade e abre o GitHub Issues oficial só após revisão e confirmação; exportação local sem GitHub; nada anexado automaticamente.
- Templates de issue e triagem segura (classificação apenas, sem executar texto de usuário).
- Indicador de atualização no cabeçalho (mouse, teclado e clique), som opcional que toca uma vez por versão, preferências persistentes, sem processo em segundo plano.
